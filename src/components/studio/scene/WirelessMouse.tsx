import { useEffect, useMemo } from 'react';
import { CatmullRomCurve3, SphereGeometry, Vector3 } from 'three';
import { Block } from './Primitives';
import { PALETTE, type Point } from './config';

const WIDTH = 0.035;
const DEPTH = 0.059;
const HEIGHT = 0.035;
const BASE = 0.006;

function shellHeight(x: number, z: number) {
  return BASE + HEIGHT * Math.sqrt(Math.max(0, 1 - (x / WIDTH) ** 2 - (z / DEPTH) ** 2));
}

export function WirelessMouse({ position }: { readonly position: Point }) {
  const shell = useMemo(() => {
    const geometry = new SphereGeometry(1, 48, 32, 0, Math.PI * 2, 0, Math.PI / 2);
    geometry.scale(WIDTH, HEIGHT, DEPTH);
    return geometry;
  }, []);
  const seams = useMemo(() => [
    Array.from({ length: 16 }, (_, i) => {
      const z = -0.058 + i * 0.0035;
      return new Vector3(0, shellHeight(0, z) + 0.00025, z);
    }),
    Array.from({ length: 25 }, (_, i) => {
      const x = -0.0345 + i * 0.002875;
      const z = -0.004 + Math.abs(x) * 0.1;
      return new Vector3(x, shellHeight(x, z) + 0.0003, z);
    }),
  ].map(points => new CatmullRomCurve3(points)), []);
  useEffect(() => () => shell.dispose(), [shell]);

  return <group position={[...position]} rotation={[0, 0.08, 0]}>
    <Block size={[0.062, 0.006, 0.101]} position={[0, 0.003, 0]}
      color={PALETTE.rubber} radius={0.0025} roughness={0.85} />
    <mesh position={[-0.027, 0.009, 0.009]} scale={[0.017, 0.006, 0.038]} castShadow receiveShadow>
      <sphereGeometry args={[1, 28, 16]} />
      <meshStandardMaterial color={PALETTE.rubber} roughness={0.78} />
    </mesh>
    <mesh geometry={shell} position={[0, BASE, 0]} castShadow receiveShadow>
      <meshPhysicalMaterial color={PALETTE.graphite} roughness={0.4}
        clearcoat={0.16} clearcoatRoughness={0.52} />
    </mesh>
    {seams.map((curve, index) => <mesh key={index}>
      <tubeGeometry args={[curve, 32, 0.00055, 6, false]} />
      <meshStandardMaterial color={PALETTE.rubber} roughness={0.85} />
    </mesh>)}
    <Block size={[0.013, 0.002, 0.026]} position={[0, 0.035, -0.024]}
      color={PALETTE.rubber} radius={0.0008} roughness={0.9} />
    <group position={[0, 0.035, -0.024]} rotation={[0, 0, Math.PI / 2]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.008, 0.008, 0.011, 36]} />
        <meshStandardMaterial color={PALETTE.aluminium} metalness={0.72} roughness={0.31} />
      </mesh>
      {Array.from({ length: 24 }, (_, index) => {
        const angle = index * Math.PI / 12;
        return <mesh key={index} position={[Math.sin(angle) * 0.008, 0, Math.cos(angle) * 0.008]}>
          <cylinderGeometry args={[0.00045, 0.00045, 0.01, 5]} />
          <meshStandardMaterial color={PALETTE.graphite} roughness={0.62} />
        </mesh>;
      })}
    </group>
    {[-0.008, 0.011].map(z => <Block key={z} size={[0.004, 0.005, 0.015]}
      position={[-0.032, 0.019, z]} color={PALETTE.graphite} radius={0.0015} roughness={0.5} />)}
  </group>;
}
