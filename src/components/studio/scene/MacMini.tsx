import { DoubleSide } from 'three';
import { MacMiniStickers } from './MacMiniStickers';
import { useEffect, useMemo } from 'react';
import type { Point } from './config';
import { PALETTE } from './config';
import { appleMarkShapes, roundedFrustumGeometry, roundedRectangle } from './MacMiniGeometry';

export const M4_MAC_MINI = {
  size: [0.127, 0.05, 0.127],
  front: 0.0635,
} as const;

const PLAN_RADIUS = 0.016;
const ENCLOSURE_BASE = 0.007;
const ENCLOSURE_BODY_HEIGHT = 0.043;
const ENCLOSURE_BEVEL = 0.0017;
const FACE_Z = M4_MAC_MINI.front + 0.0001;

type MacMiniProps = {
  readonly position: Point;
  readonly onClaudeSticker: () => void;
};

export function MacMini({ position, onClaudeSticker }: MacMiniProps) {
  return (
    <group position={[...position]}>
      <MacMiniEnclosure />
      <MacMiniBase />
      <FrontPorts />
      <RearPorts />
      <MacMiniStickers onClaudeSticker={onClaudeSticker} />
    </group>
  );
}

function MacMiniEnclosure() {
  const enclosureShape = useMemo(() => roundedRectangle(
    M4_MAC_MINI.size[0] - ENCLOSURE_BEVEL * 2,
    M4_MAC_MINI.size[2] - ENCLOSURE_BEVEL * 2,
    PLAN_RADIUS - ENCLOSURE_BEVEL,
  ), []);
  return <group>
    <mesh position={[0, ENCLOSURE_BASE + ENCLOSURE_BEVEL, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
      <extrudeGeometry args={[enclosureShape, {
        depth: ENCLOSURE_BODY_HEIGHT - ENCLOSURE_BEVEL * 2,
        bevelEnabled: true,
        bevelSegments: 2,
        bevelSize: ENCLOSURE_BEVEL,
        bevelThickness: ENCLOSURE_BEVEL,
        curveSegments: 16,
      }]} />
      <meshPhysicalMaterial color={PALETTE.aluminiumEdge} roughness={0.3} metalness={0.58}
        clearcoat={0.08} clearcoatRoughness={0.52} envMapIntensity={1.35} />
    </mesh>
    <AppleMark />
  </group>;
}

function MacMiniBase() {
  const geometry = useMemo(() => roundedFrustumGeometry(0.116, 0.106, 0.007, 0.013), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <group>
    <mesh geometry={geometry} position={[0, 0.0035, 0]} castShadow receiveShadow>
      <meshStandardMaterial color={PALETTE.rubber} roughness={0.82} metalness={0.06} side={DoubleSide} />
    </mesh>
    <FacePlate size={[0.108, 0.0062, 0.001]} position={[0, 0.0037, 0.0558]}
      color={PALETTE.rubber} radius={0.003} roughness={0.82} metalness={0.06} />
    <FacePlate size={[0.108, 0.0062, 0.001]} position={[0, 0.0037, -0.0558]} facing="rear"
      color={PALETTE.rubber} radius={0.003} roughness={0.82} metalness={0.06} />
    {Array.from({ length: 25 }, (_, index) => {
      const x = -0.048 + index * 0.004;
      return <group key={x}>
        <FacePlate size={[0.0019, 0.0058, 0.0007]} position={[x, 0.0037, 0.0566]}
          color={PALETTE.graphite} radius={0.00045} roughness={0.72} metalness={0.08} />
        <FacePlate size={[0.0019, 0.0058, 0.0007]} position={[x, 0.0037, -0.0566]} facing="rear"
          color={PALETTE.graphite} radius={0.00045} roughness={0.72} metalness={0.08} />
      </group>;
    })}
  </group>;
}

function AppleMark() {
  const shapes = useMemo(appleMarkShapes, []);
  return <group position={[0, 0.05008, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.0024, 0.0024, 0.0024]}>
    {shapes.map((shape, index) => <mesh key={index} position={[-7, 9, 0]} scale={[1, -1, 1]}>
      <shapeGeometry args={[shape]} />
      <meshPhysicalMaterial color={PALETTE.graphite} roughness={0.22} metalness={0.32} clearcoat={0.3} />
    </mesh>)}
  </group>;
}

function FrontPorts() {
  return <group>
    {[-0.037, -0.0215].map(x => <FacePlate key={x} size={[0.0038, 0.0102, 0.0013]} position={[x, 0.026, FACE_Z]}
      color={PALETTE.graphite} radius={0.0018} roughness={0.48} metalness={0.18} />)}
    <mesh position={[0.036, 0.026, FACE_Z]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.00215, 0.00215, 0.0018, 16]} />
      <meshStandardMaterial color={PALETTE.graphite} roughness={0.62} metalness={0.16} />
    </mesh>
    <mesh position={[0.0245, 0.026, FACE_Z + 0.0008]}>
      <sphereGeometry args={[0.00105, 12, 8]} />
      <meshBasicMaterial color={PALETTE.white} />
    </mesh>
  </group>;
}

function RearPorts() {
  return <group>
    <FigureEightPowerInlet />
    <FacePlate size={[0.0155, 0.0125, 0.0014]} position={[0.019, 0.026, -FACE_Z]} facing="rear"
      color={PALETTE.graphite} radius={0.0013} roughness={0.58} metalness={0.14} />
    <FacePlate size={[0.015, 0.0068, 0.0014]} position={[-0.0015, 0.026, -FACE_Z]} facing="rear"
      color={PALETTE.graphite} radius={0.0011} roughness={0.5} metalness={0.16} />
    {[-0.022, -0.0375, -0.053].map(x => <FacePlate key={x} size={[0.0038, 0.0102, 0.0013]} position={[x, 0.026, -FACE_Z]} facing="rear"
      color={PALETTE.graphite} radius={0.0018} roughness={0.48} metalness={0.18} />)}
  </group>;
}

function FigureEightPowerInlet() {
  return <group>
    <FacePlate size={[0.019, 0.0115, 0.0015]} position={[0.044, 0.026, -FACE_Z]} facing="rear"
      color={PALETTE.graphite} radius={0.0054} roughness={0.62} metalness={0.12} />
    {[-0.0042, 0.0042].map(offset => <mesh key={offset} position={[0.044 + offset, 0.026, -FACE_Z - 0.0009]}
      rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.003, 0.003, 0.0008, 18]} />
      <meshStandardMaterial color={PALETTE.rubber} roughness={0.78} metalness={0.05} />
    </mesh>)}
  </group>;
}

type PlateProps = {
  readonly size: Point;
  readonly position: Point;
  readonly color: string;
  readonly radius: number;
  readonly roughness: number;
  readonly metalness: number;
  readonly rotation?: Point;
};

type FacePlateProps = PlateProps & { readonly facing?: 'front' | 'rear' };

function FacePlate({ size, position, color, radius, roughness, metalness, facing = 'front' }: FacePlateProps) {
  const [width, height] = size;
  const shape = useMemo(() => roundedRectangle(width, height, radius), [width, height, radius]);
  const depthDirection = facing === 'front' ? -1 : 1;
  return <mesh position={[position[0], position[1], position[2] + depthDirection * size[2] / 2]}
    rotation={facing === 'front' ? [0, 0, 0] : [0, Math.PI, 0]} castShadow receiveShadow>
    <extrudeGeometry args={[shape, {
      depth: size[2],
      bevelEnabled: false,
      curveSegments: 12,
    }]} />
    <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} side={DoubleSide} />
  </mesh>;
}
