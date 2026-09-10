import geography from '../../../../public/models/han-river/geography.json';
import landcover from '../../../../public/models/han-river/landcover.json';
import paths from '../../../../public/models/han-river/vegetation/canopy-paths.json';

type Point = readonly number[];
type Ring = readonly Point[];
interface CoverFeature {
  readonly id: string;
  readonly rings: readonly Ring[];
}

export interface CanopyPlacement {
  readonly east: number;
  readonly north: number;
  readonly elevation: number;
  readonly scale: number;
  readonly rotation: number;
  readonly sourceId: string;
  readonly cluster: number;
}

export const CANOPY_INSTANCE_BUDGET = 72;
export const CANOPY_CLEARANCE = 6.5;
export const CANOPY_CLUSTER_ANCHORS = [
  [720, 72], [845, 145], [995, 207], [1080, 330],
  [770, 285], [922, 424], [1165, 652], [1330, 803],
] as const;

export function insideRing(point: Point, ring: Ring): boolean {
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const a = ring[index]; const b = ring[previous];
    if ((a[1] > point[1]) !== (b[1] > point[1])
      && point[0] < (b[0] - a[0]) * (point[1] - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}

export function insideFeature(point: Point, feature: CoverFeature): boolean {
  return feature.rings.reduce((inside, ring) => inside !== insideRing(point, ring), false);
}

export function segmentDistance(point: Point, a: Point, b: Point): number {
  const dx = b[0] - a[0]; const dy = b[1] - a[1];
  const lengthSquared = dx * dx + dy * dy;
  const fraction = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1,
    ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / lengthSquared));
  return Math.hypot(point[0] - a[0] - fraction * dx, point[1] - a[1] - fraction * dy);
}

export function lineDistance(point: Point, line: Ring, closed = false): number {
  let distance = Infinity;
  for (let index = 0; index < line.length - (closed ? 0 : 1); index++) {
    distance = Math.min(distance, segmentDistance(point, line[index], line[(index + 1) % line.length]));
  }
  return distance;
}

const river = geography.banks.flat();
const cover = [...landcover.woodland, ...landcover.park].filter(feature => feature.rings.some(ring =>
  ring.some(([east, north]) => east > 300 && east < 1750 && north > -160 && north < 1100)));

export function canopySource(point: Point): CoverFeature | undefined {
  if (insideRing(point, river) || geography.banks.some(bank => lineDistance(point, bank) < 12.5)) return;
  if (paths.paths.some(path => lineDistance(point, path.points) < path.halfWidth + CANOPY_CLEARANCE)) return;
  if (geography.roads.some(road => lineDistance(point, road) < 7 + CANOPY_CLEARANCE)) return;
  if (geography.buildings.some(building => insideRing(point, building.p)
    || lineDistance(point, building.p, true) < 10 + CANOPY_CLEARANCE)) return;
  return cover.find(feature => insideFeature(point, feature)
    && feature.rings.every(ring => lineDistance(point, ring, true) >= CANOPY_CLEARANCE));
}

/** Matches the source terrain's two triangles per 100 m cell and continuous bank shoulders. */
export function canopyElevation(point: Point): number | undefined {
  const ix = Math.floor((point[0] + 3500) / 100); const iy = Math.floor((point[1] + 200) / 100);
  const row = geography.terrain[iy]; const next = geography.terrain[iy + 1];
  if (!row || !next || ix < 0 || ix + 1 >= row.length) return;
  const x = (point[0] + 3500) / 100 - ix; const y = (point[1] + 200) / 100 - iy;
  let height = y <= x
    ? row[ix] * (1 - x) + row[ix + 1] * (x - y) + next[ix + 1] * y
    : row[ix] * (1 - y) + next[ix + 1] * x + next[ix] * (y - x);
  geography.banks.forEach((bank, side) => {
    for (let index = 0; index < bank.length - 1; index++) {
      const a = bank[index]; const b = bank[index + 1];
      if (a[0] === b[0]) continue;
      const t = (point[0] - a[0]) / (b[0] - a[0]);
      const inland = (point[1] - a[1] - t * (b[1] - a[1])) * (side === 0 ? -1 : 1);
      if (t >= 0 && t <= 1 && inland >= 0 && inland <= 100) height = Math.max(height, 7 + inland * 0.02);
    }
  });
  return height > 4 ? height : undefined;
}

export function generateCanopyPlacements(): readonly CanopyPlacement[] {
  let seed = 20260910;
  const random = (): number => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const placements: CanopyPlacement[] = [];
  CANOPY_CLUSTER_ANCHORS.forEach(([east, north], cluster) => {
    let count = 0;
    for (let attempt = 0; attempt < 1200 && count < 9; attempt++) {
      const angle = random() * Math.PI * 2; const radius = Math.sqrt(random());
      const along = Math.cos(angle) * radius * 52; const across = Math.sin(angle) * radius * 26;
      const point = [east + along * 0.8 - across * 0.6, north + along * 0.6 + across * 0.8]
        .map(value => Math.round(value * 100) / 100);
      const source = canopySource(point); const elevation = canopyElevation(point);
      if (!source || elevation === undefined || placements.some(tree =>
        Math.hypot(tree.east - point[0], tree.north - point[1]) < 8.5)) continue;
      placements.push({ east: point[0], north: point[1], elevation: Math.round(elevation * 1000) / 1000,
        scale: Math.round((1.55 + random() * 0.5) * 1000) / 1000,
        rotation: Math.round(random() * Math.PI * 2 * 1000) / 1000, sourceId: source.id, cluster });
      count++;
    }
  });
  return placements.slice(0, CANOPY_INSTANCE_BUDGET);
}
