import { RoundedBox } from '@react-three/drei';
import { useMemo } from 'react';
import { Quaternion, Vector3 } from 'three';
import { Cable } from './Cable';
import type { Point } from './config';
import { PALETTE } from './config';
import { Block, Rod } from './Primitives';

const MONITOR_TILT = -0.04;

export const MONITOR_ARM = {
  deskEdgeContact: [-0.149542, -0.0075, -0.113412],
  basePivot: [-0.149542, 0.084, -0.113412],
  elbowPivot: [-0.104, 0.208, -0.084],
  vesaPivot: [0, 0.368, -0.066],
  vesaPlate: [0, 0.36802, -0.0495],
  miniDisplayPort: [0.006, 0.0195, 0.0663],
  monitorDisplayPort: [0.042, 0.3683, -0.043],
  monitorPowerPort: [0.092, 0.3663, -0.043],
  underDeskOutlet: [-0.083, -0.6345, -0.148],
} as const satisfies Readonly<Record<string, Point>>;

const ARM_JOINTS: readonly Point[] = [
  MONITOR_ARM.basePivot,
  MONITOR_ARM.elbowPivot,
  MONITOR_ARM.vesaPivot,
];

export function MonitorArm() {
  const [clampX, clampY, clampZ] = MONITOR_ARM.deskEdgeContact;
  return (
    <group>
      <DeskEdgeClamp position={MONITOR_ARM.deskEdgeContact} />
      <Pivot position={MONITOR_ARM.basePivot} />
      <ArmLink from={MONITOR_ARM.basePivot} to={MONITOR_ARM.elbowPivot} />
      <ArmLink from={MONITOR_ARM.elbowPivot} to={MONITOR_ARM.vesaPivot} />
      {ARM_JOINTS.slice(1).map(point => <Pivot key={point.join('-')} position={point} />)}
      <VesaPlate />
      <Block size={[0.016, 0.009, 0.003]} position={[...MONITOR_ARM.monitorPowerPort]}
        color={PALETTE.ink} radius={0.001} roughness={0.72} />
      <Cable points={[
        MONITOR_ARM.miniDisplayPort,
        [0.012, 0.118, 0.012],
        [-0.034, 0.232, -0.046],
        [-0.079, 0.213, -0.061],
        MONITOR_ARM.monitorDisplayPort,
      ]} radius={0.0031} />
      <Cable points={[
        MONITOR_ARM.monitorPowerPort,
        [0.05, 0.32, -0.067],
        [-0.062, 0.227, -0.1],
        [-0.145, 0.102, -0.136],
        [-0.149542, 0.014, -0.137],
        [-0.02, -0.005, -0.138],
        MONITOR_ARM.underDeskOutlet,
      ]} radius={0.0034} />
      <CableGuide position={[clampX, clampY - 0.002, clampZ - 0.026]} />
    </group>
  );
}

function DeskEdgeClamp({ position }: { readonly position: Point }) {
  const [x, edgeY, z] = position;
  return (
    <group>
      <Block size={[0.116, 0.012, 0.076]} position={[x, edgeY - 0.006, z]}
        color={PALETTE.ink} radius={0.004} roughness={0.4} metalness={0.78} />
      <Block size={[0.072, 0.009, 0.052]} position={[x, -0.069, z]}
        color={PALETTE.ink} radius={0.003} roughness={0.42} metalness={0.76} />
      <Block size={[0.038, 0.06, 0.025]} position={[x, -0.039, z + 0.018]}
        color={PALETTE.steel} radius={0.003} roughness={0.44} metalness={0.72} />
      <Rod from={[x, -0.052, z + 0.018]} to={[x, -0.068, z + 0.018]} radius={0.006}
        color={PALETTE.graphite} metalness={0.74} />
      <Block size={[0.054, 0.098, 0.055]} position={[x, 0.035, z]}
        color={PALETTE.ink} radius={0.008} roughness={0.38} metalness={0.78} />
      <Block size={[0.062, 0.012, 0.062]} position={[x, 0.079, z]}
        color={PALETTE.steel} radius={0.004} roughness={0.42} metalness={0.72} />
    </group>
  );
}

function ArmLink({ from, to }: { readonly from: Point; readonly to: Point }) {
  const { length, midpoint, quaternion } = useMemo(() => linkFrame(from, to), [from, to]);
  const pistonStart = pointAlong(from, to, 0.19, 0.019);
  const pistonEnd = pointAlong(from, to, 0.76, 0.019);
  return (
    <>
      <group position={midpoint} quaternion={quaternion}>
        <RoundedBox args={[0.066, length, 0.034]} radius={0.009} smoothness={3} bevelSegments={3} castShadow receiveShadow>
          <meshStandardMaterial color={PALETTE.ink} roughness={0.36} metalness={0.8} />
        </RoundedBox>
        <RoundedBox args={[0.037, length * 0.78, 0.008]} position={[0, 0, 0.019]} radius={0.003} smoothness={3} bevelSegments={2} castShadow receiveShadow>
          <meshStandardMaterial color={PALETTE.steel} roughness={0.34} metalness={0.78} />
        </RoundedBox>
        {[-0.22, 0.22].map(offset => <RoundedBox key={offset} args={[0.076, 0.009, 0.043]} position={[0, length * offset, 0]}
          radius={0.003} smoothness={3} bevelSegments={2} castShadow receiveShadow>
          <meshStandardMaterial color={PALETTE.graphite} roughness={0.42} metalness={0.72} />
        </RoundedBox>)}
        {[-0.18, 0.16].map(offset => <CableGuide key={offset} position={[0, length * offset, 0.023]} />)}
      </group>
      <Rod from={pistonStart} to={pistonEnd} radius={0.0062} color={PALETTE.steel} metalness={0.8} />
    </>
  );
}

function Pivot({ position }: { readonly position: Point }) {
  return (
    <group position={[...position]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.029, 0.029, 0.048, 24]} />
        <meshStandardMaterial color={PALETTE.ink} roughness={0.34} metalness={0.82} />
      </mesh>
      {[-0.025, 0.025].map(z => <mesh key={z} position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.017, 0.017, 0.003, 20]} />
        <meshStandardMaterial color={PALETTE.steel} roughness={0.29} metalness={0.84} />
      </mesh>)}
    </group>
  );
}

function VesaPlate() {
  const [x, y, z] = MONITOR_ARM.vesaPlate;
  return (
    <group position={[x, y, z]} rotation={[MONITOR_TILT, 0, 0]}>
      <Block size={[0.122, 0.122, 0.014]} color={PALETTE.ink} radius={0.007} roughness={0.37} metalness={0.78} />
      {[-0.041, 0.041].flatMap(xOffset => [-0.041, 0.041].map(yOffset => <mesh key={`${xOffset}-${yOffset}`} position={[xOffset, yOffset, -0.008]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.0055, 0.0055, 0.003, 16]} />
        <meshStandardMaterial color={PALETTE.steel} roughness={0.3} metalness={0.84} />
      </mesh>))}
      <Block size={[0.052, 0.052, 0.018]} position={[0, 0, -0.015]} color={PALETTE.graphite}
        radius={0.007} roughness={0.36} metalness={0.76} />
    </group>
  );
}

function CableGuide({ position }: { readonly position: Point }) {
  return <Block size={[0.073, 0.01, 0.014]} position={[...position]} color={PALETTE.steel}
    radius={0.002} roughness={0.48} metalness={0.66} />;
}

function linkFrame(from: Point, to: Point) {
  const start = new Vector3(...from);
  const end = new Vector3(...to);
  const direction = end.clone().sub(start);
  return {
    length: direction.length(),
    midpoint: start.add(end).multiplyScalar(0.5),
    quaternion: new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize()),
  };
}

function pointAlong(from: Point, to: Point, progress: number, zOffset: number): Point {
  return [
    from[0] + (to[0] - from[0]) * progress,
    from[1] + (to[1] - from[1]) * progress,
    from[2] + (to[2] - from[2]) * progress + zOffset,
  ];
}
