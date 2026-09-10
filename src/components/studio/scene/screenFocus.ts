import type { CameraPose } from './config';

type VectorLike = {
  readonly x: number;
  readonly y: number;
  readonly z: number;
};

const POSITION_TOLERANCE = 0.002;
const DIRECTION_ALIGNMENT = 0.999999;

export function isScreenFocusSettled(
  selected: boolean,
  cameraPosition: VectorLike,
  cameraDirection: VectorLike,
  pose: CameraPose,
): boolean {
  if (!selected) return false;
  const dx = cameraPosition.x - pose.position[0];
  const dy = cameraPosition.y - pose.position[1];
  const dz = cameraPosition.z - pose.position[2];
  if (dx * dx + dy * dy + dz * dz > POSITION_TOLERANCE ** 2) return false;

  const tx = pose.target[0] - pose.position[0];
  const ty = pose.target[1] - pose.position[1];
  const tz = pose.target[2] - pose.position[2];
  const targetLength = Math.hypot(tx, ty, tz);
  return (cameraDirection.x * tx + cameraDirection.y * ty + cameraDirection.z * tz) / targetLength >= DIRECTION_ALIGNMENT;
}
