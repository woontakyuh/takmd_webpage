import { useEffect, useMemo } from 'react';
import { ExtrudeGeometry, Path, Shape } from 'three';
import { useInteriorMaterial } from './InteriorMaterials';
import { Rod } from './Primitives';
import { INTERIOR } from './config';

export const RACK_RAIL_HALF_HEIGHT = 0.015;

export const EPOCH_HANGER_POSITIONS = {
  coat: [0.368, 1.777, -0.075],
  gi: [-0.368, 1.774, -0.081],
} as const;

const WIDTH = 1.18;
const HEIGHT = 0.08;
const DEPTH = 0.204;
const CENTRE_Y = 1.78;
const FRONT_RADIUS = 0.096;
const WALL = 0.016;
const HPL_THICKNESS = 0.006;
const FOG = '#D4D5CF';
const PEG_X = [-0.46, -0.368, -0.276, -0.184, -0.092, 0, 0.092, 0.184, 0.276, 0.368, 0.46] as const;

export const EPOCH_SHELF_TOP = CENTRE_Y + 0.02;

function roundedFrontShape(width: number, depth: number, radius: number) {
  const halfWidth = width / 2;
  const rear = -depth / 2;
  const front = depth / 2;
  const corner = Math.min(radius, halfWidth, depth / 2);
  const shape = new Shape();
  shape.moveTo(-halfWidth, rear);
  shape.lineTo(halfWidth, rear);
  shape.lineTo(halfWidth, front - corner);
  shape.quadraticCurveTo(halfWidth, front, halfWidth - corner, front);
  shape.lineTo(-halfWidth + corner, front);
  shape.quadraticCurveTo(-halfWidth, front, -halfWidth, front - corner);
  shape.lineTo(-halfWidth, rear);
  shape.closePath();
  return shape;
}

function roundedFrontHole(width: number, depth: number, radius: number) {
  const halfWidth = width / 2;
  const rear = -depth / 2;
  const front = depth / 2;
  const corner = Math.min(radius, halfWidth, depth / 2);
  const path = new Path();
  path.moveTo(-halfWidth, rear);
  path.lineTo(-halfWidth, front - corner);
  path.quadraticCurveTo(-halfWidth, front, -halfWidth + corner, front);
  path.lineTo(halfWidth - corner, front);
  path.quadraticCurveTo(halfWidth, front, halfWidth, front - corner);
  path.lineTo(halfWidth, rear);
  path.closePath();
  return path;
}

function createShellGeometry() {
  const shell = roundedFrontShape(WIDTH, DEPTH, FRONT_RADIUS);
  shell.holes.push(roundedFrontHole(WIDTH - 2 * WALL, DEPTH - 2 * WALL, FRONT_RADIUS - WALL));
  return new ExtrudeGeometry(shell, { depth: HEIGHT, bevelEnabled: false, curveSegments: 16 });
}

function createTopGeometry() {
  const top = roundedFrontShape(WIDTH - 2 * WALL, DEPTH - 2 * WALL, FRONT_RADIUS - WALL);
  return new ExtrudeGeometry(top, { depth: HPL_THICKNESS, bevelEnabled: false, curveSegments: 16 });
}

export function GarmentRack() {
  const oak = useInteriorMaterial('oak', [3, 1]);
  const geometry = useMemo(() => ({ shell: createShellGeometry(), top: createTopGeometry() }), []);
  useEffect(() => () => {
    geometry.shell.dispose();
    geometry.top.dispose();
  }, [geometry]);
  return <group name="Audo Copenhagen Epoch Shelf with Rack 118 Natural Oak Fog">
    <mesh name="Steam-bent oak veneer continuous rounded-front shell" geometry={geometry.shell}
      position={[0, CENTRE_Y - HEIGHT / 2, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
      <meshPhysicalMaterial {...oak} color={INTERIOR.oakLight} roughness={0.46} clearcoat={0.06} clearcoatRoughness={0.6} />
    </mesh>
    <mesh name="Fog HPL recessed top ledge" geometry={geometry.top}
      position={[0, EPOCH_SHELF_TOP - HPL_THICKNESS, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
      <meshPhysicalMaterial color={FOG} roughness={0.3} clearcoat={0.08} clearcoatRoughness={0.3} />
    </mesh>
    <group name="Eleven concealed natural-oak garment pegs">
      {PEG_X.map(x => <Rod key={x} from={[x, 1.77, -0.085]} to={[x, 1.77, -0.035]}
        radius={0.011} endRadius={0.013} color={INTERIOR.oak} />)}
    </group>
  </group>;
}
