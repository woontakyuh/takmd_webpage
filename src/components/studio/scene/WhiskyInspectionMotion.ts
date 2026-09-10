import { CurvePath, LineCurve3, MathUtils, QuadraticBezierCurve3, Quaternion, Vector3 } from 'three';
import type { Camera, Group, Object3D } from 'three';
import { focusFov } from './config';
import type { Point } from './config';
import type { BottleSpec } from './WhiskyBottleSpecs';
import { ISIDORO_BOTTLE_SHELF_TOP, ISIDORO_DIMENSIONS, ISIDORO_WORKTOP_HEIGHT } from './WhiskyCabinetLayout';

export const WHISKY_PRESENTATION = {
  position: [0, ISIDORO_WORKTOP_HEIGHT + 0.024, -0.205],
  camera: [0.03, 1.13, -1.10],
  target: [0, 0.82, -0.205],
} as const satisfies Readonly<Record<string, Point>>;

type WhiskyViewport = { readonly width: number; readonly height: number };

export function whiskyInspectionLayout({ width, height }: WhiskyViewport) {
  const stacked = width < 960 && height >= width;
  const inset = width < 760 ? 16 : 24;
  const gap = 32;
  const panelWidth = stacked ? width - inset * 2 : Math.min(300, width * 0.36);
  const panelTop = stacked ? height * 0.61 : inset;
  const objectWidth = stacked ? width - inset * 2
    : Math.min(width - panelWidth - gap - inset * 2, (height - inset * 2) * 1.05);
  const objectLeft = stacked ? inset : (width - objectWidth - gap - panelWidth) / 2;
  return {
    stacked, inset, gap,
    object: { left: objectLeft, right: objectLeft + objectWidth, top: stacked ? 80 : inset, bottom: stacked ? panelTop - gap : height - inset },
    panel: { left: stacked ? inset : objectLeft + objectWidth + gap, top: panelTop, width: panelWidth, maxHeight: height - panelTop - inset },
  };
}

function cabinetFramePoints(angles: readonly number[]) {
  const points: Vector3[] = [];
  const halfWidth = ISIDORO_DIMENSIONS.width / 2;
  const halfDepth = ISIDORO_DIMENSIONS.depth / 2;
  for (const x of [-halfWidth, halfWidth]) for (const y of [0.004, ISIDORO_DIMENSIONS.height]) for (const z of [0, halfDepth]) points.push(new Vector3(x, y, z));
  for (const angle of angles) {
    const cosine = Math.cos(angle), sine = Math.sin(angle);
    for (const part of [
      { x: [-ISIDORO_DIMENSIONS.width, 0], y: [0.004, ISIDORO_DIMENSIONS.height], z: [-halfDepth, 0] },
      { x: [-0.634, -0.588], y: [0.503, 0.737], z: [-0.301, -0.259] },
    ]) for (const x of part.x) for (const y of part.y) for (const z of part.z) points.push(new Vector3(halfWidth + x * cosine + z * sine, y, -x * sine + z * cosine));
  }
  for (const x of [-0.31, 0.31]) for (const y of [0.616, 0.634]) for (const z of [-0.32, 0]) points.push(new Vector3(x, y, z));
  return points;
}

export function whiskyCabinetScreenBounds(cabinet: Object3D, camera: Camera, { width, height }: WhiskyViewport) {
  const angle = cabinet.getObjectByName('Isidoro book-opening mobile half')?.rotation.y ?? 0;
  cabinet.updateWorldMatrix(true, false);
  const points = cabinetFramePoints([angle]).map(point => cabinet.localToWorld(point).project(camera));
  return {
    left: (Math.min(...points.map(point => point.x)) + 1) * width / 2,
    right: (Math.max(...points.map(point => point.x)) + 1) * width / 2,
    top: (1 - Math.max(...points.map(point => point.y))) * height / 2,
    bottom: (1 - Math.min(...points.map(point => point.y))) * height / 2,
  };
}

function fittedCabinetPose(cabinet: Group, viewport: WhiskyViewport, inspecting: boolean) {
  const { width, height } = viewport;
  const narrow = width < 760;
  const layout = whiskyInspectionLayout(viewport);
  const tangentY = Math.tan(focusFov(null, narrow, width, height) * Math.PI / 360);
  const tangentX = tangentY * width / height;
  const area = inspecting ? layout.object : { left: layout.inset, right: width - layout.inset, top: layout.inset, bottom: height - layout.inset };
  const left = 2 * area.left / width - 1;
  const right = 2 * area.right / width - 1;
  const top = 1 - 2 * area.top / height;
  const bottom = 1 - 2 * area.bottom / height;
  const centerX = (left + right) / 2, centerY = (top + bottom) / 2;
  const outward = new Vector3(-1.57, inspecting && layout.stacked ? 2.5 : 0.8, -1.7).normalize();
  const horizontal = new Vector3(0, 1, 0).cross(outward).normalize();
  const vertical = outward.clone().cross(horizontal);
  const center = new Vector3(0.12, ISIDORO_DIMENSIONS.height / 2, -0.25);
  let distance = 0;
  const angles = inspecting ? [-Math.PI / 2] : Array.from({ length: 13 }, (_, index) => -index * Math.PI / 24);
  for (const point of cabinetFramePoints(angles)) {
    const corner = point.sub(center);
    const horizontalPosition = corner.dot(horizontal), verticalPosition = corner.dot(vertical), depth = corner.dot(outward);
    distance = Math.max(distance,
      (horizontalPosition + right * tangentX * depth) / ((right - centerX) * tangentX),
      (-horizontalPosition - left * tangentX * depth) / ((centerX - left) * tangentX),
      (verticalPosition + top * tangentY * depth) / ((top - centerY) * tangentY),
      (-verticalPosition - bottom * tangentY * depth) / ((centerY - bottom) * tangentY));
  }
  distance *= 1.005;
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

function roundedRoute(points: readonly Vector3[]) {
  const curve = new CurvePath<Vector3>();
  let previous = points[0];
  for (let index = 1; index < points.length - 1; index += 1) {
    const corner = points[index];
    const next = points[index + 1];
    const radius = Math.min(0.025, corner.distanceTo(points[index - 1]) / 3, corner.distanceTo(next) / 3);
    const entry = corner.clone().addScaledVector(points[index - 1].clone().sub(corner).normalize(), radius);
    const exit = corner.clone().addScaledVector(next.clone().sub(corner).normalize(), radius);
    curve.add(new LineCurve3(previous, entry));
    curve.add(new QuadraticBezierCurve3(entry, corner, exit));
    previous = exit;
  }
  curve.add(new LineCurve3(previous, points[points.length - 1]));
  return curve;
}

export function whiskyPresentationPath(cabinet: Group, parent: Object3D, bottle: Pick<BottleSpec, 'position' | 'radius'>) {
  cabinet.updateWorldMatrix(true, false);
  parent.updateWorldMatrix(true, false);
  const stage = parent.worldToLocal(cabinet.localToWorld(new Vector3(...WHISKY_PRESENTATION.position)));
  const start = new Vector3(...bottle.position);
  const lifted = start.clone();
  if (start.y >= ISIDORO_BOTTLE_SHELF_TOP) lifted.y += 0.04;
  const clear = lifted.clone();
  // Clear the deepest overhead panel plus the complete bottle before rounding into the lift.
  clear.z = ISIDORO_DIMENSIONS.depth / 4 + bottle.radius * 1.005 + 0.00035 + 0.035;
  const rise = clear.clone();
  rise.y = Math.max(clear.y, stage.y) + 0.045;
  const above = stage.clone();
  above.y = Math.max(clear.y, stage.y) + 0.045;
  const rotation = parent.getWorldQuaternion(new Quaternion()).invert()
    .multiply(cabinet.getWorldQuaternion(new Quaternion()))
    .multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI));
  const curve = roundedRoute(start.equals(lifted) ? [start, clear, rise, above, stage] : [start, lifted, clear, rise, above, stage]);
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
