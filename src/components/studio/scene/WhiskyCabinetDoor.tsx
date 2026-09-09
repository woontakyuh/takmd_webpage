import { useCursor } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { MathUtils } from 'three';
import type { Group, Texture } from 'three';
import { PALETTE } from './config';
import { IsidoroOpeningHalf } from './IsidoroCabinetGeometry';
import { Block, Rod } from './Primitives';
import { cancelSceneSingleAction, scheduleSceneSingleAction } from './sceneGesture';
import { ISIDORO_DIMENSIONS, ISIDORO_WORKTOP_HEIGHT } from './WhiskyCabinetLayout';

type ActionOptions = {
  readonly disabled: boolean;
  readonly onActivate: () => void;
  readonly onHoverChange?: (hovered: boolean) => void;
};
type DoorProps = ActionOptions & {
  readonly open: boolean;
  readonly reducedMotion: boolean;
  readonly wood: Texture;
};
type Gesture = { readonly id: number; readonly x: number; readonly y: number };

function modified(event: Pick<MouseEvent, 'shiftKey' | 'ctrlKey' | 'metaKey' | 'altKey'>) {
  return event.shiftKey || event.ctrlKey || event.metaKey || event.altKey;
}

export function useCabinetAction({ disabled, onActivate, onHoverChange }: ActionOptions) {
  const canvas = useThree(state => state.gl.domElement);
  const gesture = useRef<Gesture | null>(null);
  const mounted = useRef(false);
  const enabled = useRef(!disabled);
  const revision = useRef(0);
  const activate = useRef(onActivate);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered && !disabled);
  useLayoutEffect(() => {
    enabled.current = !disabled;
    activate.current = onActivate;
    if (disabled) { revision.current += 1; gesture.current = null; setHovered(false); }
  }, [disabled, onActivate]);
  useEffect(() => { onHoverChange?.(hovered && !disabled); }, [hovered, disabled, onHoverChange]);
  useEffect(() => {
    mounted.current = true;
    const cancel = () => { gesture.current = null; setHovered(false); };
    const track = (event: PointerEvent) => {
      const start = gesture.current;
      if (start && (event.pointerId !== start.id || modified(event)
        || Math.hypot(event.clientX - start.x, event.clientY - start.y) >= 5)) cancel();
    };
    window.addEventListener('pointerdown', track, true);
    window.addEventListener('pointermove', track, true);
    window.addEventListener('pointerup', cancel);
    window.addEventListener('pointercancel', cancel, true);
    window.addEventListener('blur', cancel);
    return () => {
      mounted.current = false;
      window.removeEventListener('pointerdown', track, true);
      window.removeEventListener('pointermove', track, true);
      window.removeEventListener('pointerup', cancel);
      window.removeEventListener('pointercancel', cancel, true);
      window.removeEventListener('blur', cancel);
    };
  }, []);
  const hover = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setHovered(!disabled && event.pointerType !== 'touch' && event.buttons === 0);
  };
  return {
    hovered: hovered && !disabled,
    handlers: {
      onPointerOver: hover,
      onPointerMove: hover,
      onPointerOut: () => setHovered(false),
      onPointerDown: (event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        gesture.current = !disabled && event.button === 0 && event.isPrimary && !modified(event)
          ? { id: event.pointerId, x: event.clientX, y: event.clientY } : null;
      },
      onPointerCancel: () => { gesture.current = null; setHovered(false); },
      onPointerUp: (event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        const start = gesture.current;
        gesture.current = null;
        if (disabled || !start || event.button !== 0 || !event.isPrimary || modified(event)
          || start.id !== event.pointerId || event.delta >= 5
          || Math.hypot(event.clientX - start.x, event.clientY - start.y) >= 5) return;
        const currentRevision = revision.current;
        scheduleSceneSingleAction(canvas, () => {
          if (mounted.current && enabled.current && currentRevision === revision.current) activate.current();
        });
      },
      onClick: (event: ThreeEvent<MouseEvent>) => event.stopPropagation(),
      onDoubleClick: (event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        cancelSceneSingleAction(canvas);
      },
    },
  };
}

function useHingedRotation(ref: React.RefObject<Group | null>, axis: 'x' | 'y', target: number,
  reducedMotion: boolean, disabled: boolean) {
  const invalidate = useThree(state => state.invalidate);
  useLayoutEffect(() => {
    if (ref.current && (disabled || reducedMotion)) ref.current.rotation[axis] = target;
    invalidate();
  }, [axis, disabled, invalidate, reducedMotion, ref, target]);
  useFrame((state, delta) => {
    const group = ref.current;
    if (!group || group.rotation[axis] === target) return;
    const angle = MathUtils.damp(group.rotation[axis], target, 9, delta);
    group.rotation[axis] = Math.abs(angle - target) < 0.0015 ? target : angle;
    group.userData.angle = group.rotation[axis];
    state.invalidate();
  });
}

export function WhiskyCabinetDoor({ open, reducedMotion, wood, ...action }: DoorProps) {
  const pivot = useRef<Group>(null);
  const { hovered, handlers } = useCabinetAction(action);
  const target = open && !action.disabled ? Math.PI : 0;
  useHingedRotation(pivot, 'y', target, reducedMotion, action.disabled);
  return <group ref={pivot} name="Isidoro book-opening mobile half"
    position={[-ISIDORO_DIMENSIONS.width / 2, 0, 0]}
    userData={{ sceneControl: true, open: open && !action.disabled, angle: target }} {...handlers}>
    <IsidoroOpeningHalf wood={wood} />
    {[0.23, 0.94].map(y => <Rod key={y} from={[0, y, -0.015]} to={[0, y, 0.015]}
      radius={0.006} color={hovered ? PALETTE.aluminiumEdge : PALETTE.steel} metalness={0.9} />)}
  </group>;
}

export function IsidoroWorktop({ open, reducedMotion, wood, disabled }: {
  readonly open: boolean;
  readonly reducedMotion: boolean;
  readonly wood: Texture;
  readonly disabled: boolean;
}) {
  const pivot = useRef<Group>(null);
  const target = open && !disabled ? 0 : Math.PI / 2;
  useHingedRotation(pivot, 'x', target, reducedMotion, disabled);
  return <group ref={pivot} name="fold-down Canaletto walnut worktop"
    position={[0, ISIDORO_WORKTOP_HEIGHT + 0.015, 0]} rotation={[Math.PI / 2, 0, 0]}
    userData={{ open: open && !disabled, angle: target }}>
    <Block size={[0.62, 0.018, 0.32]} position={[0, 0, -0.16]}
      color={PALETTE.walnut} texture={wood} radius={0.006} roughness={0.46} />
    <Block size={[0.62, 0.009, 0.018]} position={[0, -0.013, -0.31]}
      color={PALETTE.walnutDark} radius={0.003} roughness={0.52} />
  </group>;
}
