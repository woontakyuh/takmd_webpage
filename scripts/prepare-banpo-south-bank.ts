import { readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { z } from 'astro/zod';
import geography from '../public/models/han-river/geography.json';
import park from '../public/models/han-river/park.json';
import planTrace from './fixtures/banpo-clast-plan-trace.json';
import { canopyElevation, insideRing, lineDistance } from '../src/components/studio/scene/BanpoCanopyPlacement';
import type { SouthBankData, SouthBuilding } from '../src/components/studio/scene/BanpoSouthBankData';

const pointSchema = z.object({ lat: z.number().finite(), lon: z.number().finite() });
const sourceSchema = z.object({ elements: z.array(z.object({
  type: z.string(), id: z.number().int(), tags: z.record(z.string()).optional(),
  geometry: z.array(pointSchema).optional(),
  members: z.array(z.object({ role: z.string(), geometry: z.array(pointSchema).optional() })).optional(),
})) });
type Source = z.infer<typeof sourceSchema>;
type Point = readonly number[];
const longitudeScale = 111320 * Math.cos(geography.origin[0] * Math.PI / 180);
const round = (value: number): number => Math.round(value * 10) / 10;
const project = (p: { readonly lat: number; readonly lon: number }): readonly [number, number] =>
  [round((p.lon - geography.origin[1]) * longitudeScale), round((p.lat - geography.origin[0]) * 111320)];
const center = (p: readonly Point[]): readonly [number, number] =>
  [p.reduce((sum, p) => sum + p[0], 0) / p.length, p.reduce((sum, p) => sum + p[1], 0) / p.length];
const area = (p: readonly Point[]): number => Math.abs(p.reduce((sum, a, i) => {
  const b = p[(i + 1) % p.length]; return sum + a[0] * b[1] - b[0] * a[1];
}, 0)) / 2;

export function southShoreNorthing(east: number): number {
  const crossings: number[] = [];
  for (const bank of geography.banks) for (let i = 1; i < bank.length; i++) {
    const a = bank[i - 1]; const b = bank[i];
    if (a[0] === b[0] || east < Math.min(a[0], b[0]) || east > Math.max(a[0], b[0])) continue;
    crossings.push(a[1] + (b[1] - a[1]) * (east - a[0]) / (b[0] - a[0]));
  }
  return Math.min(...crossings);
}

function planPoint(pixel: Point): readonly [number, number] {
  const [a, b, c] = planTrace.controls;
  const x = pixel[0] - a.pixel[0]; const y = pixel[1] - a.pixel[1];
  const bx = b.pixel[0] - a.pixel[0]; const by = b.pixel[1] - a.pixel[1];
  const cx = c.pixel[0] - a.pixel[0]; const cy = c.pixel[1] - a.pixel[1];
  const determinant = bx * cy - by * cx;
  const u = (x * cy - y * cx) / determinant; const v = (bx * y - by * x) / determinant;
  return project({ lon: a.geo[0] + u * (b.geo[0] - a.geo[0]) + v * (c.geo[0] - a.geo[0]),
    lat: a.geo[1] + u * (b.geo[1] - a.geo[1]) + v * (c.geo[1] - a.geo[1]) });
}

export function parseSouthSource(text: string): Source { return sourceSchema.parse(JSON.parse(text)); }

async function terrainSampler() {
  const tiles = await Promise.all([3492, 3493].map(async x => ({ x,
    ...await sharp(readFileSync(new URL(`./fixtures/banpo-terrain-12-${x}-1587.png`, import.meta.url)))
      .removeAlpha().raw().toBuffer({ resolveWithObject: true }),
  })));
  return (point: Point): number => {
    const retained = canopyElevation(point);
    if (retained !== undefined) return retained;
    const lat = geography.origin[0] + point[1] / 111320;
    const lon = geography.origin[1] + point[0] / longitudeScale;
    const tx = (lon + 180) / 360 * 4096;
    const ty = (1 - Math.asinh(Math.tan(lat * Math.PI / 180)) / Math.PI) / 2 * 4096;
    const tile = tiles.find(tile => tile.x === Math.floor(tx));
    if (!tile || Math.floor(ty) !== 1587) return 8.2;
    const px = (tx % 1) * 256; const py = (ty % 1) * 256;
    const sample = (dx: number, dy: number): number => {
      const i = (Math.min(255, Math.floor(py) + dy) * 256 + Math.min(255, Math.floor(px) + dx)) * tile.info.channels;
      return tile.data[i] * 256 + tile.data[i + 1] + tile.data[i + 2] / 256 - 32768 - 5;
    };
    const x = px % 1; const y = py % 1;
    const height = (sample(0, 0) * (1 - x) + sample(1, 0) * x) * (1 - y)
      + (sample(0, 1) * (1 - x) + sample(1, 1) * x) * y;
    return round(Math.max(8.2, height));
  };
}

export async function generateSouthBank(source: Source): Promise<SouthBankData> {
  const elevation = await terrainSampler();
  const polygons = source.elements.flatMap(element => {
    const coordinates = element.geometry ?? element.members?.find(m => m.role === 'outer')?.geometry;
    if (!coordinates || !element.tags) return [];
    const p = coordinates.map(project);
    if (p.length > 1 && p[0][0] === p.at(-1)?.[0] && p[0][1] === p.at(-1)?.[1]) p.pop();
    return p.length >= 3 ? [{ id: element.id, tags: element.tags, p }] : [];
  });
  const parcels = polygons.filter(e => e.tags.landuse === 'residential');
  const green = polygons.filter(e => e.tags.natural === 'wood' || e.tags.landuse === 'forest' || e.tags.leisure === 'park');
  const retainedIds = new Set(geography.buildings.map(building => building.id));
  const parts = polygons.filter(e => e.tags['building:part']);
  const candidates: SouthBuilding[] = [];
  for (const element of polygons) {
    const { tags, p } = element;
    if ((!tags.building && !tags['building:part']) || tags.building === 'no' || retainedIds.has(element.id)) continue;
    const [east, north] = center(p); const footprintArea = area(p);
    if (east < -2100 || east > 3200 || north < -2100 || north > 1700
      || p.some(([x, y]) => y >= southShoreNorthing(x) - 12)
      || footprintArea < (tags['building:part'] ? 10 : 80)) continue;
    if (green.some(feature => insideRing([east, north], feature.p))) continue;
    if (!tags['building:part'] && parts.some(part => part.id !== element.id && insideRing(center(part.p), p))) continue;
    const complex = parcels.find(parcel => insideRing([east, north], parcel.p))?.tags.name ?? '';
    const metric = Number(tags.height?.replace(/\s*m\s*$/, '')); const floors = Number(tags['building:levels']);
    const heightSource = Number.isFinite(metric) && metric > 0 ? 'osm-height'
      : Number.isFinite(floors) && floors > 0 ? 'osm-levels' : 'class-estimate';
    const height = heightSource === 'osm-height' ? metric : heightSource === 'osm-levels' ? floors * 3.05
      : complex.includes('원펜타스') ? 100 : tags.building === 'apartments' ? 44 : footprintArea > 1200 ? 19 : 11;
    candidates.push({ id: element.id, p, h: round(height), z: round(elevation([east, north])),
      measured: heightSource !== 'class-estimate', area: round(footprintArea), complex,
      name: tags.name ?? '', heightSource });
  }
  candidates.sort((a, b) => Number(b.h >= 30) - Number(a.h >= 30) || b.area - a.area || a.id - b.id);
  const buildings: SouthBuilding[] = []; let triangleBudget = 0;
  for (const building of candidates) {
    const cost = building.p.length * 3 - 2;
    if (triangleBudget + cost > 36000 || buildings.length >= 950) continue;
    buildings.push(building); triangleBudget += cost;
  }
  const construction: SouthBuilding[] = planTrace.blocks.map(([block, x, y, width, depth, floors, rotation]) => {
    const angle = rotation * Math.PI / 180;
    const p = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([dx, dy]) => planPoint([
      x + dx * width / 2 * Math.cos(angle) - dy * depth / 2 * Math.sin(angle),
      y + dx * width / 2 * Math.sin(angle) + dy * depth / 2 * Math.cos(angle),
    ]));
    return { id: -block, p, z: round(elevation(center(p))), h: round(floors * 3.05 * .65), measured: false,
      area: round(area(p)), complex: '디에이치 클래스트 아파트', name: String(block), heightSource: 'photo-construction' };
  });
  const trees: number[][] = [];
  for (let i = 1; i < planTrace.treeBelt.length; i++) {
    const a = planPoint(planTrace.treeBelt[i - 1]); const b = planPoint(planTrace.treeBelt[i]);
    const count = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 12);
    for (let j = 0; j < count; j++) for (const row of [0, 1]) {
      const point = [a[0] + (b[0] - a[0]) * j / count, a[1] + (b[1] - a[1]) * j / count + row * 8];
      trees.push([round(point[0]), round(point[1]), round(elevation(point)), 5.2 + j % 3 * .6]);
    }
  }
  const parkGround = park.features.find(feature => feature.kind === 'ground');
  const parkExclusions = park.features.filter(feature => !['ground', 'island', 'lawn', 'woodland'].includes(feature.kind));
  if (parkGround) for (let east = -460; east <= 1460; east += 16) {
    for (let north = -460; north <= 500; north += 16) {
      const point = [east, north];
      if (!insideRing(point, parkGround.p) || lineDistance(point, parkGround.p, true) > 32
        || north >= southShoreNorthing(east) - 38) continue;
      if (parkExclusions.some(feature => (feature.area && insideRing(point, feature.p))
        || lineDistance(point, feature.p, feature.area) < feature.widthM / 2 + 7)) continue;
      if (trees.some(tree => Math.hypot(tree[0] - east, tree[1] - north) < 13)) continue;
      trees.push([east, north, round(elevation(point)), 5.2]);
    }
  }
  const rows: number[][] = []; const coverage: number[][] = [];
  const terrain = { west: -2200, south: -2200, step: 100, rows, cover: coverage };
  for (let north = terrain.south; north <= -200; north += terrain.step) {
    const heights: number[] = []; const cover: number[] = [];
    for (let east = terrain.west; east <= 3300; east += terrain.step) {
      const point = [east, north];
      heights.push(north >= southShoreNorthing(east) ? -4 : round(elevation(point)));
      cover.push(green.some(feature => insideRing(point, feature.p)) ? 1 : 0);
    }
    terrain.rows.push(heights); terrain.cover.push(cover);
  }
  return { buildings, construction, trees, terrain };
}

if (import.meta.main) {
  const fixture = readFileSync(new URL('./fixtures/banpo-south-osm-2026-09-13.json.gz', import.meta.url));
  const data = await generateSouthBank(parseSouthSource(gunzipSync(fixture).toString()));
  const output = JSON.stringify(data);
  writeFileSync(new URL('../public/models/han-river/south-bank.json', import.meta.url), `${output}\n`);
  process.stdout.write(`${JSON.stringify({ buildings: data.buildings.length, construction: data.construction.length,
    trees: data.trees.length, bytes: Buffer.byteLength(output), sourceSha256: createHash('sha256').update(fixture).digest('hex'),
    taggedHeights: data.buildings.filter(b => b.measured).length,
    complexes: Object.fromEntries([...new Set(data.buildings.map(b => b.complex).filter(Boolean))]
      .map(name => [name, data.buildings.filter(b => b.complex === name).length])) }, null, 2)}\n`);
}
