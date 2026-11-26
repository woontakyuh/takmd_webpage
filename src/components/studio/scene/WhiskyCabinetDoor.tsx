import { useFrame, useThree } from '@react-three/fiber';
import type { ReactNode, RefObject } from 'react';
import { useLayoutEffect, useState } from 'react';
import { MathUtils } from 'three';
import type { Group, Texture } from 'three';
import { PALETTE } from './config';
import { IsidoroOpeningHalf } from './IsidoroCabinetGeometry';
import { Block, Rod } from './Primitives';
import { useSceneAction as useCabinetAction, type ActionOptions } from './useSceneAction';
import { ISIDORO_DIMENSIONS, ISIDORO_OPEN_ANGLE, ISIDORO_WORKTOP_TOP } from './WhiskyCabinetLayout';

export { useSceneAction as useCabinetAction } from './useSceneAction';

type DoorProps = ActionOptions & {
  readonly open: boolean;
  readonly reducedMotion: boolean;
  readonly wood: Texture;
  readonly children: ReactNode;
  readonly exterior?: ReactNode;
};
// Opening the cabinet: how fast each half settles, how close counts as arrived (a quarter of a degree, invisible),
// and how far the leaf swings before the worktop starts to follow it down.
const ISIDORO_DAMPING = 16;
const ISIDORO_SETTLE = 0.004;
const ISIDORO_WORKTOP_FOLLOW = 0.6;

export function useIsidoroMotion(door: RefObject<Group | null>, worktop: RefObject<Group | null>,
  open: boolean, reducedMotion: boolean, disabled: boolean) {
  const invalidate = useThree(state => state.invalidate);
  const [ready, setReady] = useState(false);
  useLayoutEffect(() => {
    if ((reducedMotion || disabled) && door.current && worktop.current) {
      door.current.rotation.y = open && !disabled ? -ISIDORO_OPEN_ANGLE : 0;
      worktop.current.rotation.x = open && !disabled ? 0 : Math.PI / 2;
    }
    setReady(reducedMotion && open && !disabled);
    invalidate();
  }, [disabled, door, invalidate, open, reducedMotion, worktop]);
  useFrame((state, delta) => {
    if (!door.current || !worktop.current) return;
    const leaf = door.current, top = worktop.current;
    const desiredOpen = open && !disabled;
    const topUp = Math.abs(top.rotation.x - Math.PI / 2) < ISIDORO_SETTLE;
    // The worktop follows the leaf instead of waiting for it to finish: two exponential settles end to end took a
    // second and a half, most of it an invisible tail. It still trails the leaf, so the half still opens like a book.
    const leafOpen = Math.abs(leaf.rotation.y + ISIDORO_OPEN_ANGLE) < ISIDORO_OPEN_ANGLE * (1 - ISIDORO_WORKTOP_FOLLOW);
    const leafTarget = desiredOpen ? -ISIDORO_OPEN_ANGLE : topUp ? 0 : leaf.rotation.y;
    const topTarget = desiredOpen && leafOpen ? 0 : Math.PI / 2;
    let moving = false;
    for (const [group, axis, target] of [[leaf, 'y', leafTarget], [top, 'x', topTarget]] as const) {
      if (group.rotation[axis] !== target) {
        const angle = MathUtils.damp(group.rotation[axis], target, ISIDORO_DAMPING, delta);
        group.rotation[axis] = Math.abs(angle - target) < ISIDORO_SETTLE ? target : angle;
        moving = true;
      }
      group.userData.angle = group.rotation[axis];
    }
    if (moving) state.invalidate();
    const settled = desiredOpen && leaf.rotation.y === -ISIDORO_OPEN_ANGLE && top.rotation.x === 0;
    if (settled !== ready) setReady(settled);
  });
  return ready;
}

export function WhiskyCabinetDoor({ open, wood, pivot, worktop, interior, children, exterior, ...action }: Omit<DoorProps, 'reducedMotion'> & {
  readonly pivot: RefObject<Group | null>;
  readonly worktop: RefObject<Group | null>;
  readonly interior: RefObject<Group | null>;
}) {
  const { hovered, handlers } = useCabinetAction(action);
  const target = open && !action.disabled ? -ISIDORO_OPEN_ANGLE : 0;
  return <group ref={pivot} name="Isidoro book-opening mobile half"
    position={[ISIDORO_DIMENSIONS.width / 2, 0, 0]}
    userData={{ open: open && !action.disabled, angle: target }} {...(!open ? handlers : {})}>
    <group scale={[-1, 1, 1]}><IsidoroOpeningHalf wood={wood} worktop={worktop} interior={interior}>{children}</IsidoroOpeningHalf></group>
    {exterior}
    {open && <group name="Isidoro left outer edge and leather handle close target" {...handlers}>
      <mesh position={[-0.6975, 0.595, -0.1275]}>
        <boxGeometry args={[0.050, 1.12, 0.285]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>
    </group>}
    {[0.23, 0.94].map(y => <Rod key={y} from={[0, y, -0.015]} to={[0, y, 0.015]}
      radius={0.006} color={hovered ? PALETTE.aluminiumEdge : PALETTE.steel} metalness={0.9} />)}
  </group>;
}

export function IsidoroWorktop({ open, wood, disabled, pivot }: {
  readonly open: boolean;
  readonly pivot: RefObject<Group | null>;
  readonly wood: Texture;
  readonly disabled: boolean;
}) {
  const target = open && !disabled ? 0 : Math.PI / 2;
  return <group ref={pivot} name="fold-down Canaletto walnut worktop"
    position={[0, ISIDORO_WORKTOP_TOP - 0.009, 0]} rotation={[Math.PI / 2, 0, 0]}
    userData={{ open: open && !disabled, angle: target }}>
    <Block size={[0.62, 0.018, 0.32]} position={[0, 0, -0.16]}
      color={PALETTE.walnut} texture={wood} radius={0.006} roughness={0.46} />
    <Block size={[0.62, 0.009, 0.018]} position={[0, -0.013, -0.31]}
      color={PALETTE.walnutDark} radius={0.003} roughness={0.52} />
  </group>;
}
