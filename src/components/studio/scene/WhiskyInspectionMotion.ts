import { CatmullRomCurve3, MathUtils, Quaternion, Vector3 } from 'three';
import type { Group, Object3D } from 'three';
import { focusFov } from './config';
import type { Point } from './config';
import { ISIDORO_WORKTOP_HEIGHT } from './WhiskyCabinetLayout';

export const WHISKY_PRESENTATION = {
  position: [0, ISIDORO_WORKTOP_HEIGHT + 0.024, -0.205],
  camera: [0.03, 1.13, -1.10],
  target: [0, 0.82, -0.205],
} as const satisfies Readonly<Record<string, Point>>;

type WhiskyViewport = { readonly width: number; readonly height: number };

function fittedCabinetPose(cabinet: Group, viewport: WhiskyViewport, inspecting: boolean) {
  const { width, height } = viewport;
  const narrow = width < 760;
  const tangentY = Math.tan(focusFov(null, narrow, width, height) * Math.PI / 360);
  const tangentX = tangentY * width / height;
  const left = 48 / width - 1;
  const right = 2 * (width - (inspecting && !narrow ? 348 : 24)) / width - 1;
  const top = 1 - 48 / height;
  const bottom = 1 - 2 * (inspecting && narrow ? height * 0.6 - 24 : height - 24) / height;
  const centerX = (left + right) / 2, centerY = (top + bottom) / 2;
  const outward = new Vector3(-1.57, inspecting && narrow ? 2.5 : 0.8, -1.7).normalize();
  const horizontal = new Vector3(0, 1, 0).cross(outward).normalize();
  const vertical = outward.clone().cross(horizontal);
  const center = new Vector3(0.12, 0.65, -0.25);
  let distance = 2.42;
  for (const x of [-0.355, 0.61]) for (const y of [narrow ? -0.18 : 0.02, narrow ? 1.18 : 1.31]) for (const z of [-0.735, 0.255]) {
    const corner = new Vector3(x, y, z).sub(center);
    const horizontalPosition = corner.dot(horizontal), verticalPosition = corner.dot(vertical), depth = corner.dot(outward);
    distance = Math.max(distance,
      (horizontalPosition + right * tangentX * depth) / ((right - centerX) * tangentX),
      (-horizontalPosition - left * tangentX * depth) / ((centerX - left) * tangentX),
      (verticalPosition + top * tangentY * depth) / ((top - centerY) * tangentY),
      (-verticalPosition - bottom * tangentY * depth) / ((centerY - bottom) * tangentY));
  }
  const target = center.addScaledVector(horizontal, -centerX * tangentX * distance)
    .addScaledVector(vertical, -centerY * tangentY * distance);
  const position = target.clone().addScaledVector(outward, distance);
  cabinet.updateWorldMatrix(true, false);
  return { position: cabinet.localToWorld(position).toArray(), target: cabinet.localToWorld(target).toArray() };
}

export function whiskyCabinetPose(cabinet: Group, viewport: WhiskyViewport) {
  return fittedCabinetPose(cabinet, viewport, false);
}

export function whiskyInspectionPose(cabinet: Group, viewport: WhiskyViewport) {
  return fittedCabinetPose(cabinet, viewport, true);
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
  const curve = new CatmullRomCurve3([start, lifted, clear, above, stage], false, 'centripetal');
  curve.arcLengthDivisions = 240;
  return { start, stage, curve, rotation };
}

export function applyWhiskyPresentation(group: Group, path: ReturnType<typeof whiskyPresentationPath>, progress: number) {
  if (progress === 0) group.position.copy(path.start);
  else if (progress === 1) group.position.copy(path.stage);
  else path.curve.getPointAt(progress, group.position);
  group.quaternion.identity().slerp(path.rotation, MathUtils.smoothstep(progress, 0.32, 0.92));
}

export function advanceWhiskyProgress(progress: number, velocity: number, presenting: boolean, delta: number, reducedMotion: boolean) {
  const target = presenting ? 1 : 0;
  if (reducedMotion) return { progress: target, velocity: 0 };
  const decay = Math.exp(-8 * delta);
  const change = progress - target;
  const step = (velocity + 8 * change) * delta;
  const next = MathUtils.clamp(target + (change + step) * decay, 0, 1);
  const nextVelocity = (velocity - 8 * step) * decay;
  return Math.abs(next - target) < 0.001 && Math.abs(nextVelocity) < 0.01
    ? { progress: target, velocity: 0 } : { progress: next, velocity: nextVelocity };
}

type BottleClearance = {
  readonly position: Vector3;
  readonly radius: number;
  readonly height: number;
  readonly moving: boolean;
};

// Position vectors are the frame's mutable candidates; fixed shelf/worktop poses stay anchored.
export function resolveWhiskyBottleClearance(bottles: readonly BottleClearance[]) {
  for (let pass = 0; pass < 16; pass += 1) {
    let separated = true;
    for (let first = 0; first < bottles.length; first += 1) {
      const left = bottles[first];
      if (!left) continue;
      for (let second = first + 1; second < bottles.length; second += 1) {
        const right = bottles[second];
        if (!right || (!left.moving && !right.moving)) continue;
        const x = right.position.x - left.position.x;
        const z = right.position.z - left.position.z;
        const y = Math.max(0, right.position.y + right.radius - left.position.y - left.height + left.radius)
          - Math.max(0, left.position.y + left.radius - right.position.y - right.height + right.radius);
        const distance = Math.hypot(x, y, z);
        const clearance = left.radius + right.radius + 0.004;
        if (distance >= clearance - 0.00001) continue;
        separated = false;
        const normal = distance > 0.000001 ? new Vector3(x, y, z).divideScalar(distance) : new Vector3(0, 0, 1);
        const correction = clearance - distance;
        const leftShare = left.moving ? (right.moving ? 0.5 : 1) : 0;
        const rightShare = right.moving ? (left.moving ? 0.5 : 1) : 0;
        left.position.addScaledVector(normal, -correction * leftShare);
        right.position.addScaledVector(normal, correction * rightShare);
      }
    }
    if (separated) return;
  }
}
