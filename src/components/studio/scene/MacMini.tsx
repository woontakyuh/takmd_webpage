import { DoubleSide, Shape } from 'three';
import { useMemo } from 'react';
import { Cable } from './Cable';
import type { Point } from './config';
import { PALETTE } from './config';

export const M4_MAC_MINI = {
  size: [0.127, 0.05, 0.127],
  front: 0.0635,
} as const;

const PLAN_RADIUS = 0.0105;
const ENCLOSURE_BASE = 0.004;
const ENCLOSURE_BODY_HEIGHT = 0.045;
const ENCLOSURE_BEVEL = 0.00075;
const TOP_INSET_HEIGHT = 0.001;
const TOP_INSET = 0.001;

const APPLE_MARK_BODY = new Shape()
  .moveTo(0, -0.0048)
  .bezierCurveTo(-0.0038, -0.0048, -0.0051, -0.0023, -0.0046, 0.0004)
  .bezierCurveTo(-0.0042, 0.0033, -0.0021, 0.0052, 0, 0.0052)
  .bezierCurveTo(0.0025, 0.0052, 0.0042, 0.0034, 0.0043, 0.0018)
  .bezierCurveTo(0.0044, 0.001, 0.0036, 0.0008, 0.0032, 0.0007)
  .bezierCurveTo(0.0051, -0.0001, 0.0049, -0.0021, 0.0032, -0.0022)
  .bezierCurveTo(0.0039, -0.0029, 0.003, -0.0048, 0, -0.0048);

const APPLE_MARK_LEAF = new Shape()
  .moveTo(0, 0)
  .bezierCurveTo(0.0026, -0.0002, 0.0042, -0.0021, 0.0043, -0.004)
  .bezierCurveTo(0.0017, -0.0038, 0.0002, -0.0019, 0, 0);

type MacMiniProps = {
  readonly position: Point;
};

export function MacMini({ position }: MacMiniProps) {
  return (
    <group position={[...position]}>
      <MacMiniEnclosure />
      <MacMiniBase />
      <FrontPorts />
      <RearPorts />
      <Cable points={[
        [-0.044, 0.024, -0.064], [-0.044, 0.024, -0.16], [-0.044, 0.014, -0.25], [-0.045, 0.004, -0.282], [-0.045, -0.63, -0.282],
      ]} radius={0.0034} />
    </group>
  );
}

function MacMiniEnclosure() {
  const topSize = M4_MAC_MINI.size[0] - TOP_INSET * 2;
  const enclosureShape = useMemo(() => roundedSquare(
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
      <meshPhysicalMaterial color={PALETTE.aluminium} roughness={0.39} metalness={0.78} clearcoat={0.06} clearcoatRoughness={0.58} />
    </mesh>
    <HorizontalPlate size={[topSize, TOP_INSET_HEIGHT, topSize]} position={[0, ENCLOSURE_BASE + ENCLOSURE_BODY_HEIGHT, 0]}
      color={PALETTE.aluminiumEdge} radius={PLAN_RADIUS - TOP_INSET} roughness={0.34} metalness={0.75} />
    <AppleMark />
  </group>;
}

function MacMiniBase() {
  return <group>
    <HorizontalPlate size={[0.123, 0.00145, 0.123]} position={[0, ENCLOSURE_BASE, 0]}
      color={PALETTE.rubber} radius={0.010} roughness={0.88} metalness={0.03} />
    <mesh position={[0, 0.002, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.052, 0.0545, 0.004, 48]} />
      <meshStandardMaterial color={PALETTE.graphite} roughness={0.83} metalness={0.08} />
    </mesh>
    {Array.from({ length: 18 }, (_, index) => {
      const angle = index / 18 * Math.PI * 2;
      return <HorizontalPlate key={index} size={[0.0075, 0.00085, 0.0017]} position={[Math.cos(angle) * 0.039, 0.00425, Math.sin(angle) * 0.039]}
        rotation={[0, -angle, 0]} color={PALETTE.rubber} radius={0.0003} roughness={0.9} metalness={0.03} />;
    })}
  </group>;
}

function AppleMark() {
  return <group position={[0, 0.05004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
    <mesh rotation={[0, 0, Math.PI]}>
      <shapeGeometry args={[APPLE_MARK_BODY]} />
      <meshStandardMaterial color={PALETTE.graphite} roughness={0.48} metalness={0.22} />
    </mesh>
    <mesh position={[0.0014, 0.0067, 0]} rotation={[0, 0, Math.PI * 0.24]}>
      <shapeGeometry args={[APPLE_MARK_LEAF]} />
      <meshStandardMaterial color={PALETTE.graphite} roughness={0.48} metalness={0.22} />
    </mesh>
  </group>;
}

function FrontPorts() {
  const front = M4_MAC_MINI.front;
  return <group>
    {[-0.017, -0.0015].map(x => <PortRecess key={x} size={[0.0105, 0.0036, 0.0016]} position={[x, 0.024, front]}
      color={PALETTE.graphite} radius={0.0009} roughness={0.56} metalness={0.24} />)}
    <mesh position={[0.0175, 0.024, front]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.00215, 0.00215, 0.0018, 16]} />
      <meshStandardMaterial color={PALETTE.graphite} roughness={0.62} metalness={0.16} />
    </mesh>
    <mesh position={[0.047, 0.0175, front]}>
      <sphereGeometry args={[0.00125, 10, 8]} />
      <meshBasicMaterial color={PALETTE.tealLight} />
    </mesh>
  </group>;
}

function RearPorts() {
  const rear = -M4_MAC_MINI.front;
  return <group>
    <PortRecess size={[0.015, 0.018, 0.0018]} position={[-0.044, 0.024, rear]} color={PALETTE.graphite} radius={0.0012} roughness={0.67} metalness={0.16} />
    <PortRecess size={[0.0155, 0.0115, 0.0018]} position={[-0.023, 0.024, rear]} color={PALETTE.graphite} radius={0.0008} roughness={0.67} metalness={0.16} />
    {[-0.027, -0.023, -0.019].map(x => <PortRecess key={x} size={[0.0008, 0.004, 0.0009]} position={[x, 0.027, rear - 0.0007]}
      color={PALETTE.aluminiumEdge} radius={0.0001} roughness={0.45} metalness={0.72} />)}
    <PortRecess size={[0.0175, 0.0068, 0.0018]} position={[-0.0005, 0.024, rear]} color={PALETTE.graphite} radius={0.00065} roughness={0.62} metalness={0.15} />
    {[0.022, 0.0375, 0.053].map(x => <PortRecess key={x} size={[0.0105, 0.0037, 0.0018]} position={[x, 0.024, rear]}
      color={PALETTE.graphite} radius={0.00085} roughness={0.56} metalness={0.24} />)}
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

function HorizontalPlate({ size, position, color, radius, roughness, metalness, rotation = [0, 0, 0] }: PlateProps) {
  const shape = useMemo(() => roundedSquare(size[0], size[2], radius), [size[0], size[2], radius]);
  return <group position={[position[0], position[1], position[2]]} rotation={[rotation[0], rotation[1], rotation[2]]}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
      <extrudeGeometry args={[shape, {
        depth: size[1],
        bevelEnabled: false,
        curveSegments: 12,
      }]} />
      <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} side={DoubleSide} />
    </mesh>
  </group>;
}

function PortRecess({ size, position, color, radius, roughness, metalness }: PlateProps) {
  const shape = useMemo(() => roundedSquare(size[0], size[1], radius), [size[0], size[1], radius]);
  return <mesh position={[position[0], position[1], position[2] - size[2] / 2]} castShadow receiveShadow>
    <extrudeGeometry args={[shape, {
      depth: size[2],
      bevelEnabled: false,
      curveSegments: 12,
    }]} />
    <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} side={DoubleSide} />
  </mesh>;
}

function roundedSquare(width: number, depth: number, radius: number) {
  const halfWidth = width / 2;
  const halfDepth = depth / 2;
  const corner = Math.min(radius, halfWidth, halfDepth);
  return new Shape()
    .moveTo(-halfWidth + corner, -halfDepth)
    .lineTo(halfWidth - corner, -halfDepth)
    .quadraticCurveTo(halfWidth, -halfDepth, halfWidth, -halfDepth + corner)
    .lineTo(halfWidth, halfDepth - corner)
    .quadraticCurveTo(halfWidth, halfDepth, halfWidth - corner, halfDepth)
    .lineTo(-halfWidth + corner, halfDepth)
    .quadraticCurveTo(-halfWidth, halfDepth, -halfWidth, halfDepth - corner)
    .lineTo(-halfWidth, -halfDepth + corner)
    .quadraticCurveTo(-halfWidth, -halfDepth, -halfWidth + corner, -halfDepth);
}
