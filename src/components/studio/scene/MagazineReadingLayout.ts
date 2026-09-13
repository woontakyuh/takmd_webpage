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
    const pose = { ...packet, ...magazineLeafPose(cursor, packet.leaf, packet.cover),
      progress: packet.stationary ? 0 : Math.max(0, Math.min(1, cursor - packet.leaf)) };
    for (let column = 0; column <= 48; column += 1) for (const y of [-packet.height / 2, packet.height / 2]) {
      for (const offset of [-packet.depth / 2, packet.depth / 2]) {
        const point = magazineLeafPoint(packet.width * column / 48, offset, pose);
        points.push(new Vector3(point.x - width / 2, y, point.z));
      }
    }
  }
  const normal = new Vector3(0, .18, 1).normalize();
  const up = new Vector3(0, normal.z, -normal.y);
  const projected = new Box3().setFromPoints(points.map(p => new Vector3(p.x, p.dot(up), p.dot(normal))));
  const center = projected.getCenter(new Vector3());
  const extent = projected.getSize(new Vector3());
  const frame = archiveLayout(viewport, extent.x / extent.y, true);
  const scale = frame.imageHeight / extent.y;
  const target = new Vector3(center.x, 0, 0).addScaledVector(up, center.y).addScaledVector(normal, center.z);
  target.x += (viewport.width / 2 - frame.left - frame.imageWidth / 2) / scale;
  target.addScaledVector(up, (frame.top + frame.imageHeight / 2 - viewport.height / 2) / scale);
  const tangent = Math.tan(focusFov(null, viewport.width < 760, viewport.width, viewport.height) * Math.PI / 360);
  const distance = viewport.height / (2 * scale * tangent) + extent.z / 2;
  const position = target.clone().addScaledVector(normal, distance);
  const box = new Box3().setFromPoints(points);
  const bounds: [number, number, number][] = [];
  for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z])
    bounds.push([x, y, z]);
  return { position, target, bounds };
}
