import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { z } from 'astro/zod';
import geography from '../public/models/han-river/geography.json';
import { insideRing, canopyElevation } from '../src/components/studio/scene/BanpoCanopyPlacement';
import type { BanpoLocalStreet } from '../src/components/studio/scene/BanpoLocalStreets';

export const STREET_EXTENT = { west: -2500, east: 3000, south: 650, north: 4200 } as const;
const HIGHWAYS = ['secondary', 'tertiary', 'residential', 'unclassified', 'service', 'living_street'] as const;
const WIDTHS = { secondary: 12, tertiary: 9, residential: 5.5, unclassified: 6, service: 3, living_street: 4 } as const;
const pointSchema = z.object({ lat: z.number().finite(), lon: z.number().finite() });
const sourceSchema = z.object({ osm3s: z.object({ timestamp_osm_base: z.string() }), elements: z.array(z.object({
  id: z.number().int(), tags: z.record(z.string()).optional(), geometry: z.array(pointSchema).optional(),
})) });
const highwaySchema = z.enum(HIGHWAYS);
export type StreetSource = z.infer<typeof sourceSchema>;
type Point = readonly [number, number];
const scale = 111320 * Math.cos(geography.origin[0] * Math.PI / 180);
const river = geography.banks.flat();
const round = (n: number): number => Math.round(n * 10) / 10;
const interpolate = (a: Point, b: Point, t: number): Point => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const cross = (a: Point, b: Point): number => a[0] * b[1] - a[1] * b[0];
const inExtent = (p: Point): boolean => p[0] >= STREET_EXTENT.west && p[0] <= STREET_EXTENT.east
  && p[1] >= STREET_EXTENT.south && p[1] <= STREET_EXTENT.north;

export function parseStreetSource(text: string): StreetSource { return sourceSchema.parse(JSON.parse(text)); }

/** Clips actual segments at extent and shoreline crossings, without moving a road inland. */
export function clipStreetSegment(a: Point, b: Point): readonly (readonly [Point, Point])[] {
  const ts = [0, 1]; const delta: Point = [b[0] - a[0], b[1] - a[1]];
  for (const [axis, edge] of [[0, STREET_EXTENT.west], [0, STREET_EXTENT.east], [1, STREET_EXTENT.south], [1, STREET_EXTENT.north]] as const) {
    if (delta[axis] === 0) continue;
    const t = (edge - a[axis]) / delta[axis]; if (t > 0 && t < 1) ts.push(t);
  }
  for (let i = 0; i < river.length; i++) {
    const c = river[i]; const d = river[(i + 1) % river.length];
    const edge: Point = [d[0] - c[0], d[1] - c[1]]; const divisor = cross(delta, edge);
    if (Math.abs(divisor) < 1e-8) continue;
    const from: Point = [c[0] - a[0], c[1] - a[1]];
    const t = cross(from, edge) / divisor; const u = cross(from, delta) / divisor;
    if (t > 0 && t < 1 && u >= 0 && u <= 1) ts.push(t);
  }
  ts.sort((x, y) => x - y);
  const pieces: [Point, Point][] = [];
  for (let i = 0; i < ts.length - 1; i++) {
    const p = interpolate(a, b, ts[i]); const q = interpolate(a, b, ts[i + 1]);
    const mid = interpolate(p, q, .5);
    if (ts[i + 1] - ts[i] < 1e-8 || !inExtent(mid) || insideRing(mid, river) || canopyElevation(mid) === undefined) continue;
    pieces.push([[round(p[0]), round(p[1])], [round(q[0]), round(q[1])]]);
  }
  return pieces;
}

export function generateLocalStreets(source: StreetSource): readonly BanpoLocalStreet[] {
  const result: BanpoLocalStreet[] = [];
  for (const element of source.elements.toSorted((a, b) => a.id - b.id)) {
    const tags = element.tags; const geometry = element.geometry;
    if (!tags || !geometry || geometry.length < 2) continue;
    const highway = highwaySchema.safeParse(tags.highway);
    if (!highway.success || (tags.bridge && tags.bridge !== 'no') || (tags.tunnel && tags.tunnel !== 'no')
      || Number(tags.layer ?? 0) < 0 || tags.location === 'underground') continue;
    const taggedWidth = tags.width?.match(/^\s*(\d+(?:\.\d+)?)\s*(?:m)?\s*$/i);
    const width = taggedWidth ? Number(taggedWidth[1]) : undefined;
    const widthM = width !== undefined && width >= 1 && width <= 40 ? width : WIDTHS[highway.data];
    const widthProvenance = width !== undefined && width >= 1 && width <= 40 ? 'osm-width' : 'visual-class-estimate';
    const points: Point[] = geometry.map(p => [(p.lon - geography.origin[1]) * scale, (p.lat - geography.origin[0]) * 111320]);
    let run: Point[] = []; let part = 0;
    const flush = (): void => {
      if (run.length >= 2) result.push({ id: `${element.id}:${part++}`, wayId: element.id, highway: highway.data,
        name: tags.name ?? null, widthM, widthProvenance, p: run });
      run = [];
    };
    for (let i = 0; i < points.length - 1; i++) {
      const pieces = clipStreetSegment(points[i], points[i + 1]);
      if (pieces.length === 0) { flush(); continue; }
      for (const [a, b] of pieces) {
        const last = run.at(-1);
        if (last && (last[0] !== a[0] || last[1] !== a[1])) flush();
        if (run.length === 0) run.push(a);
        if (a[0] !== b[0] || a[1] !== b[1]) run.push(b);
      }
    }
    flush();
  }
  return result;
}

if (import.meta.main) {
  const path = new URL('./fixtures/banpo-streets-osm-2026-09-12.json.gz', import.meta.url);
  const bytes = gunzipSync(readFileSync(path)); const source = parseStreetSource(bytes.toString());
  const features = generateLocalStreets(source);
  const data = { origin: geography.origin, extent: STREET_EXTENT, osmTimestamp: source.osm3s.timestamp_osm_base,
    sourceSha256: createHash('sha256').update(bytes).digest('hex'),
    sourceURLs: ['https://www.openstreetmap.org/copyright', 'https://overpass-api.de/api/interpreter'], features };
  writeFileSync(new URL('../public/models/han-river/local-streets.json', import.meta.url), `${JSON.stringify(data)}\n`);
  process.stdout.write(`${JSON.stringify({ sourceWays: source.elements.length, retainedWays: new Set(features.map(f => f.wayId)).size,
    parts: features.length, points: features.reduce((n, f) => n + f.p.length, 0), widthTags: features.filter(f => f.widthProvenance === 'osm-width').length,
    timestamp: data.osmTimestamp, sourceSha256: data.sourceSha256 }, null, 2)}\n`);
}
