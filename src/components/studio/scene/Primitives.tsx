import { useEffect, useMemo } from 'react';
import { Quaternion, Vector3 } from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { Texture } from 'three';
import type { Point } from './config';

type BlockProps = {
  readonly size: Point;
  readonly position?: Point;
  readonly rotation?: Point;
  readonly color: string;
  readonly radius?: number;
  readonly roughness?: number;
  readonly metalness?: number;
  readonly texture?: Texture;
};

export function Block({ size, position = [0, 0, 0], rotation = [0, 0, 0], color,
  radius = 0.035, roughness = 0.65, metalness = 0, texture }: BlockProps) {
  const [width, height, depth] = size;
  const geometry = useMemo(() => new RoundedBoxGeometry(width, height, depth, 3, radius), [width, height, depth, radius]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} position={[...position]} rotation={[...rotation]} castShadow receiveShadow>
      <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} map={texture ?? null} />
    </mesh>
  );
}

type RodProps = {
  readonly from: Point;
  readonly to: Point;
  readonly radius: number;
  readonly endRadius?: number;
  readonly color: string;
  readonly metalness?: number;
};

export function Rod({ from, to, radius, endRadius = radius, color, metalness = 0 }: RodProps) {
  const { midpoint, quaternion, length } = useMemo(() => {
    const start = new Vector3(...from);
    const end = new Vector3(...to);
    const direction = end.clone().sub(start);
    return {
      midpoint: start.clone().add(end).multiplyScalar(0.5),
      quaternion: new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.clone().normalize()),
      length: direction.length(),
    };
  }, [from, to]);
  return (
    <mesh position={midpoint} quaternion={quaternion} castShadow receiveShadow>
      <cylinderGeometry args={[endRadius, radius, length, 16]} />
      <meshStandardMaterial color={color} metalness={metalness} roughness={0.48} />
    </mesh>
  );
}
