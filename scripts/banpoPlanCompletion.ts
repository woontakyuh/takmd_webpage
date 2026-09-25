import { z } from 'astro/zod';
import plans from './fixtures/banpo-completion-plans.json';
import geography from '../public/models/han-river/geography.json';
import type { SouthBuilding } from '../src/components/studio/scene/BanpoSouthBankData';

const pair = z.tuple([z.number(), z.number()]);
const planSchema = z.object({ name: z.string(), source: z.string().url(), image: z.string().url(),
  controls: z.array(z.object({ pixel: pair, geo: pair })).length(3),
  leftControls: z.array(z.object({ pixel: pair, geo: pair })).length(4).optional(),
  blocks: z.array(z.tuple([z.number().int(), z.number().positive(), z.array(pair).min(3)])),
});
const parsed = z.object({ maple: planSchema, trinione: planSchema }).parse(plans);
export const completionPlans = [parsed.maple, parsed.trinione] as const;
type Point = readonly number[];
type Plan = typeof parsed.maple;

export function projectPlanPoint(plan: Plan, pixel: Point): readonly [number, number] {
  const [a, b, c] = plan.controls;
  const bx = b.pixel[0] - a.pixel[0], by = b.pixel[1] - a.pixel[1];
  const cx = c.pixel[0] - a.pixel[0], cy = c.pixel[1] - a.pixel[1];
  const x = pixel[0] - a.pixel[0], y = pixel[1] - a.pixel[1];
  const det = bx * cy - by * cx;
  const u = (x * cy - y * cx) / det, v = (bx * y - by * x) / det;
  const lon = a.geo[0] + u * (b.geo[0] - a.geo[0]) + v * (c.geo[0] - a.geo[0]);
  const lat = a.geo[1] + u * (b.geo[1] - a.geo[1]) + v * (c.geo[1] - a.geo[1]);
  return [(lon - geography.origin[1]) * 111320 * Math.cos(geography.origin[0] * Math.PI / 180), (lat - geography.origin[0]) * 111320];
}

export function completedPlanBuildings(elevation: (point: Point) => number): readonly SouthBuilding[] {
  const round = (value: number) => Math.round(value * 10) / 10;
  return completionPlans.flatMap((plan, index) => plan.blocks.map(([block, floors, pixels]) => {
    const p = pixels.map(pixel => {
      const quad = block < 200 ? plan.leftControls : undefined;
      if (!quad) return projectPlanPoint(plan, pixel).map(round);
      // Each side of the site diagonal uses its own affine mapping: the published drawing is not an orthophoto.
      const [ne, nw, sw, se] = quad;
      const side = (point: Point) => (se.pixel[0] - nw.pixel[0]) * (point[1] - nw.pixel[1]) - (se.pixel[1] - nw.pixel[1]) * (point[0] - nw.pixel[0]);
      const controls = side(pixel) * side(ne.pixel) >= 0 ? [ne, nw, se] : [nw, sw, se];
      return projectPlanPoint({ ...plan, controls }, pixel).map(round);
    });
    const center = [0, 1].map(axis => p.reduce((s, point) => s + point[axis], 0) / p.length);
    const area = Math.abs(p.reduce((sum, a, i) => {
      const b = p[(i + 1) % p.length]; return sum + a[0] * b[1] - b[0] * a[1];
    }, 0)) / 2;
    return { id: -(100000 + index * 1000 + block), name: String(block), complex: plan.name, p, area: round(area),
      h: round(floors * 3.05), z: round(elevation(center)), measured: false,
      heightSource: index === 0 ? 'class-estimate' : 'official-plan-levels' } satisfies SouthBuilding;
  }));
}
