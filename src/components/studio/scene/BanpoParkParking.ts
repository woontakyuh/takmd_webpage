import { insideRing, lineDistance } from './BanpoCanopyPlacement';
import { appendParkRibbon } from './BanpoParkGeometry';
import type { ParkHeight } from './BanpoParkGeometry';
import type { ParkPoint } from './BanpoParkData';

export function appendParkParking(target: number[], polygon: readonly ParkPoint[], height: ParkHeight): void {
  const edges = polygon.map((a, i) => ({ a, b: polygon[(i + 1) % polygon.length] }));
  const edge = edges.sort((a, b) => Math.hypot(b.b[0] - b.a[0], b.b[1] - b.a[1])
    - Math.hypot(a.b[0] - a.a[0], a.b[1] - a.a[1]))[0];
  const dx = edge.b[0] - edge.a[0]; const dy = edge.b[1] - edge.a[1]; const length = Math.hypot(dx, dy);
  const u: ParkPoint = [dx / length, dy / length]; const v: ParkPoint = [-u[1], u[0]];
  const rotated = polygon.map(p => [p[0] * u[0] + p[1] * u[1], p[0] * v[0] + p[1] * v[1]]);
  const xs = rotated.map(p => p[0]); const ys = rotated.map(p => p[1]);
  const point = (x: number, y: number): ParkPoint => [x * u[0] + y * v[0], x * u[1] + y * v[1]];
  for (let y = Math.min(...ys) + 5; y < Math.max(...ys) - 5; y += 16) {
    for (let x = Math.min(...xs) + 3; x < Math.max(...xs) - 3; x += 2.7) {
      const a = point(x, y - 5); const b = point(x, y + 5);
      if (![a, b].every(p => insideRing(p, polygon) && lineDistance(p, polygon, true) > 2)) continue;
      appendParkRibbon(target, [a, b], { width: .13, height: p => height(p) + .05 });
    }
  }
}
