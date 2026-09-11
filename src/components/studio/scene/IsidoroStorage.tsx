import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { DoubleSide, ExtrudeGeometry, Shape, ShapeGeometry } from 'three';
import type { Group, Texture } from 'three';
import { PALETTE } from './config';
import { Block } from './Primitives';
import { ISIDORO_STORAGE_TOP } from './WhiskyCabinetLayout';

export const ISIDORO_TRAY_RECESS = {
  lipHeight: 0.038,
  lipCenterY: 0.381,
  deckTop: 0.400,
  trayBaseY: 0.413,
  trayStep: 0.013,
} as const;

export const ignoreIsidoroWindowRaycast = () => undefined;

function windowPath(outset = 0) {
  const shape = new Shape();
  const x = 0.045 - outset, y = 0.13 - outset;
  const width = 0.225 + outset * 2, height = 0.105 + outset * 2, radius = 0.011 + outset;
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

export function createIsidoroWindowDoorGeometry() {
  const shape = new Shape();
  shape.moveTo(0, 0); shape.lineTo(0.316, 0); shape.lineTo(0.316, 0.405);
  shape.lineTo(0, 0.405); shape.closePath();
  shape.holes.push(windowPath());
  const geometry = new ExtrudeGeometry(shape, { depth: 0.012, bevelEnabled: true,
    bevelSegments: 2, steps: 1, bevelSize: 0.0012, bevelThickness: 0.0012, curveSegments: 8 });
  geometry.translate(0, 0, -0.006);
  return geometry;
}

export function createIsidoroWindowRevealGeometry() {
  const shape = windowPath(0.0025);
  shape.holes.push(windowPath(-0.0008));
  const geometry = new ExtrudeGeometry(shape, { depth: 0.015, bevelEnabled: false, curveSegments: 8 });
  geometry.translate(0, 0, -0.0095);
  return geometry;
}

function createWindowGasketGeometry() {
  const shape = windowPath(-0.0006);
  shape.holes.push(windowPath(-0.0025));
  const geometry = new ExtrudeGeometry(shape, { depth: 0.001, bevelEnabled: false, curveSegments: 8 });
  geometry.translate(0, 0, -0.0098);
  return geometry;
}

export function createIsidoroWindowGlassGeometry() {
  const geometry = new ShapeGeometry(windowPath(-0.0023), 8);
  geometry.translate(0, 0, -0.01);
  return geometry;
}

function WindowDoor({ side, wood, worktop }: {
  readonly side: -1 | 1;
  readonly wood: Texture;
  readonly worktop: RefObject<Group | null>;
}) {
  const pivot = useRef<Group>(null);
  const geometry = useMemo(() => ({ door: createIsidoroWindowDoorGeometry(), reveal: createIsidoroWindowRevealGeometry(),
    gasket: createWindowGasketGeometry(), glass: createIsidoroWindowGlassGeometry() }), []);
  useEffect(() => () => Object.values(geometry).forEach(part => part.dispose()), [geometry]);
  useFrame(() => {
    if (pivot.current && worktop.current) {
      const exposed = 1 - worktop.current.rotation.x / (Math.PI / 2);
      pivot.current.rotation.y = side * exposed * Math.PI / 2;
    }
  });
  return <group ref={pivot} name={`${side < 0 ? 'left' : 'right'} automatic lower window door`}
    position={[side * 0.319, 0.07, 0.112]}>
    <group scale={[-side, 1, 1]}>
      <mesh name="Canaletto walnut door with real rounded window aperture" geometry={geometry.door} castShadow receiveShadow>
        <meshStandardMaterial color={PALETTE.walnut} map={wood} roughness={0.48} />
      </mesh>
      <mesh name="slim walnut window reveal" geometry={geometry.reveal} castShadow receiveShadow>
        <meshStandardMaterial color={PALETTE.walnutDark} map={wood} roughness={0.54} />
      </mesh>
      <mesh name="recessed glass retaining gasket" geometry={geometry.gasket}>
        <meshStandardMaterial color="#443B30" roughness={0.8} />
      </mesh>
      <mesh name="clear inset lower storage window" geometry={geometry.glass} raycast={ignoreIsidoroWindowRaycast}>
        <meshPhysicalMaterial color="#e7e9df" transparent opacity={0.2} roughness={0.08}
          metalness={0.03} envMapIntensity={1.25} side={DoubleSide} depthWrite={false} />
      </mesh>
    </group>
    {[0.09, 0.325].map(y => <Block key={y} size={[0.006, 0.034, 0.015]}
      position={[0, y, -0.003]} color={PALETTE.aluminiumEdge} metalness={0.95} roughness={0.16} radius={0.002} />)}
  </group>;
}

export function IsidoroLowerBottleStorage({ wood, worktop }: {
  readonly wood: Texture;
  readonly worktop: RefObject<Group | null>;
}) {
  return <group name="automatic accessible lower bottle cupboard">
    <Block size={[0.64, 0.012, 0.22]} position={[0, ISIDORO_STORAGE_TOP - 0.006, 0]}
      color={PALETTE.walnut} texture={wood} radius={0.0025} roughness={0.5} />
    <WindowDoor side={-1} wood={wood} worktop={worktop} />
    <WindowDoor side={1} wood={wood} worktop={worktop} />
  </group>;
}

export function IsidoroDrawerStorage({ wood }: { readonly wood: Texture }) {
  const drawer = useMemo(() => {
    const shape = new Shape();
    shape.moveTo(-0.32, 0.07); shape.lineTo(0.32, 0.07); shape.lineTo(0.32, 0.373);
    shape.lineTo(0.065, 0.373); shape.quadraticCurveTo(0.045, 0.344, 0.032, 0.344);
    shape.lineTo(-0.032, 0.344); shape.quadraticCurveTo(-0.045, 0.344, -0.065, 0.373);
    shape.lineTo(-0.32, 0.373); shape.closePath();
    return new ExtrudeGeometry(shape, { depth: 0.014, bevelEnabled: false });
  }, []);
  useEffect(() => () => drawer.dispose(), [drawer]);
  return <group name="right lower drawer and recessed open tray storage">
    <mesh name="lower walnut drawer with centered carved finger notch" geometry={drawer}
      position={[0, 0, -0.117]} castShadow receiveShadow>
      <meshStandardMaterial map={wood} color={PALETTE.walnut} roughness={0.49} />
    </mesh>
    <Block size={[0.638, ISIDORO_TRAY_RECESS.lipHeight, 0.012]} position={[0, ISIDORO_TRAY_RECESS.lipCenterY, -0.105]}
      color={PALETTE.walnut} texture={wood} radius={0.002} roughness={0.48} />
    <Block size={[0.635, 0.012, 0.215]} position={[0, ISIDORO_TRAY_RECESS.deckTop - 0.006, 0]}
      color={PALETTE.walnutDark} texture={wood} radius={0.002} roughness={0.5} />
    {[-1, 1].map(side => <Block key={side} size={[0.008, 0.09, 0.208]}
      position={[side * 0.311, ISIDORO_TRAY_RECESS.deckTop + 0.045, 0.002]}
      color={PALETTE.walnutDark} texture={wood} radius={0.0015} roughness={0.52} />)}
    {[0, 1, 2].map(index => <group key={index} name="nested serving tray"
      position={[0, ISIDORO_TRAY_RECESS.trayBaseY + index * ISIDORO_TRAY_RECESS.trayStep, 0.008]}>
      <Block size={[0.48 - index * 0.024, 0.008, 0.17 - index * 0.016]}
        color={PALETTE.walnutDark} texture={wood} radius={0.015} roughness={0.48} />
      {[-1, 1].map(side => <Block key={side} size={[0.47 - index * 0.024, 0.016, 0.006]}
        position={[0, 0.01, side * (0.081 - index * 0.008)]} color={PALETTE.walnut}
        texture={wood} radius={0.002} roughness={0.5} />)}
    </group>)}
  </group>;
}
