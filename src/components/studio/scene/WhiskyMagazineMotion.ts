import { MathUtils } from 'three';

const lean = .16, yaw = -1.25;
const halfHeight = .27 / 2, halfWidth = .207 / 2, halfDepth = .006 / 2;
export const MAGAZINE_REST = { x: .16,
  y: .6665 + Math.cos(lean) * halfHeight + Math.sin(lean) * halfDepth,
  z: -.0895 + Math.abs(Math.sin(yaw)) * halfWidth
    + Math.cos(yaw) * (Math.sin(lean) * halfHeight + Math.cos(lean) * halfDepth),
  yaw, pitch: -lean };
export const MAGAZINE_READING = { x: .10, y: .82, z: .50, yaw: 0, pitch: 0 };

export function whiskyMagazineTransform(progress: number) {
  const lift = MathUtils.smoothstep(progress, 0, .18);
  const pull = MathUtils.smoothstep(progress, .18, .62);
  const turn = MathUtils.smoothstep(progress, .62, 1);
  return {
    x: MathUtils.lerp(MAGAZINE_REST.x, MAGAZINE_READING.x, turn),
    y: MAGAZINE_REST.y + .034 * lift + (MAGAZINE_READING.y - MAGAZINE_REST.y - .034) * turn,
    z: MathUtils.lerp(MAGAZINE_REST.z, MAGAZINE_READING.z, pull),
    pitch: MathUtils.lerp(MAGAZINE_REST.pitch, 0, lift),
    yaw: MathUtils.lerp(MAGAZINE_REST.yaw, MAGAZINE_READING.yaw, turn),
  };
}
