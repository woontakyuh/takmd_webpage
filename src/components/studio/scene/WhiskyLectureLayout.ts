import { Vector3 } from 'three';
import type { Object3D } from 'three';
import { focusFov } from './config';

export const WHISKY_LECTURE = {
  id: '18c908af25b980b6b436e189b233b958',
  width: 0.21,
  height: 0.21 * 1357 / 1920,
  inspection: 'whisky-lecture',
} as const;

type Viewport = { readonly width: number; readonly height: number };

export function whiskyLectureLayout({ width, height }: Viewport) {
  const paperHeight = Math.min(height - 224, (width - 48) * WHISKY_LECTURE.height / WHISKY_LECTURE.width, 640);
  const paperTop = Math.max(72, (height - paperHeight - 112) / 2);
  return { paperHeight, paperTop, controlsTop: paperTop + paperHeight + 24 };
}

export function whiskyLecturePose(card: Object3D, viewport: Viewport) {
  const layout = whiskyLectureLayout(viewport);
  const tangent = Math.tan(focusFov(null, viewport.width < 760, viewport.width, viewport.height) * Math.PI / 360);
  const distance = WHISKY_LECTURE.height * viewport.height / (2 * layout.paperHeight * tangent);
  const centerY = 1 - 2 * (layout.paperTop + layout.paperHeight / 2) / viewport.height;
  const target = new Vector3(0, -centerY * tangent * distance, 0);
  const position = target.clone().add(new Vector3(0, 0, distance));
  card.updateWorldMatrix(true, false);
  return { position: card.localToWorld(position).toArray(), target: card.localToWorld(target).toArray() };
}
