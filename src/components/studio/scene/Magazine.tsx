import { Suspense, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { MathUtils } from 'three';
import type { MagazineSurface } from './MagazinePrint';
import { PALETTE } from './config';
import { MagazineLeaf } from './MagazineLeaf';
import { magazinePacketLayout } from './MagazineGeometry';
import type { MagazineDimensions } from './MagazineGeometry';
import { stepLectureTurn } from './WhiskyLectureMotion';
import { useCabinetAction } from './WhiskyCabinetDoor';

export type MagazineSpread = {
  readonly left?: MagazineSurface;
  readonly right: MagazineSurface;
  readonly label: string;
  readonly leftLeaves?: number;
};

export type MagazineProps = MagazineDimensions & {
  readonly cover: MagazineSurface;
  readonly spreads: readonly MagazineSpread[];
  readonly active: boolean;
  readonly reducedMotion: boolean;
  readonly pageIndex: number;
  readonly onPageChange: (pageIndex: number) => void;
  readonly onSettled?: (pageIndex: number) => void;
  readonly name?: string;
};

export function Magazine({ width, height, thickness, cover, spreads, active,
  reducedMotion, pageIndex, onPageChange, onSettled, name = 'Physical magazine' }: MagazineProps) {
  const selected = MathUtils.clamp(pageIndex, -1, spreads.length - 1);
  const cursor = useRef(selected + 1);
  const showContent = active || selected >= 0 || cursor.current > 0;
  const stationary = useRef(0);
  const invalidate = useThree(state => state.invalidate);
  const dimensions = useMemo(() => ({ width, height, thickness }), [width, height, thickness]);
  const layout = useMemo(() => magazinePacketLayout(dimensions, spreads), [dimensions, spreads]);
  const shapes = useMemo(() => layout.packets.map((packet, index) => ({
    ...packet, width: index === 0 ? width : width - .001,
    height: index === 0 ? height : height - .001,
  })), [layout, width, height]);
  const remaining = useMemo(() => ({
    width: width - .001, height: height - .001, depth: layout.remainingDepth,
    startZ: layout.baseZ + layout.remainingDepth / 2,
    endZ: layout.baseZ + layout.remainingDepth / 2,
  }), [width, height, layout]);
  const previous = useCabinetAction({ disabled: !active || selected < 0,
    onActivate: () => onPageChange(Math.max(-1, selected - 1)) });
  const next = useCabinetAction({ disabled: !active || selected >= spreads.length - 1,
    onActivate: () => onPageChange(Math.min(spreads.length - 1, selected + 1)) });
  useLayoutEffect(() => {
    if (reducedMotion) cursor.current = selected + 1;
    invalidate();
  }, [selected, reducedMotion, invalidate]);
  useFrame((_, delta) => {
    const target = selected + 1;
    if (cursor.current === target) onSettled?.(selected);
    if (cursor.current === target) return;
    cursor.current = stepLectureTurn(cursor.current, target, delta, reducedMotion);
    invalidate();
  });
  return <group name={name}>
    <mesh name="Magazine bound spine" position={[0, 0, 0]} castShadow receiveShadow>
      <boxGeometry args={[.0014, height, thickness]} />
      <meshStandardMaterial color={PALETTE.paper} roughness={.84} />
    </mesh>
    <Suspense fallback={null}>
      <MagazineLeaf name="Magazine back softcover" shape={{ width, height, depth: layout.coverThickness,
        startZ: -thickness / 2 + layout.coverThickness / 2, endZ: -thickness / 2 + layout.coverThickness / 2 }}
        cursor={stationary} openingCursor={cursor} leafIndex={0} cover />
      <MagazineLeaf name="Magazine remaining right paper stack" shape={remaining}
        front={showContent ? spreads.at(-1)?.right : undefined} cursor={stationary} openingCursor={cursor} leafIndex={0}
        reading={active || cursor.current > 0} handlers={active ? next.handlers : undefined} />
      {shapes.map((shape, index) => <MagazineLeaf key={index} shape={shape} cursor={cursor} leafIndex={index}
        name={index === 0 ? 'Magazine flexible front cover' : `Magazine page packet ${index}`}
        front={index === 0 ? cover : showContent ? spreads[index - 1]?.right : undefined}
        back={showContent ? spreads[index]?.left : undefined}
        reading={active || cursor.current > 0} cover={index === 0}
        handlers={active ? index < selected + 1 ? previous.handlers : next.handlers : undefined} />)}
    </Suspense>
  </group>;
}
