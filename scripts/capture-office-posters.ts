import { createHash } from 'node:crypto';
import { spawn, type ChildProcess } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { join, relative, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { chromium, type Browser } from 'playwright-core';
import sharp from 'sharp';
import { datedVisualState, ORDERED_CAPTURE_VARIANTS, POSTER_ROOT, projectMonitorGeometry, sourceFingerprint, type CaptureVariant } from './office-poster-pipeline';
type PosterVariant = {
  readonly id: string; readonly media: string | null;
  readonly width: number; readonly height: number;
  readonly daySrc: string; readonly nightSrc: string;
  readonly dayHash: string; readonly nightHash: string;
  readonly monitor: ReturnType<typeof projectMonitorGeometry>;
};
type PosterManifest = {
  readonly version: 1; readonly fingerprint: string; readonly generatedAt: string; readonly variants: readonly PosterVariant[];
};
class PosterPipelineError extends Error {
  constructor(message: string) { super(message); this.name = 'PosterPipelineError'; }
}
const root = POSTER_ROOT;
const manifestPath = join(root, 'src/components/studio/office-poster-manifest.json');
const publicStudio = join(root, 'public/studio');
function parsedManifest(value: unknown): PosterManifest | null {
  if (typeof value !== 'object' || value === null || !('fingerprint' in value) || !('variants' in value)
    || typeof value.fingerprint !== 'string' || !Array.isArray(value.variants)) return null;
  const variants: PosterVariant[] = [];
  for (const item of value.variants) {
    if (typeof item !== 'object' || item === null || !('id' in item) || !('media' in item)
      || !('width' in item) || !('height' in item) || !('daySrc' in item) || !('nightSrc' in item)
      || !('dayHash' in item) || !('nightHash' in item) || !('monitor' in item)
      || typeof item.id !== 'string' || !(typeof item.media === 'string' || item.media === null)
      || typeof item.width !== 'number' || typeof item.height !== 'number'
      || typeof item.daySrc !== 'string' || typeof item.nightSrc !== 'string'
      || typeof item.dayHash !== 'string' || typeof item.nightHash !== 'string'
      || typeof item.monitor !== 'object' || item.monitor === null) return null;
    const monitor = item.monitor;
    if (!('x' in monitor) || !('y' in monitor) || !('across' in monitor) || !('down' in monitor)
      || typeof monitor.x !== 'number' || typeof monitor.y !== 'number'
      || !Array.isArray(monitor.across) || !Array.isArray(monitor.down)
      || monitor.across.length !== 2 || monitor.down.length !== 2
      || !monitor.across.every(Number.isFinite) || !monitor.down.every(Number.isFinite)) return null;
    variants.push({ id: item.id, media: item.media, width: item.width, height: item.height,
      daySrc: item.daySrc, nightSrc: item.nightSrc, dayHash: item.dayHash, nightHash: item.nightHash, monitor: { x: monitor.x, y: monitor.y,
        across: [Number(monitor.across[0]), Number(monitor.across[1])],
        down: [Number(monitor.down[0]), Number(monitor.down[1])] } });
  }
  return { version: 1, fingerprint: value.fingerprint, generatedAt: 'generatedAt' in value && typeof value.generatedAt === 'string' ? value.generatedAt : '', variants };
}
async function readManifest(): Promise<PosterManifest | null> {
  const source = await readFile(manifestPath, 'utf8');
  const value: unknown = JSON.parse(source);
  return parsedManifest(value);
}
function publicPath(src: string): string {
  return join(root, 'public', new URL(src, 'https://poster.local').pathname);
}
async function manifestIsFresh(fingerprint: string): Promise<boolean> {
  const manifest = await readManifest();
  if (!manifest || manifest.fingerprint !== fingerprint || manifest.variants.length !== ORDERED_CAPTURE_VARIANTS.length) return false;
  const short = fingerprint.slice(0, 16);
  for (const [index, variant] of manifest.variants.entries()) {
    const expected = ORDERED_CAPTURE_VARIANTS[index];
    if (!expected || variant.id !== expected.id || variant.media !== expected.media
      || variant.width !== expected.width || variant.height !== expected.height
      || variant.daySrc !== `/studio/office-preview-auto-day-${expected.id}-${short}.webp?v=${short}`
      || variant.nightSrc !== `/studio/office-preview-auto-night-${expected.id}-${short}.webp?v=${short}`
      || !/^[a-f0-9]{64}$/.test(variant.dayHash) || !/^[a-f0-9]{64}$/.test(variant.nightHash)
      || JSON.stringify(variant.monitor) !== JSON.stringify(projectMonitorGeometry(expected))) return false;
    for (const [src, expectedHash] of [[variant.daySrc, variant.dayHash], [variant.nightSrc, variant.nightHash]] as const) {
      const path = publicPath(src);
      try {
        await stat(path);
      } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return false;
        throw error;
      }
      const metadata = await sharp(path).metadata();
      if (metadata.width !== variant.width || metadata.height !== variant.height) return false;
      if (createHash('sha256').update(await readFile(path)).digest('hex') !== expectedHash) return false;
    }
  }
  return true;
}
async function availablePort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolveListen, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolveListen);
  });
  const address = server.address();
  await new Promise<void>((resolveClose, reject) => server.close(error => error ? reject(error) : resolveClose()));
  if (!address || typeof address === 'string') throw new PosterPipelineError('Could not reserve a local capture port.');
  return address.port;
}
async function startServer(port: number): Promise<ChildProcess> {
  const child = spawn('bun', ['x', 'astro', 'dev', '--host', '127.0.0.1', '--port', String(port)], {
    cwd: root, env: { ...process.env, OFFICE_POSTER_CAPTURE: '1' }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  const output: string[] = [];
  child.stdout?.on('data', chunk => output.push(String(chunk)));
  child.stderr?.on('data', chunk => output.push(String(chunk)));
  try {
    await new Promise<void>((resolveReady, reject) => {
      const cleanup = () => {
        clearTimeout(timeout);
        child.stdout?.off('data', check);
        child.stderr?.off('data', check);
        child.off('exit', exited);
      };
      const check = () => {
        if (!output.join('').includes(`127.0.0.1:${port}`)) return;
        cleanup();
        resolveReady();
      };
      const exited = (code: number | null) => {
        cleanup();
        reject(new PosterPipelineError(`Astro capture server exited with ${code}.\n${output.join('').slice(-2000)}`));
      };
      const timeout = setTimeout(() => {
        cleanup();
        reject(new PosterPipelineError(`Astro capture server did not start.\n${output.join('').slice(-2000)}`));
      }, 60_000);
      child.stdout?.on('data', check);
      child.stderr?.on('data', check);
      child.once('exit', exited);
    });
  } catch (error) {
    await stopServer(child);
    throw error;
  }
  return child;
}
async function stopServer(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null) return;
  child.kill('SIGTERM');
  await new Promise<void>(resolveExit => {
    const timeout = setTimeout(() => { child.kill('SIGKILL'); resolveExit(); }, 5_000);
    child.once('exit', () => { clearTimeout(timeout); resolveExit(); });
  });
}
async function captureVariant(browser: Browser, baseUrl: string, variant: CaptureVariant, referenceTime: number,
  time: 'day' | 'night', destination: string): Promise<void> {
  const context = await browser.newContext({ viewport: { width: variant.width, height: variant.height },
      deviceScaleFactor: 1, reducedMotion: 'reduce', timezoneId: 'Asia/Seoul' });
  try {
    const page = await context.newPage();
    const pageErrors: string[] = [], responseErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('requestfailed', request => {
      if (new URL(request.url()).pathname !== '/api/visits') responseErrors.push(`${request.method()} ${request.url()}`);
    });
    page.on('response', response => { if (response.status() >= 400) responseErrors.push(`${response.status()} ${response.url()}`); });
    await page.route('**/api/visits', route => route.fulfill({ status: 204 }));
    await page.clock.setFixedTime(new Date(referenceTime));
    const captureUrl = new URL(baseUrl);
    captureUrl.searchParams.set('office-capture', 'seated');
    await page.goto(captureUrl.href, { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await page.locator('.office-poster[data-ready="true"]').waitFor({ state: 'attached', timeout: 120_000 });
    const lightButton = page.locator('.studio-tools > button').nth(1);
    await lightButton.click();
    await page.waitForFunction(() => document.querySelector('.studio-tools > button:nth-of-type(2)')?.getAttribute('aria-label')
      === 'Daylight preview · Preview evening');
    if (time === 'night') {
      await lightButton.click();
      await page.waitForFunction(() => document.querySelector('.studio-tools > button:nth-of-type(2)')?.getAttribute('aria-label')
        === 'Evening preview · Return to local light');
    }
    await page.locator('.studio').waitFor({ state: 'attached' });
    await page.waitForFunction(expected => document.querySelector('.studio')?.getAttribute('data-night') === expected,
      time === 'night' ? 'true' : 'false');
    await page.waitForLoadState('networkidle', { timeout: 120_000 });
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(Array.from(document.images, image => image.complete ? image.decode() : new Promise<void>((resolveImage, reject) => {
        image.addEventListener('load', () => resolveImage(), { once: true });
        image.addEventListener('error', () => reject(new Error(`Image failed: ${image.currentSrc}`)), { once: true });
      })));
    });
    await page.addStyleTag({ content: '.office-poster,.studio-header,.studio-tools,.office-bottom{display:none!important}' });
    await page.waitForTimeout(1_500);
    if (pageErrors.length || responseErrors.length) throw new PosterPipelineError(`Rendered page errors: ${[...pageErrors, ...responseErrors].join(' | ')}`);
    await page.screenshot({ path: destination, type: 'png', animations: 'disabled', scale: 'css' });
  } finally {
    await context.close();
  }
}
async function capture(fingerprint: string, referenceTime: number): Promise<void> {
  const short = fingerprint.slice(0, 16);
  const temporary = await mkdtemp(join(tmpdir(), 'takmd-office-posters-'));
  const evidence = resolve(root, process.env.OFFICE_POSTER_EVIDENCE ?? `.omo/evidence/office-posters/${short}`);
  const browser = await chromium.launch({ channel: 'chrome', headless: true,
    args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });
  const variants: PosterVariant[] = [];
  const receipt: { id: string; time: string; width: number; height: number; sha256: string }[] = [];
  try {
    const port = await availablePort();
    const server = await startServer(port);
    try {
      for (const variant of ORDERED_CAPTURE_VARIANTS) {
        const sources: Partial<Record<'day' | 'night', string>> = {};
        const hashes: Partial<Record<'day' | 'night', string>> = {};
        for (const time of ['day', 'night'] as const) {
          const png = join(temporary, `${time}-${variant.id}.png`);
          await captureVariant(browser, `http://127.0.0.1:${port}/`, variant, referenceTime, time, png);
          const name = `office-preview-auto-${time}-${variant.id}-${short}.webp`;
          const output = join(temporary, name);
          await sharp(png).webp({ quality: 86, effort: 5 }).toFile(output);
          const bytes = await readFile(output);
          const hash = createHash('sha256').update(bytes).digest('hex');
          receipt.push({ id: variant.id, time, width: variant.width, height: variant.height, sha256: hash });
          sources[time] = `/studio/${name}?v=${short}`;
          hashes[time] = hash;
        }
        if (!sources.day || !sources.night || !hashes.day || !hashes.night) throw new PosterPipelineError(`Capture incomplete for ${variant.id}.`);
        variants.push({ id: variant.id, media: variant.media, width: variant.width, height: variant.height,
          daySrc: sources.day, nightSrc: sources.night, dayHash: hashes.day, nightHash: hashes.night, monitor: projectMonitorGeometry(variant) });
      }
    } finally {
      await stopServer(server);
    }
  } finally {
    await browser.close();
  }
  await mkdir(publicStudio, { recursive: true });
  for (const item of receipt) {
    const time = item.time === 'day' ? 'day' : 'night';
    const name = `office-preview-auto-${time}-${item.id}-${short}.webp`;
    await copyFile(join(temporary, name), join(publicStudio, name));
  }
  const manifest: PosterManifest = { version: 1, fingerprint, generatedAt: new Date().toISOString(), variants };
  const manifestTemporary = `${manifestPath}.tmp`;
  await writeFile(manifestTemporary, `${JSON.stringify(manifest, null, 2)}\n`);
  await rename(manifestTemporary, manifestPath);
  await mkdir(evidence, { recursive: true });
  await writeFile(join(evidence, 'capture.json'), `${JSON.stringify({
    fingerprint,
    referenceTime: new Date(referenceTime).toISOString(),
    datedVisualState: JSON.parse(datedVisualState(new Date(referenceTime))),
    lightingModes: { day: 'daylight-preview', night: 'evening-preview' },
    localApi: { '/api/visits': 204 },
    variants,
    assets: receipt,
  }, null, 2)}\n`);
  await rm(temporary, { recursive: true, force: true });
  console.log(`Captured ${receipt.length} current-room posters for ${short}. Evidence: ${relative(root, evidence)}/capture.json`);
}
async function main(): Promise<void> {
  const reference = new Date();
  const fingerprint = await sourceFingerprint(reference);
  const fresh = await manifestIsFresh(fingerprint);
  if (process.argv.includes('--check')) {
    if (!fresh) throw new PosterPipelineError('Office posters are stale or incomplete. Run bun run posters:capture.');
    console.log(`Office posters are current for ${fingerprint.slice(0, 16)}.`);
    return;
  }
  if (fresh && !process.argv.includes('--force')) {
    console.log(`Office poster capture skipped; ${fingerprint.slice(0, 16)} is current.`);
    return;
  }
  await capture(fingerprint, reference.getTime());
}
if (import.meta.main) {
  try {
    await main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
