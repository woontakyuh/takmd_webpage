import { Vector3 } from 'three';
import type { Object3D } from 'three';
import { focusFov } from './config';

type Viewport = { readonly width: number; readonly height: number };

export function archiveLayout(viewport: Viewport, aspect: number, side: boolean) {
  const { width, height } = viewport;
  const stacked = !side || width < 760 || width < height;
  const copyWidth = Math.min(stacked ? 400 : 300, width - 48);
  const gap = width < 760 ? 16 : 24;
  const maxWidth = width - 48 - (stacked ? 0 : copyWidth + gap);
  const imageHeight = Math.max(100, Math.min(height - (stacked ? 232 : 152), maxWidth / aspect, 700));
  const imageWidth = imageHeight * aspect;
  const left = (width - imageWidth - (stacked ? 0 : copyWidth + gap)) / 2;
  const top = Math.max(76, (height - imageHeight - (stacked ? 136 : 0)) / 2);
  return { imageWidth, imageHeight, left, top, copyWidth, gap, stacked };
}

export function archivePose(object: Object3D, viewport: Viewport, width: number, height: number, side = false, tilt = 0) {
  const layout = archiveLayout(viewport, width / height, side);
  const tangent = Math.tan(focusFov(null, viewport.width < 760, viewport.width, viewport.height) * Math.PI / 360);
  const scale = layout.imageHeight / height;
  const distance = viewport.height / (2 * scale * tangent);
  const target = new Vector3(
    (viewport.width / 2 - layout.left - layout.imageWidth / 2) / scale,
    (layout.top + layout.imageHeight / 2 - viewport.height / 2) / scale, 0);
  const position = target.clone().add(new Vector3(0, -tilt * distance, distance));
  object.updateWorldMatrix(true, false);
  return { position: object.localToWorld(position).toArray(), target: object.localToWorld(target).toArray() };
}
