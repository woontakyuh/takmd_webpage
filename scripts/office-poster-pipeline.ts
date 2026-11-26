import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readFile, readdir, stat } from 'node:fs/promises';
import { basename, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Euler, PerspectiveCamera, Vector3 } from 'three';
import presentationsData from '../src/data/presentations.json';
import talkRecords from '../src/data/studio-talk-media.json';
import { MONITOR, ROOM } from '../src/components/studio/scene/config';
import type { CameraPose } from '../src/components/studio/scene/config';
import { DESKTOP_ENTRY, MOBILE_ENTRY } from '../src/components/studio/officeEntry';
import { MONITOR_SCREEN } from '../src/components/studio/scene/monitorReading';

export const POSTER_ROOT = fileURLToPath(new URL('../', import.meta.url));
const fingerprintRoots = [
  'astro.config.mjs', 'package.json', 'bun.lock', 'package-lock.json',
  'scripts/capture-office-posters.ts', 'scripts/office-poster-pipeline.ts',
  'src',
  'public/images', 'public/legacy.css', 'public/models', 'public/studio', 'public/textures',
] as const;

function isGeneratedPoster(path: string): boolean {
  const name = basename(path);
  return path.endsWith('src/components/studio/office-poster-manifest.json')
    || /^office-preview-(?:auto-|day\.webp|night\.webp|day-mobile\.webp|night-mobile\.webp)/.test(name);
}

async function filesBelow(path: string): Promise<readonly string[]> {
  const info = await stat(path);
  if (info.isFile()) return isGeneratedPoster(path) ? [] : [path];
  const entries = await readdir(path, { withFileTypes: true });
  const nested = await Promise.all(entries.filter(entry => !entry.isSymbolicLink())
    .map(entry => filesBelow(join(path, entry.name))));
  return nested.flat();
}

function trackedInputFiles(): readonly string[] | null {
  const topLevel = spawnSync('git', ['rev-parse', '--show-toplevel'], {
    cwd: POSTER_ROOT, encoding: 'utf8',
  });
  if (topLevel.status !== 0 || resolve(topLevel.stdout.trim()) !== resolve(POSTER_ROOT)) return null;
  const result = spawnSync('git', ['ls-files', '-z', '--', ...fingerprintRoots], {
    cwd: POSTER_ROOT, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024,
  });
  if (result.status !== 0) return null;
  return result.stdout.split('\0').filter(Boolean).map(path => join(POSTER_ROOT, path)).filter(path => !isGeneratedPoster(path));
}

export function datedVisualState(reference: Date): string {
  const cutoff = reference.toISOString().slice(0, 10);
  const mediaIds = new Set(talkRecords.map(record => record.id));
  const featured = presentationsData.presentations.filter(talk => talk.date <= cutoff && mediaIds.has(talk.id))
    .toSorted((a, b) => b.date.localeCompare(a.date))[0] ?? presentationsData.presentations[0];
  const dated = presentationsData.presentations.filter(talk => talk.date.length >= 10 && talk.name.trim().length > 0);
  const delivered = dated.filter(talk => talk.date.slice(0, 10) <= cutoff).toSorted((a, b) => b.date.localeCompare(a.date));
  const upcoming = dated.filter(talk => talk.date.slice(0, 10) > cutoff).toSorted((a, b) => a.date.localeCompare(b.date));
  const board = [...delivered, ...upcoming].slice(0, 2)
    .map(talk => `${talk.id}:${talk.date.slice(0, 10) <= cutoff ? 'delivered' : 'upcoming'}`);
  return JSON.stringify({ featured: featured?.id ?? null, board });
}

export async function sourceFingerprint(reference = new Date()): Promise<string> {
  const tracked = trackedInputFiles();
  const files = (tracked ?? (await Promise.all(fingerprintRoots.map(path => filesBelow(join(POSTER_ROOT, path))))).flat()).toSorted();
  const hash = createHash('sha256');
  for (const path of files) {
    hash.update(relative(POSTER_ROOT, path)); hash.update('\0');
    hash.update(await readFile(path)); hash.update('\0');
  }
  hash.update('dated-visual-state\0'); hash.update(datedVisualState(reference)); hash.update('\0');
  return hash.digest('hex');
}

export type CaptureVariant = {
  readonly id: string;
  readonly media: string | null;
  readonly width: number;
  readonly height: number;
  readonly compact: boolean;
  readonly camera: CameraPose;
  readonly fov: number;
};

export type PosterGeometry = {
  readonly x: number;
  readonly y: number;
  readonly across: readonly [number, number];
  readonly down: readonly [number, number];
};

// Each master is the widest useful aspect ratio in one camera/FOV class. A
// narrower viewport is an exact centered crop because Three uses vertical FOV.
export const CAPTURE_VARIANTS = {
  mobilePortrait: {
    id: 'mobile-portrait', media: '(max-width: 759px) and (aspect-ratio < 1/1)',
    width: 759, height: 760, compact: true, camera: MOBILE_ENTRY, fov: 60,
  },
  mobileLandscape: {
    id: 'mobile-landscape', media: '(max-width: 759px) and (aspect-ratio >= 1/1)',
    width: 759, height: 320, compact: true, camera: MOBILE_ENTRY, fov: 42,
  },
  desktopPortrait: {
    id: 'desktop-portrait', media: '(min-width: 760px) and (aspect-ratio < 1/1)',
    width: 1024, height: 1025, compact: false, camera: DESKTOP_ENTRY, fov: 60,
  },
  desktopLandscape: {
    id: 'desktop-landscape', media: null,
    width: 3840, height: 1080, compact: false, camera: DESKTOP_ENTRY, fov: 42,
  },
} as const satisfies Readonly<Record<string, CaptureVariant>>;

export const ORDERED_CAPTURE_VARIANTS: readonly CaptureVariant[] = [
  CAPTURE_VARIANTS.mobilePortrait,
  CAPTURE_VARIANTS.mobileLandscape,
  CAPTURE_VARIANTS.desktopPortrait,
  CAPTURE_VARIANTS.desktopLandscape,
];

export function captureVariantForViewport(width: number, height: number): CaptureVariant {
  if (width <= 759) return width < height ? CAPTURE_VARIANTS.mobilePortrait : CAPTURE_VARIANTS.mobileLandscape;
  return width < height ? CAPTURE_VARIANTS.desktopPortrait : CAPTURE_VARIANTS.desktopLandscape;
}

function project(point: Vector3, camera: PerspectiveCamera, width: number, height: number): readonly [number, number] {
  const projected = point.project(camera);
  return [(projected.x + 1) * width / 2, (1 - projected.y) * height / 2];
}

export function projectMonitorGeometry(variant: CaptureVariant): PosterGeometry {
  const camera = new PerspectiveCamera(variant.fov, variant.width / variant.height, 0.015, 60);
  camera.position.set(...variant.camera.position);
  camera.lookAt(...variant.camera.target);
  camera.updateMatrixWorld();
  camera.updateProjectionMatrix();
  const localToWorld = (x: number, y: number): Vector3 => new Vector3(x, y, MONITOR_SCREEN.surface[2] - 0.001)
    .applyEuler(new Euler(MONITOR_SCREEN.tilt, 0, 0))
    .add(new Vector3(...MONITOR_SCREEN.mount))
    .applyEuler(new Euler(0, ROOM.monitor.rotation, 0))
    .add(new Vector3(...ROOM.monitor.position));
  const topLeft = project(localToWorld(-MONITOR.width / 2, MONITOR.height / 2), camera, variant.width, variant.height);
  const topRight = project(localToWorld(MONITOR.width / 2, MONITOR.height / 2), camera, variant.width, variant.height);
  const bottomLeft = project(localToWorld(-MONITOR.width / 2, -MONITOR.height / 2), camera, variant.width, variant.height);
  return {
    x: topLeft[0], y: topLeft[1],
    across: [topRight[0] - topLeft[0], topRight[1] - topLeft[1]],
    down: [bottomLeft[0] - topLeft[0], bottomLeft[1] - topLeft[1]],
  };
}

export function displayedPosterGeometry(
  geometry: PosterGeometry,
  source: Pick<CaptureVariant, 'width' | 'height'>,
  target: { readonly width: number; readonly height: number },
): PosterGeometry {
  const scale = Math.max(target.width / source.width, target.height / source.height);
  const offsetX = (target.width - source.width * scale) / 2;
  const offsetY = (target.height - source.height * scale) / 2;
  return {
    x: offsetX + geometry.x * scale,
    y: offsetY + geometry.y * scale,
    across: [geometry.across[0] * scale, geometry.across[1] * scale],
    down: [geometry.down[0] * scale, geometry.down[1] * scale],
  };
}
