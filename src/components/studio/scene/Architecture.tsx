import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import type { BlindLift } from '../types';
import type { Group } from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { INTERIOR, ROOM } from './config';
import type { Point } from './config';
import { Block } from './Primitives';
import { WindowBay } from './WindowBay';
import { MicrocementFloor } from './MicrocementFloor';
import { createMineralSurface } from './mineralSurface';

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

type ArchitectureProps = {
  readonly night: boolean;
  readonly sky: readonly [string, string];
  readonly blindLift: BlindLift;
  readonly reducedMotion: boolean;
};

export function Architecture({ night, sky, blindLift, reducedMotion }: ArchitectureProps) {
  const plaster = useMemo(() => createMineralSurface('plaster'), []);
  useEffect(() => () => Object.values(plaster).forEach(texture => texture.dispose()), [plaster]);
  return (
    <group>
      {SHADOW_ENCLOSURE.map((surface, index) => <mesh key={index} position={[...surface.position]} castShadow raycast={() => undefined}>
        <boxGeometry args={[...surface.size]} />
        <meshBasicMaterial colorWrite={false} depthWrite={false} />
      </mesh>)}
      <MicrocementFloor />
      <CutawayWall axis="z" boundary={farZ - 0.08} direction={-1}>
        <PlasterWall {...FAR_WALL} axis="z" surface={plaster} />
        <Block size={[width, 0.075, 0.22]} position={[0, height - 0.035, farZ - 0.06]}
          color={INTERIOR.ivory} radius={0.004} />
        <Block size={[width, 0.05, 0.13]} position={[0, height - 0.097, farZ - 0.03]}
          color={INTERIOR.plaster} radius={0.004} />
      </CutawayWall>
      <CutawayWall axis="x" boundary={leftX + 0.08}>
        {LEFT_WALLS.map((wall, index) => <PlasterWall key={index} {...wall} axis="x" surface={plaster} />)}
        <Block size={[0.22, 0.075, depth]} position={[leftX + 0.05, height - 0.035, 0]} color={INTERIOR.ivory} radius={0.004} />
        <Block size={[0.13, 0.05, depth]} position={[leftX + 0.03, height - 0.097, 0]} color={INTERIOR.plaster} radius={0.004} />
        <WindowBay night={night} sky={sky} blindLift={blindLift} reducedMotion={reducedMotion} />
      </CutawayWall>
    </group>
  );
}

function PlasterWall({ size, position, axis, surface }: {
  readonly size: Point;
  readonly position: Point;
  readonly axis: 'x' | 'z';
  readonly surface: ReturnType<typeof createMineralSurface>;
}) {
  const geometry = useMemo(() => {
    const wall = new RoundedBoxGeometry(...size, 3, 0.012);
    const vertices = wall.getAttribute('position');
    const uv = wall.getAttribute('uv');
    const span = axis === 'x' ? depth : width;
    for (let index = 0; index < vertices.count; index += 1) {
      const horizontal = axis === 'x' ? vertices.getZ(index) + position[2] : vertices.getX(index) + position[0];
      uv.setXY(index, horizontal / span + 0.5, (vertices.getY(index) + position[1]) / height);
    }
    return wall;
  }, [size, position, axis]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh name="Warm continuous plaster wall" geometry={geometry} position={[...position]} castShadow receiveShadow>
    <meshStandardMaterial {...surface} color={INTERIOR.ivory} roughness={0.96} bumpScale={0.0012} />
  </mesh>;
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
