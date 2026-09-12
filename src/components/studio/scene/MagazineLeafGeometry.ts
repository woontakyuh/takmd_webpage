import { BoxGeometry, MathUtils } from 'three';
import type { BufferAttribute, BufferGeometry } from 'three';
import type { BookSurface } from '../personalBookSurfaces';
import { bookUvAt } from './BookSurface';
import { PAPER_LEAF_THICKNESS } from './bookGeometry';
import { magazineSheetPoint } from './MagazineGeometry';

export type MagazineLeafShape = {
  readonly width: number;
  readonly height: number;
  readonly depth: number;
  readonly startZ: number;
  readonly endZ: number;
};

export function createMagazineLeafGeometry(shape: MagazineLeafShape, faces: {
  readonly front?: BookSurface;
  readonly back?: BookSurface;
}) {
  const geometry = new BoxGeometry(shape.width, shape.height, shape.depth, 48, 8, 1);
  geometry.translate(shape.width / 2, 0, 0);
  const flat = geometry.getAttribute('position').clone();
  const normals = geometry.getAttribute('normal');
  const uv = geometry.getAttribute('uv');
  for (let index = 0; index < flat.count; index += 1) {
    const side = normals.getZ(index);
    const u = flat.getX(index) / shape.width;
    const v = .5 - flat.getY(index) / shape.height;
    if (Math.abs(side) < .5) {
      uv.setXY(index, normals.getX(index) ? v : u,
        (flat.getZ(index) + shape.depth / 2) / PAPER_LEAF_THICKNESS);
      continue;
    }
    const surface = side > 0 ? faces.front : faces.back;
    if (surface) {
      const [x, y] = bookUvAt(surface.quad, side > 0 ? u : 1 - u, v);
      uv.setXY(index, x, 1 - y);
    }
  }
  return { geometry, flat };
}

export function shapeMagazineLeaf(geometry: BufferGeometry, flat: BufferAttribute, pose: {
  readonly width: number;
  readonly progress: number;
  readonly startZ: number;
  readonly endZ: number;
}) {
  const vertices = geometry.getAttribute('position');
  const elevation = MathUtils.lerp(pose.startZ, pose.endZ, pose.progress);
  for (let index = 0; index < vertices.count; index += 1) {
    const point = magazineSheetPoint({ distance: flat.getX(index), width: pose.width, progress: pose.progress });
    const offset = flat.getZ(index);
    vertices.setXYZ(index, point.x + Math.sin(point.angle) * offset, flat.getY(index),
      elevation + point.z + Math.cos(point.angle) * offset);
  }
  vertices.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
}
