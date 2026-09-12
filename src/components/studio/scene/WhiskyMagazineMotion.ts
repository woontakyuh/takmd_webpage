import { MathUtils } from 'three';

export const MAGAZINE_REST = { x: .16, y: .802, z: .014, yaw: -1.25 };
export const MAGAZINE_READING = { x: .10, y: .82, z: .50, yaw: 0 };

export function whiskyMagazineTransform(progress: number) {
  const lift = MathUtils.smoothstep(progress, 0, .18);
  const pull = MathUtils.smoothstep(progress, .18, .62);
  const turn = MathUtils.smoothstep(progress, .62, 1);
  return {
    x: MathUtils.lerp(MAGAZINE_REST.x, MAGAZINE_READING.x, turn),
    y: MAGAZINE_REST.y + .034 * lift + (MAGAZINE_READING.y - MAGAZINE_REST.y - .034) * turn,
    z: MathUtils.lerp(MAGAZINE_REST.z, MAGAZINE_READING.z, pull),
    yaw: MathUtils.lerp(MAGAZINE_REST.yaw, MAGAZINE_READING.yaw, turn),
  };
}
