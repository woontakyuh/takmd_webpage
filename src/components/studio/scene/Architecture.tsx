import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { ReactNode } from 'react';
import type { Group } from 'three';
import { INTERIOR, PALETTE, ROOM } from './config';
import { Block } from './Primitives';
import { useInteriorMaterial } from './InteriorMaterials';
import { WindowBay } from './WindowBay';
import { MicrocementFloor } from './MicrocementFloor';

const { height, farZ, leftX, window: windowBay } = ROOM.architecture;
const [width, , depth] = ROOM.platform.size;
const windowStart = windowBay.centerZ - windowBay.width / 2;
const windowEnd = windowBay.centerZ + windowBay.width / 2;
const FAR_WALL = { size: [width, height, 0.08], position: [0, height / 2, farZ] } as const;
const LEFT_WALLS = [
  { size: [0.08, height, windowStart + depth / 2], position: [leftX, height / 2, (windowStart - depth / 2) / 2] },
  { size: [0.08, height, depth / 2 - windowEnd], position: [leftX, height / 2, (windowEnd + depth / 2) / 2] },
  { size: [0.08, windowBay.bottom, windowBay.width], position: [leftX, windowBay.bottom / 2, windowBay.centerZ] },
  { size: [0.08, height - windowBay.top, windowBay.width], position: [leftX, (height + windowBay.top) / 2, windowBay.centerZ] },
] as const;
const SHADOW_ENCLOSURE: readonly { readonly size: readonly [number, number, number]; readonly position: readonly [number, number, number] }[] = [
  FAR_WALL, ...LEFT_WALLS,
  { size: [width + 0.1, 0.08, depth + 0.1], position: [0, height + 0.06, 0] },
  { size: [0.08, height + 0.1, depth + 0.1], position: [width / 2 + 0.04, height / 2, 0] },
  { size: [width + 0.1, height + 0.1, 0.08], position: [0, height / 2, -depth / 2 - 0.04] },
];

export function Architecture({ night, sky }: { readonly night: boolean; readonly sky: readonly [string, string] }) {
  const oak = useInteriorMaterial('oak');
  return (
    <group>
      {SHADOW_ENCLOSURE.map((surface, index) => <mesh key={index} position={[...surface.position]} castShadow>
        <boxGeometry args={[...surface.size]} />
        <meshBasicMaterial colorWrite={false} depthWrite={false} />
      </mesh>)}
      <MicrocementFloor />
      <CutawayWall axis="z" boundary={farZ - 0.08} direction={-1}>
        <Block {...FAR_WALL} color={INTERIOR.ivory} radius={0.012} roughness={0.96} />
        <Block size={[width, 0.13, 0.12]} position={[0, 0.075, farZ - 0.05]}
          color={INTERIOR.plaster} radius={0.005} />
        {[-1.18, 1.18].map(x => <Block key={x} size={[0.022, 2.12, 0.027]}
          position={[x, 1.65, farZ - 0.064]} color={INTERIOR.plaster} radius={0.003} />)}
        {[0.59, 2.71].map(y => <Block key={y} size={[2.38, 0.022, 0.027]}
          position={[0, y, farZ - 0.064]} color={INTERIOR.plaster} radius={0.003} />)}
        <Block size={[width, 0.075, 0.22]} position={[0, height - 0.035, farZ - 0.06]}
          color={INTERIOR.ivory} radius={0.004} />
        <Block size={[width, 0.05, 0.13]} position={[0, height - 0.097, farZ - 0.03]}
          color={INTERIOR.plaster} radius={0.004} />
        <mesh position={[0, height - 0.13, farZ - 0.073]}>
          <boxGeometry args={[width - 0.18, 0.012, 0.025]} />
          <meshStandardMaterial color={PALETTE.sun} emissive={PALETTE.sun} emissiveIntensity={night ? 1.8 : 0.35} />
        </mesh>
      </CutawayWall>
      <CutawayWall axis="x" boundary={leftX + 0.08}>
        {LEFT_WALLS.map((wall, index) => <Block key={index} {...wall}
          color={INTERIOR.ivory} radius={0.012} roughness={0.96} />)}
        <Block size={[0.12, 0.13, depth]} position={[leftX + 0.04, 0.075, 0]} color={INTERIOR.plaster} radius={0.005} />
        <Block size={[0.22, 0.075, depth]} position={[leftX + 0.05, height - 0.035, 0]} color={INTERIOR.ivory} radius={0.004} />
        <Block size={[0.13, 0.05, depth]} position={[leftX + 0.03, height - 0.097, 0]} color={INTERIOR.plaster} radius={0.004} />
        <Block size={[0.035, 2.52, 1.54]} position={[leftX + 0.063, 1.32, ROOM.wardrobe.position[2]]}
          color="#ffffff" material={oak} roughness={0.84} radius={0.008} />
        <Block size={[0.43, 0.035, 1.56]} position={[leftX + 0.245, 2.15, ROOM.wardrobe.position[2]]}
          color="#ffffff" material={oak} roughness={0.8} radius={0.008} />
        <WindowBay night={night} sky={sky} />
      </CutawayWall>
    </group>
  );
}

function CutawayWall({ axis, boundary, direction = 1, children }: {
  readonly axis: 'x' | 'z';
  readonly boundary: number;
  readonly direction?: 1 | -1;
  readonly children: ReactNode;
}) {
  const wall = useRef<Group>(null);
  useFrame(({ camera }) => {
    if (wall.current) wall.current.visible = (camera.position[axis] - boundary) * direction > 0;
  });
  return <group ref={wall}>{children}</group>;
}
