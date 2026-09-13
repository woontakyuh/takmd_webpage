import { BoxGeometry, Float32BufferAttribute, MathUtils } from 'three';
import type { BufferAttribute, BufferGeometry } from 'three';
import type { MagazineSurface } from './MagazinePrint';
import { magazinePrintUv } from './MagazinePrint';
import { PAPER_LEAF_THICKNESS, pageArchAt } from './bookGeometry';
import { magazineSheetPoint } from './MagazineGeometry';

export type MagazineLeafShape = {
  readonly width: number;
  readonly height: number;
  readonly depth: number;
  readonly startZ: number;
  readonly endZ: number;
};

export function createMagazineLeafGeometry(shape: MagazineLeafShape, faces: {
  readonly front?: MagazineSurface;
  readonly back?: MagazineSurface;
}) {
  const geometry = new BoxGeometry(shape.width, shape.height, shape.depth, 48, 12, 1);
  geometry.translate(shape.width / 2, 0, 0);
  const flat = geometry.getAttribute('position').clone();
  const normals = geometry.getAttribute('normal');
  const uv = geometry.getAttribute('uv');
  const print = new Float32Array(flat.count * 2);
  for (let index = 0; index < flat.count; index += 1) {
    const side = normals.getZ(index);
    const u = flat.getX(index) / shape.width;
    const v = .5 - flat.getY(index) / shape.height;
    print[index * 2] = side > 0 ? u : 1 - u;
    print[index * 2 + 1] = v;
    if (Math.abs(side) < .5) {
      uv.setXY(index, normals.getX(index) ? v : u,
        (flat.getZ(index) + shape.depth / 2) / PAPER_LEAF_THICKNESS);
      continue;
    }
    const surface = side > 0 ? faces.front : faces.back;
    if (surface) {
      const [x, y] = magazinePrintUv(surface, side > 0 ? u : 1 - u, v);
      uv.setXY(index, x, 1 - y);
    }
  }
  geometry.setAttribute('printCoordinate', new Float32BufferAttribute(print, 2));
  return { geometry, flat };
}

export function magazineLeafPose(cursor: number, leafIndex: number, cover: boolean) {
  const opening = MathUtils.clamp(cursor, 0, 1);
  return {
    progress: MathUtils.clamp(cursor - leafIndex, 0, 1), opening,
    spreadAngle: Math.PI * MathUtils.lerp(.55, .92, MathUtils.smoothstep(cursor, 1, 2)),
    arch: (cover ? .006 : .015) * opening,
  };
}

export type MagazineLeafPose = MagazineLeafShape & {
  readonly progress: number;
  readonly arch?: number;
  readonly opening?: number;
  readonly spreadAngle?: number;
};

export function magazineLeafPoint(distance: number, offset: number, pose: MagazineLeafPose) {
  const point = magazineSheetPoint({ distance, width: pose.width, progress: pose.progress,
    opening: pose.opening, spreadAngle: pose.spreadAngle });
  const arch = (pose.arch ?? 0) * pageArchAt(distance, pose.width) * Math.cos(Math.PI * pose.progress) ** 2;
  return { x: point.x + Math.sin(point.angle) * offset,
    z: MathUtils.lerp(pose.startZ, pose.endZ, pose.progress) + point.z + arch + Math.cos(point.angle) * offset };
}

export function shapeMagazineLeaf(geometry: BufferGeometry, flat: BufferAttribute, pose: MagazineLeafPose) {
  const vertices = geometry.getAttribute('position');
  for (let index = 0; index < vertices.count; index += 1) {
    const point = magazineLeafPoint(flat.getX(index), flat.getZ(index), pose);
    vertices.setXYZ(index, point.x, flat.getY(index), point.z);
  }
  vertices.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
}
