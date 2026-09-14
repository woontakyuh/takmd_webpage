import * as THREE from 'three';
import { BANPO_APPEARANCE } from './BanpoAppearance';
import { appendParkPolygon, appendParkRibbon, appendParkSides } from './BanpoParkGeometry';
import type { ParkHeight } from './BanpoParkGeometry';
import type { ParkFeature, ParkPoint } from './BanpoParkData';
import { appendParkParking } from './BanpoParkParking';

type Batch = (color: number) => number[];
const palette = BANPO_APPEARANCE.park;

function beam(target: number[], a: readonly [number, number, number], b: readonly [number, number, number], width: number): void {
  const start = new THREE.Vector3(...a); const end = new THREE.Vector3(...b);
  const geometry = new THREE.BoxGeometry(width, start.distanceTo(end), width);
  geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(start).normalize()));
  geometry.translate(...start.add(end).multiplyScalar(.5).toArray());
  const flat = geometry.toNonIndexed(); const position = flat.getAttribute('position');
  for (let i = 0; i < position.count; i++) target.push(position.getX(i), position.getY(i), position.getZ(i));
  flat.dispose(); geometry.dispose();
}

function courtMarkings(batch: Batch, feature: ParkFeature, height: ParkHeight): void {
  const p = feature.p; if (p.length !== 4) return;
  const center: ParkPoint = [p.reduce((s, v) => s + v[0], 0) / 4, p.reduce((s, v) => s + v[1], 0) / 4];
  const longest = p.map((a, i) => ({ a, b: p[(i + 1) % 4] })).sort((a, b) =>
    Math.hypot(b.a[0] - b.b[0], b.a[1] - b.b[1]) - Math.hypot(a.a[0] - a.b[0], a.a[1] - a.b[1]))[0];
  const dx = longest.b[0] - longest.a[0]; const dy = longest.b[1] - longest.a[1]; const length = Math.hypot(dx, dy);
  const point = (x: number, y: number): ParkPoint => [center[0] + (x * dx - y * dy) / length, center[1] + (x * dy + y * dx) / length];
  const ink = batch(palette.marking); const h: ParkHeight = p => height(p) + .06;
  appendParkRibbon(ink, [...p, p[0]], { width: .2, height: h });
  appendParkRibbon(ink, [point(0, -7), point(0, 7)], { width: .2, height: h });
  appendParkRibbon(ink, Array.from({ length: 33 }, (_, i) => point(Math.cos(i * Math.PI / 16) * 1.8,
    Math.sin(i * Math.PI / 16) * 1.8)), { width: .18, height: h });
  for (const side of [-1, 1]) {
    appendParkRibbon(ink, [point(side * (length / 2 - 1), -2.5), point(side * (length / 2 - 6), -2.5),
      point(side * (length / 2 - 6), 2.5), point(side * (length / 2 - 1), 2.5)], { width: .2, height: h });
    const hoop = point(side * (length / 2 - 1.5), 0); const y = height(hoop);
    beam(batch(palette.rail), [hoop[0], y, -hoop[1]], [hoop[0], y + 3.6, -hoop[1]], .22);
    const a = point(side * (length / 2 - 1.5), -.9); const b = point(side * (length / 2 - 1.5), .9);
    beam(ink, [a[0], y + 3.5, -a[1]], [b[0], y + 3.5, -b[1]], .5);
  }
}

export function appendParkFacilities(batch: Batch, feature: ParkFeature, height: ParkHeight): void {
  if (feature.kind === 'bridge') {
    for (let i = 0; i < feature.p.length - 1; i++) {
      const a = feature.p[i]; const b = feature.p[i + 1];
      const length = Math.hypot(b[0] - a[0], b[1] - a[1]); const count = Math.ceil(length / 2.5);
      for (const side of [-1, 1]) {
        const shift: ParkPoint = [-(b[1] - a[1]) / length * 2.1 * side, (b[0] - a[0]) / length * 2.1 * side];
        let previous: readonly [number, number, number] | undefined;
        for (let k = 0; k <= count; k++) {
          const p: ParkPoint = [a[0] + (b[0] - a[0]) * k / count + shift[0], a[1] + (b[1] - a[1]) * k / count + shift[1]];
          const top: readonly [number, number, number] = [p[0], height(p) + 1.15, -p[1]];
          beam(batch(palette.rail), [p[0], height(p), -p[1]], top, .09);
          if (previous) beam(batch(palette.rail), previous, top, .11);
          previous = top;
        }
      }
    }
  } else if (feature.kind === 'court') courtMarkings(batch, feature, height);
  else if (feature.kind === 'parking') appendParkParking(batch(palette.marking), feature.p, height);
  else if (feature.kind === 'building') {
    appendParkSides(batch(palette.stone), feature.p, { top: p => height(p) + 3, bottom: height });
    appendParkPolygon(batch(palette.rail), feature.p, p => height(p) + 3);
  } else if (feature.id === 'way/305692221') {
    const edges = feature.p.map((p, i) => ({ p, q: feature.p[(i + 1) % feature.p.length] }));
    const edge = edges.sort((a, b) => (b.p[1] + b.q[1]) - (a.p[1] + a.q[1]))[0];
    const mid: ParkPoint = [(edge.p[0] + edge.q[0]) / 2, (edge.p[1] + edge.q[1]) / 2];
    const direction = new THREE.Vector2(edge.q[0] - edge.p[0], edge.q[1] - edge.p[1]).normalize();
    const a = [mid[0] - direction.x * 12, height(mid) + 7, -mid[1] + direction.y * 12] as const;
    const b = [mid[0] + direction.x * 12, height(mid) + 7, -mid[1] - direction.y * 12] as const;
    const screen = batch(palette.screen);
    screen.push(a[0], a[1] - 4.5, a[2], b[0], b[1] - 4.5, b[2], a[0], a[1] + 4.5, a[2],
      b[0], b[1] - 4.5, b[2], b[0], b[1] + 4.5, b[2], a[0], a[1] + 4.5, a[2]);
    for (const edgeHeight of [-4.5, 4.5]) beam(batch(palette.rail), [a[0], a[1] + edgeHeight, a[2]], [b[0], b[1] + edgeHeight, b[2]], .4);
    for (const end of [a, b]) beam(batch(palette.rail), [end[0], height(mid), end[2]], [end[0], end[1] + 4.5, end[2]], .5);
  }
}
