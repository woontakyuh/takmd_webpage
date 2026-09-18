import * as THREE from 'three';
import { canopyElevation } from './BanpoCanopyPlacement';
import type { ParkPoint } from './BanpoParkData';

export type ParkHeight = (point: ParkPoint) => number;
export const parkElevation: ParkHeight = point => Math.max(8.2, canopyElevation(point) ?? 8.2) + .12;
const GRID = 25;

function clipEdge(points: readonly ParkPoint[], axis: 0 | 1, edge: number, direction: number): ParkPoint[] {
  const result: ParkPoint[] = [];
  points.forEach((b, i) => {
    const a = points[(i + points.length - 1) % points.length];
    const insideA = (a[axis] - edge) * direction >= 0;
    const insideB = (b[axis] - edge) * direction >= 0;
    if (insideA !== insideB) {
      const t = (edge - a[axis]) / (b[axis] - a[axis]);
      result.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
    if (insideB) result.push(b);
  });
  return result;
}

function clipCellDiagonal(points: readonly ParkPoint[], cell: ParkPoint, side: number): ParkPoint[] {
  const result: ParkPoint[] = [];
  const distance = (p: ParkPoint): number => (p[1] - cell[1] - p[0] + cell[0]) * side;
  points.forEach((b, i) => {
    const a = points[(i + points.length - 1) % points.length]; const da = distance(a); const db = distance(b);
    if ((da >= 0) !== (db >= 0)) {
      const t = da / (da - db); result.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
    if (db >= 0) result.push(b);
  });
  return result;
}

function cellHeight(point: ParkPoint, cell: ParkPoint, height: ParkHeight): number {
  const x = (point[0] - cell[0]) / GRID; const y = (point[1] - cell[1]) / GRID;
  const sw = height(cell); const ne = height([cell[0] + GRID, cell[1] + GRID]);
  return y <= x ? sw * (1 - x) + height([cell[0] + GRID, cell[1]]) * (x - y) + ne * y
    : sw * (1 - y) + ne * x + height([cell[0], cell[1] + GRID]) * (y - x);
}

export function appendParkPolygon(target: number[], points: readonly ParkPoint[], height: ParkHeight): void {
  const faces = THREE.ShapeUtils.triangulateShape(points.map(p => new THREE.Vector2(...p)), []);
  for (const face of faces) {
    const triangle = face.map(i => points[i]);
    const xs = triangle.map(p => p[0]); const ys = triangle.map(p => p[1]);
    for (let x = Math.floor(Math.min(...xs) / GRID) * GRID; x < Math.max(...xs); x += GRID) {
      for (let y = Math.floor(Math.min(...ys) / GRID) * GRID; y < Math.max(...ys); y += GRID) {
        let clipped = clipEdge(triangle, 0, x, 1);
        clipped = clipEdge(clipped, 0, x + GRID, -1);
        clipped = clipEdge(clipped, 1, y, 1);
        clipped = clipEdge(clipped, 1, y + GRID, -1);
        for (const side of [-1, 1]) {
          const half = clipCellDiagonal(clipped, [x, y], side);
          for (let i = 1; i < half.length - 1; i++) {
            const a = half[0]; const b = half[i]; const c = half[i + 1];
            const signedArea = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
            if (Math.abs(signedArea) < 1e-7) continue;
            for (const p of signedArea > 0 ? [a, b, c] : [a, c, b]) target.push(p[0], cellHeight(p, [x, y], height), -p[1]);
          }
        }
      }
    }
  }
}

export function appendParkRibbon(target: number[], points: readonly ParkPoint[], options: { readonly width: number; readonly height: ParkHeight }): void {
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]; const b = points[i + 1];
    const dx = b[0] - a[0]; const dy = b[1] - a[1]; const length = Math.hypot(dx, dy);
    if (length < .001) continue;
    const nx = -dy / length * options.width / 2; const ny = dx / length * options.width / 2;
    appendParkPolygon(target, [[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny],
      [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]], options.height);
  }
}

export function appendParkSides(target: number[], points: readonly ParkPoint[], options: { readonly top: ParkHeight; readonly bottom: ParkHeight }): void {
  for (let i = 0; i < points.length; i++) {
    const a = points[i]; const b = points[(i + 1) % points.length];
    const count = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / GRID);
    for (let k = 0; k < count; k++) {
      const p: ParkPoint = [a[0] + (b[0] - a[0]) * k / count, a[1] + (b[1] - a[1]) * k / count];
      const q: ParkPoint = [a[0] + (b[0] - a[0]) * (k + 1) / count, a[1] + (b[1] - a[1]) * (k + 1) / count];
      const pa = [p[0], options.top(p), -p[1]]; const pb = [p[0], options.bottom(p), -p[1]];
      const qa = [q[0], options.top(q), -q[1]]; const qb = [q[0], options.bottom(q), -q[1]];
      target.push(...pa, ...pb, ...qa, ...qa, ...pb, ...qb);
    }
  }
}

export function parkBuffer(positions: readonly number[]): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals(); geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  return geometry;
}
