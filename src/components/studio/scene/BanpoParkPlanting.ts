import { insideRing, lineDistance } from './BanpoCanopyPlacement';
import type { CanopyPlacement } from './BanpoCanopyPlacement';
import type { ParkFeature, ParkPoint } from './BanpoParkData';
import { parkElevation } from './BanpoParkGeometry';

export const PARK_TREE_BUDGET = 48;

export function generateParkTrees(features: readonly ParkFeature[]): readonly CanopyPlacement[] {
  const island = features.find(f => f.kind === 'island'); const ground = features.find(f => f.kind === 'ground');
  if (!island || !ground) return [];
  const exclusion = features.filter(f => !['island', 'ground', 'lawn', 'woodland'].includes(f.kind));
  const trees: CanopyPlacement[] = [];
  let seed = 12906;
  const random = (): number => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  for (const [cluster, region] of [island, ground].entries()) {
    const budget = trees.length + PARK_TREE_BUDGET / 2;
    for (let attempt = 0; attempt < 8000 && trees.length < budget; attempt++) {
      const p: ParkPoint = [-490 + random() * 640, -460 + random() * 420];
      if (!insideRing(p, region.p) || lineDistance(p, region.p, true) < 6) continue;
      if (cluster === 0 && (p[1] - p[0] * .55 > -153 || lineDistance(p, island.p, true) > 28)) continue;
      if (cluster === 1 && lineDistance(p, island.p, true) > 55) continue;
      if (exclusion.some(f => (f.area && insideRing(p, f.p)) || lineDistance(p, f.p, f.area) < f.widthM / 2 + 6.5)) continue;
      if (trees.some(t => Math.hypot(t.east - p[0], t.north - p[1]) < 10)) continue;
      trees.push({ east: p[0], north: p[1], elevation: parkElevation(p), scale: 1.6 + random() * .45,
        rotation: random() * Math.PI * 2, sourceId: region.id, cluster: 8 + cluster });
    }
  }
  return trees;
}
