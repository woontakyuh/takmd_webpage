import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { z } from 'astro/zod';
import geography from '../public/models/han-river/geography.json';
import landcover from '../public/models/han-river/landcover.json';
import { canopyElevation, insideFeature, insideRing } from '../src/components/studio/scene/BanpoCanopyPlacement';
import type { UrbanBuilding } from '../src/components/studio/scene/BanpoUrbanFabric';

type Point = readonly number[];
type Ring = readonly Point[];
type Cover = { readonly rings: readonly Ring[] };
const sourceSchema = z.object({ elements: z.array(z.object({
  id: z.number().int(), tags: z.record(z.string()).optional(),
  geometry: z.array(z.object({ lat: z.number().finite(), lon: z.number().finite() })).optional(),
})) });
type Element = z.infer<typeof sourceSchema>['elements'][number];
const protectedCover = [...landcover.park, ...landcover.woodland];
const river = geography.banks.flat();
const existing = new Set(geography.buildings.map(building => building.id));
const longitudeScale = 111320 * Math.cos(geography.origin[0] * Math.PI / 180);
const round = (value: number): number => Math.round(value * 10) / 10;
const cross = (a: Point, b: Point, c: Point): number => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);

function crosses(a: Point, b: Point, c: Point, d: Point): boolean {
  return cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0;
}

export function intersectsProtectedFeature(polygon: Ring, feature: Cover): boolean {
  if (polygon.some(point => insideFeature(point, { id: '', rings: feature.rings }))) return true;
  return feature.rings.some(ring => ring.some((a, i) => {
    const b = ring[(i + 1) % ring.length];
    return insideRing(a, polygon) || polygon.some((c, j) => crosses(a, b, c, polygon[(j + 1) % polygon.length]));
  }));
}

export function parseUrbanSource(text: string): readonly Element[] {
  return sourceSchema.parse(JSON.parse(text)).elements;
}

export function generateUrbanFabric(elements: readonly Element[]): readonly UrbanBuilding[] {
  const selected: UrbanBuilding[] = [];
  for (const element of elements) {
    const tags = element.tags; const geometry = element.geometry;
    if (!tags?.building || !geometry || existing.has(element.id)) continue;
    const polygon = geometry.map(point => [round((point.lon - geography.origin[1]) * longitudeScale),
      round((point.lat - geography.origin[0]) * 111320)]);
    if (polygon.length > 1 && polygon[0][0] === polygon.at(-1)?.[0] && polygon[0][1] === polygon.at(-1)?.[1]) polygon.pop();
    if (polygon.length < 3 || polygon.length > 24) continue;
    const east = polygon.reduce((sum, p) => sum + p[0], 0) / polygon.length;
    const north = polygon.reduce((sum, p) => sum + p[1], 0) / polygon.length;
    if (east < -1800 || east > 2550 || north < 950 || north > 3000) continue;
    const area = Math.abs(polygon.reduce((sum, a, index) => {
      const b = polygon[(index + 1) % polygon.length]; return sum + a[0] * b[1] - b[0] * a[1];
    }, 0)) / 2;
    if (area < 50 || area >= 500 || intersectsProtectedFeature(polygon, { rings: [river] })
      || protectedCover.some(feature => intersectsProtectedFeature(polygon, feature))
      || geography.buildings.some(building => intersectsProtectedFeature(polygon, { rings: [building.p] }))) continue;
    const heightTag = tags.height ? Number(tags.height.replace(/\s*m\s*$/, '')) : Number(tags['building:levels']) * 3.05;
    const tagged = Number.isFinite(heightTag) && heightTag > 0;
    const height = tagged ? heightTag : tags.building === 'apartments' ? 44 : 11;
    if (height > 28) continue;
    const elevations = polygon.map(canopyElevation);
    if (elevations.some(value => value === undefined)) continue;
    const base = Math.min(...elevations.filter((value): value is number => value !== undefined)) - 0.2;
    selected.push({ id: element.id, p: polygon, z: round(base), h: round(height), measured: tagged, area: round(area) });
  }
  selected.sort((a, b) => {
    const distance = (building: UrbanBuilding): number => {
      const east = building.p.reduce((sum, p) => sum + p[0], 0) / building.p.length;
      const north = building.p.reduce((sum, p) => sum + p[1], 0) / building.p.length;
      return Math.hypot(east - 350, (north - 1650) * 1.7);
    };
    return distance(a) - distance(b) || a.id - b.id;
  });
  const result: UrbanBuilding[] = []; let triangles = 0;
  for (const building of selected) {
    const cost = building.p.length * 3 - 2;
    if (triangles + cost > 20000 || result.length === 380) break;
    result.push(building); triangles += cost;
  }
  return result;
}

if (import.meta.main) {
  const input = new URL('../.omo/evidence/han-river-banpo-2026-09-09/osm-raw.json', import.meta.url);
  const bytes = readFileSync(input); const buildings = generateUrbanFabric(parseUrbanSource(bytes.toString()));
  const output = JSON.stringify(buildings);
  writeFileSync(new URL('../public/models/han-river/urban-fabric.json', import.meta.url), `${output}\n`);
  process.stdout.write(`${JSON.stringify({ buildings: buildings.length, bytes: Buffer.byteLength(output),
    triangleUpperBound: buildings.reduce((sum, b) => sum + b.p.length * 3 - 2, 0),
    sourceSha256: createHash('sha256').update(bytes).digest('hex'),
    existingGeographySha256: createHash('sha256').update(readFileSync(new URL('../public/models/han-river/geography.json', import.meta.url))).digest('hex') }, null, 2)}\n`);
}
