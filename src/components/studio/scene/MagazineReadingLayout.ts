import { Box3, Vector3 } from 'three';
import { focusFov } from './config';
import { archiveLayout } from './roomArchiveLayout';
import { magazinePacketLayout } from './MagazineGeometry';
import type { MagazineDimensions } from './MagazineGeometry';
import { magazineLeafPoint, magazineLeafPose } from './MagazineLeafGeometry';

export function magazineReadingLayout(dimensions: MagazineDimensions,
  spreads: readonly { readonly leftLeaves?: number }[], page: number,
  viewport: { readonly width: number; readonly height: number }) {
  const { width, height, thickness } = dimensions;
  const layout = magazinePacketLayout(dimensions, spreads);
  const cursor = page + 1;
  const packets = layout.packets.map((packet, index) => ({ ...packet,
    width: index === 0 ? width : width - .001, height: index === 0 ? height : height - .001,
    cover: index === 0, leaf: index, stationary: false }));
  packets.push({ width: width - .001, height: height - .001, depth: layout.remainingDepth,
    startZ: layout.baseZ + layout.remainingDepth / 2, endZ: layout.baseZ + layout.remainingDepth / 2,
    cover: false, leaf: 0, stationary: true });
  packets.push({ width, height, depth: layout.coverThickness,
    startZ: -thickness / 2 + layout.coverThickness / 2, endZ: -thickness / 2 + layout.coverThickness / 2,
    cover: true, leaf: 0, stationary: true });

  const points: Vector3[] = [];
  for (const packet of packets) {
    const pose = { ...packet, ...magazineLeafPose(cursor, packet.leaf),
      progress: packet.stationary ? 0 : Math.max(0, Math.min(1, cursor - packet.leaf)) };
    for (let column = 0; column <= 48; column += 1) for (const y of [-packet.height / 2, packet.height / 2]) {
      for (const offset of [-packet.depth / 2, packet.depth / 2]) {
        const point = magazineLeafPoint(packet.width * column / 48, offset, pose);
        points.push(new Vector3(point.x - width / 2, y, point.z));
      }
    }
  }
  const normal = new Vector3(page < 0 ? -.12 : page === 0 ? -.55 : .30, page === 0 ? .30 : .40, 1).normalize();
  const right = new Vector3(0, 1, 0).cross(normal).normalize();
  const up = normal.clone().cross(right);
  const projected = new Box3().setFromPoints(points.map(p => new Vector3(p.dot(right), p.dot(up), p.dot(normal))));
  const center = projected.getCenter(new Vector3());
  const extent = projected.getSize(new Vector3());
  const frame = archiveLayout(viewport, extent.x / extent.y, true);
  const tangent = Math.tan(focusFov(null, viewport.width < 760, viewport.width, viewport.height) * Math.PI / 360);
  const focal = viewport.height / (2 * tangent);
  const left = frame.left - viewport.width / 2, top = viewport.height / 2 - frame.top;
  let distance = 0;
  for (const point of points) {
    const x = point.dot(right) - center.x, y = point.dot(up) - center.y, z = point.dot(normal) - center.z;
    distance = Math.max(distance,
      -(focal * x + left * z) / (frame.imageWidth / 2),
      (focal * x + (left + frame.imageWidth) * z) / (frame.imageWidth / 2),
      (focal * y + top * z) / (frame.imageHeight / 2),
      -(focal * y + (top - frame.imageHeight) * z) / (frame.imageHeight / 2));
  }
  distance *= 1.025;
  const target = right.clone().multiplyScalar(center.x).addScaledVector(up, center.y).addScaledVector(normal, center.z);
  target.addScaledVector(right, (viewport.width / 2 - frame.left - frame.imageWidth / 2) * distance / focal);
  target.addScaledVector(up, (frame.top + frame.imageHeight / 2 - viewport.height / 2) * distance / focal);
  const position = target.clone().addScaledVector(normal, distance);
  const bounds: [number, number, number][] = [];
  for (const axis of [right, normal, new Vector3(1, 0, 0), new Vector3(0, 0, 1)]) {
    for (const direction of [-1, 1]) {
      const edge = points.reduce((a, b) => direction * a.dot(axis) > direction * b.dot(axis) ? a : b);
      for (const y of [-height / 2, height / 2]) bounds.push([edge.x, y, edge.z]);
    }
  }
  return { position, target, bounds };
}
