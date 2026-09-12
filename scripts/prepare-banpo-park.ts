import { readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { z } from 'astro/zod';
import geography from '../public/models/han-river/geography.json';
import { insideRing, lineDistance } from '../src/components/studio/scene/BanpoCanopyPlacement';
import type { ParkFeature, ParkKind, ParkPoint } from '../src/components/studio/scene/BanpoParkData';

const sourceSchema = z.object({ sourceURL: z.string().url(), retrieved: z.string(), elements: z.array(z.object({
  type: z.enum(['way', 'node']), id: z.number().int(), tags: z.record(z.string()),
  geometry: z.array(z.object({ lat: z.number().finite(), lon: z.number().finite() })),
})) });
type Source = z.infer<typeof sourceSchema>;
type SourceElement = Source['elements'][number];
const scale = 111320 * Math.cos(geography.origin[0] * Math.PI / 180);
const round = (n: number): number => Math.round(n * 100) / 100;
const project = (p: SourceElement['geometry'][number]): ParkPoint =>
  [round((p.lon - geography.origin[1]) * scale), round((p.lat - geography.origin[0]) * 111320)];
const GROUND_IDS = new Set([418249072, 25979109]);
const BRIDGE_IDS = new Set([320797964, 320797973, 320797974]);
const WIDTHS = { footway: 3.5, path: 2.4, cycleway: 4.5, pedestrian: 5, service: 5, steps: 3.5 } as const;
const highwaySchema = z.enum(['footway', 'path', 'cycleway', 'pedestrian', 'service', 'steps']);

export function parseParkSource(text: string): Source { return sourceSchema.parse(JSON.parse(text)); }

function kindOf(element: SourceElement): ParkKind | undefined {
  const t = element.tags;
  if (element.id === 418249072) return 'ground';
  if (element.id === 25979109) return 'island';
  if (BRIDGE_IDS.has(element.id)) return 'bridge';
  if (element.id === 305692221 || t.man_made === 'pier') return 'pier';
  if (t.leisure === 'bandstand') return 'stage';
  if (t.amenity === 'parking' && !t.building && t.parking !== 'rooftop') return 'parking';
  if (t.amenity === 'parking_space') return 'stall';
  if (t.leisure === 'pitch') return 'court';
  if (t.amenity === 'fountain' && element.id !== 261980547) return 'fountain';
  if (t.landuse === 'forest' || t.natural === 'wood') return 'woodland';
  if (t.landuse === 'grass' || t.natural === 'grassland' || t.leisure === 'garden') return 'lawn';
  if (t.building && t.building !== 'no') return 'building';
  if ((t.bridge && t.bridge !== 'no') || (t.tunnel && t.tunnel !== 'no') || Number(t.layer ?? 0) < 0) return;
  const highway = highwaySchema.safeParse(t.highway);
  if (!highway.success) return;
  switch (highway.data) {
    case 'cycleway': return 'cycle';
    case 'service': return 'service';
    case 'steps': case 'footway': case 'path': case 'pedestrian': return 'walk';
  }
}

/** Splits at polygon boundaries, retaining source centerlines without artificial connectors. */
export function clipParkLine(line: readonly ParkPoint[], domains: readonly (readonly ParkPoint[])[]): readonly ParkPoint[][] {
  const parts: ParkPoint[][] = [];
  for (let i = 0; i < line.length - 1; i++) {
    const a = line[i]; const b = line[i + 1]; const dx = b[0] - a[0]; const dy = b[1] - a[1];
    const times = [0, 1];
    for (const ring of domains) for (let k = 0; k < ring.length; k++) {
      const c = ring[k]; const d = ring[(k + 1) % ring.length];
      const ex = d[0] - c[0]; const ey = d[1] - c[1]; const divisor = dx * ey - dy * ex;
      if (Math.abs(divisor) < 1e-9) continue;
      const t = ((c[0] - a[0]) * ey - (c[1] - a[1]) * ex) / divisor;
      const u = ((c[0] - a[0]) * dy - (c[1] - a[1]) * dx) / divisor;
      if (t > 0 && t < 1 && u >= 0 && u <= 1) times.push(t);
    }
    times.sort((x, y) => x - y);
    for (let k = 0; k < times.length - 1; k++) {
      const t = (times[k] + times[k + 1]) / 2;
      if (times[k + 1] - times[k] < 1e-8 || !domains.some(r => insideRing([a[0] + dx * t, a[1] + dy * t], r))) continue;
      parts.push([times[k], times[k + 1]].map(v => [round(a[0] + dx * v), round(a[1] + dy * v)]));
    }
  }
  return parts;
}

export function preparePark(source: Source) {
  const domains = source.elements.filter(e => GROUND_IDS.has(e.id)).map(e => e.geometry.map(project));
  const features: ParkFeature[] = [];
  for (const element of source.elements) {
    if (element.type !== 'way' || element.geometry.length < 2) continue;
    const kind = kindOf(element); if (!kind) continue;
    const p = element.geometry.map(project); const t = element.tags;
    const center: ParkPoint = [p.reduce((n, v) => n + v[0], 0) / p.length, p.reduce((n, v) => n + v[1], 0) / p.length];
    const closed = p.length > 3 && p[0][0] === p.at(-1)?.[0] && p[0][1] === p.at(-1)?.[1];
    const highway = highwaySchema.safeParse(t.highway);
    const tagged = Number(t.width?.replace(/\s*m$/, ''));
    const hasWidth = Number.isFinite(tagged) && tagged >= 1 && tagged <= 20;
    const widthM = hasWidth ? tagged : highway.success ? WIDTHS[highway.data] : 3.5;
    const isLine = kind === 'walk' || kind === 'cycle' || kind === 'service';
    const belongs = domains.some(r => insideRing(center, r) || (kind === 'pier' && lineDistance(center, r, true) < 45));
    if (!isLine && !belongs && !GROUND_IDS.has(element.id) && !BRIDGE_IDS.has(element.id)) continue;
    if (!isLine && kind !== 'bridge' && !closed) continue;
    const area = closed && (!isLine || t.area === 'yes');
    const parts = isLine && !area ? clipParkLine(p, domains) : [area ? p.slice(0, -1) : p];
    if (isLine && area && !belongs) continue;
    parts.forEach((part, i) => features.push({ id: `way/${element.id}${parts.length > 1 ? `:${i}` : ''}`,
      name: t.name ?? t['bridge:name'] ?? '', kind, area, p: part, widthM,
      widthSource: hasWidth ? 'osm' : 'class-estimate', sport: t.sport ?? '' }));
  }
  return { origin: geography.origin, retrieved: source.retrieved, sourceURL: source.sourceURL,
    stageSource: 'https://hangang.seoul.go.kr/www/facility/map.tab?srchCd=9955',
    stagePoint: project({ lat: 37.5126399779, lon: 126.9983259914 }), features };
}

if (process.argv[1]?.endsWith('/prepare-banpo-park.ts')) {
  const bytes = gunzipSync(readFileSync(new URL('./fixtures/banpo-park-osm-2026-09-12.json.gz', import.meta.url)));
  const data = { ...preparePark(parseParkSource(bytes.toString())), sourceSha256: createHash('sha256').update(bytes).digest('hex') };
  writeFileSync(new URL('../public/models/han-river/park.json', import.meta.url), `${JSON.stringify(data)}\n`);
  process.stdout.write(`${JSON.stringify({ features: data.features.length, kinds: Object.fromEntries(
    [...new Set(data.features.map(f => f.kind))].map(k => [k, data.features.filter(f => f.kind === k).length])) })}\n`);
}
