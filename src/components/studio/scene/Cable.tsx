import { useMemo } from 'react';
import { CatmullRomCurve3, Vector3 } from 'three';
import type { Point } from './config';
import { PALETTE } from './config';

type CableProps = {
  readonly points: readonly Point[];
  readonly radius?: number;
};

export function Cable({ points, radius = 0.0032 }: CableProps) {
  const curve = useMemo(() => new CatmullRomCurve3(points.map(point => new Vector3(...point))), [points]);
  return (
    <mesh castShadow receiveShadow>
      <tubeGeometry args={[curve, 36, radius, 8, false]} />
      <meshStandardMaterial color={PALETTE.ink} roughness={0.62} metalness={0.08} />
    </mesh>
  );
}
