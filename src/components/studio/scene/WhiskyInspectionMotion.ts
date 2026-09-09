import { MathUtils, Quaternion, Vector3 } from 'three';
import type { Group, Object3D } from 'three';
import type { Point } from './config';
import { ISIDORO_WORKTOP_HEIGHT } from './WhiskyCabinetLayout';

export const WHISKY_PRESENTATION = {
  position: [0, ISIDORO_WORKTOP_HEIGHT + 0.024, -0.205],
  camera: [0.03, 1.13, -1.10],
  target: [0, 0.82, -0.205],
} as const satisfies Readonly<Record<string, Point>>;

export function whiskyInspectionPose(cabinet: Group, narrow: boolean) {
  cabinet.updateWorldMatrix(true, false);
  const position = cabinet.localToWorld(new Vector3(...WHISKY_PRESENTATION.camera));
  const target = cabinet.localToWorld(new Vector3(...WHISKY_PRESENTATION.target));
  if (narrow) target.y -= 0.09;
  return { position: position.toArray(), target: target.toArray() };
}

export function whiskyPresentationPath(cabinet: Group, parent: Object3D, slot: Point) {
  cabinet.updateWorldMatrix(true, false);
  parent.updateWorldMatrix(true, false);
  const stage = parent.worldToLocal(cabinet.localToWorld(new Vector3(...WHISKY_PRESENTATION.position)));
  const start = new Vector3(...slot);
  const lifted = start.clone().add(new Vector3(0, 0.04, 0));
  const clear = lifted.clone().add(new Vector3(0, 0, 0.22));
  const above = stage.clone();
  above.y = Math.max(clear.y, stage.y) + 0.045;
  const rotation = parent.getWorldQuaternion(new Quaternion()).invert()
    .multiply(cabinet.getWorldQuaternion(new Quaternion()))
    .multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI));
  return { points: [start, lifted, clear, above, stage] as const, rotation };
}

export function applyWhiskyPresentation(group: Group, path: ReturnType<typeof whiskyPresentationPath>, progress: number) {
  const segments = path.points.length - 1;
  const segment = Math.min(segments - 1, Math.floor(progress * segments));
  const from = path.points[segment];
  const to = path.points[segment + 1];
  if (!from || !to) return;
  const amount = MathUtils.smoothstep(progress * segments - segment, 0, 1);
  group.position.lerpVectors(from, to, amount);
  group.quaternion.identity().slerp(path.rotation, MathUtils.smoothstep(progress, 0.50, 0.9));
}
