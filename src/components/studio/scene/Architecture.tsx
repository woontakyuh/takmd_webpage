import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { ReactNode } from 'react';
import type { Group } from 'three';
import { PALETTE, ROOM } from './config';
import { Block } from './Primitives';
import { usePrintedTexture } from './Textures';
import { WindowSky } from './WindowSky';

const WALL_HEIGHT = 2.7;
const FAR_Z = 1.96;
const LEFT_X = -2.36;
const FAR_WALL = { size: [4.8, WALL_HEIGHT, 0.08], position: [0, WALL_HEIGHT / 2, FAR_Z] } as const;
const LEFT_WALLS = [
  { size: [0.08, WALL_HEIGHT, 0.55], position: [LEFT_X, WALL_HEIGHT / 2, -1.68] },
  { size: [0.08, WALL_HEIGHT, 0.66], position: [LEFT_X, WALL_HEIGHT / 2, 0.92] },
  { size: [0.08, 0.65, 2.05], position: [LEFT_X, 0.325, -0.35] },
  { size: [0.08, 0.43, 2.05], position: [LEFT_X, 2.485, -0.35] },
  { size: [0.08, WALL_HEIGHT, 0.74], position: [LEFT_X, WALL_HEIGHT / 2, 1.6] },
] as const;
const SHADOW_ENCLOSURE: readonly { readonly size: readonly [number, number, number]; readonly position: readonly [number, number, number] }[] = [
  FAR_WALL, ...LEFT_WALLS,
  { size: [4.9, 0.08, 4.1], position: [0, 2.76, 0] },
  { size: [0.08, 2.8, 4.1], position: [2.44, 1.4, 0] },
  { size: [4.9, 2.8, 0.08], position: [0, 1.4, -2.04] },
];

export function Architecture({ night, sky }: { readonly night: boolean; readonly sky: readonly [string, string] }) {
  const plaster = usePrintedTexture('stone');
  return (
    <group>
      {SHADOW_ENCLOSURE.map((surface, index) => <mesh key={index} position={[...surface.position]} castShadow>
        <boxGeometry args={[...surface.size]} />
        <meshBasicMaterial colorWrite={false} depthWrite={false} />
      </mesh>)}
      <Block {...ROOM.platform} color={PALETTE.stone} texture={plaster} roughness={0.96} />
      <Block size={[4.76, 0.025, 3.96]} position={[0, 0.006, 0]} radius={0.008}
        color={PALETTE.paper} texture={plaster} roughness={0.92} />
      <CutawayWall axis="z" boundary={FAR_Z - 0.08} direction={-1}>
        <Block {...FAR_WALL} color={night ? PALETTE.nightSurface : PALETTE.plaster}
          texture={plaster} radius={0.012} roughness={0.96} />
        <Block size={[4.55, 0.11, 0.12]} position={[0.05, 0.07, 1.88]}
          color={PALETTE.walnutDark} radius={0.008} roughness={0.75} />
      </CutawayWall>
      <CutawayWall axis="x" boundary={LEFT_X + 0.08}>
        <WindowSky colors={sky} />
        {LEFT_WALLS.map((wall, index) => <Block key={index} {...wall}
          color={night ? PALETTE.nightSurface : PALETTE.plaster} texture={plaster} radius={0.012} roughness={0.96} />)}
        <mesh position={[-2.405, 1.45, -0.35]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
          <planeGeometry args={[2, 1.55]} />
          <meshPhysicalMaterial color={night ? PALETTE.teal : PALETTE.paperLight} transparent opacity={night ? 0.3 : 0.2}
            roughness={0.18} metalness={0.03} transmission={0.35} depthWrite={false} />
        </mesh>
        <Block size={[0.055, 1.62, 0.035]} position={[-2.42, 1.45, -0.35]}
          color={PALETTE.steel} radius={0.006} metalness={0.7} />
        {[-1.34, 0.62].map((z) => (
          <Block key={z} size={[0.055, 1.62, 0.035]} position={[-2.42, 1.45, z]}
            color={PALETTE.steel} radius={0.006} metalness={0.7} />
        ))}
        <Block size={[0.055, 0.035, 2]} position={[-2.42, 1.45, -0.35]}
          color={PALETTE.steel} radius={0.006} metalness={0.7} />
        <Block size={[0.22, 0.055, 2.12]} position={[-2.32, 0.66, -0.35]}
          color={PALETTE.stone} radius={0.01} roughness={0.86} />
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
