import { Vector3 } from 'three';
import type { Object3D } from 'three';
import { focusFov } from './config';

export const WHISKY_LECTURE = {
  id: '18c908af25b980b6b436e189b233b958',
  width: 0.42,
  height: 0.42 * 1357 / 1920,
  pinXs: [-0.150, 0.150],
  pinY: 0.42 * 1357 / 1920 / 2 - 0.010,
  magnetScale: 0.72,
  foldY: 0.42 * 1357 / 1920 / 2 - 0.022,
  foldRadius: 0.007,
  cabinetFront: -0.2585,
  sheetThickness: 0.00012,
  inspection: 'whisky-lecture',
} as const;

type Viewport = { readonly width: number; readonly height: number };

export function whiskyLectureLayout({ width, height }: Viewport) {
  const aspect = WHISKY_LECTURE.width / WHISKY_LECTURE.height;
  const paperHeight = Math.min(height - 160, (width - (width < 760 ? 40 : 64)) / aspect, 560);
  const paperWidth = paperHeight * aspect;
  const paperTop = Math.max(60, Math.min(height - paperHeight - 56,
    (height - paperHeight) / 2 + Math.min(80, paperHeight * .12)));
  return { paperHeight, paperWidth, paperTop, paperCenterX: width / 2 };
}

export function whiskyLecturePose(card: Object3D, viewport: Viewport) {
  const layout = whiskyLectureLayout(viewport);
  const tangent = Math.tan(focusFov(null, viewport.width < 760, viewport.width, viewport.height) * Math.PI / 360);
  const distance = WHISKY_LECTURE.height * viewport.height / (2 * layout.paperHeight * tangent);
  const centerX = 2 * layout.paperCenterX / viewport.width - 1;
  const centerY = 1 - 2 * (layout.paperTop + layout.paperHeight / 2) / viewport.height;
  const target = new Vector3(-centerX * tangent * viewport.width / viewport.height * distance, -centerY * tangent * distance, 0);
  card.updateWorldMatrix(true, false);
  const position = target.clone().add(new Vector3(0, 0, distance));
  return { position: card.localToWorld(position).toArray(), target: card.localToWorld(target).toArray() };
}
