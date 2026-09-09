import { useCursor } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { DoubleSide, MathUtils } from 'three';
import type { Group } from 'three';
import { LIGHTING, PALETTE } from './config';
import { Block, Rod } from './Primitives';
import { cancelSceneSingleAction, scheduleSceneSingleAction } from './sceneGesture';
import { WHISKY_CABINET } from './WhiskyCabinetLayout';

const DOOR = { width: WHISKY_CABINET.width / 2 - .026, height: 1.57, centerY: 1.305,
  hingeX: WHISKY_CABINET.width / 2 - .023, frontZ: -.221, frame: .014, damping: 14 } as const;
type ActionOptions = {
  readonly disabled: boolean;
  readonly onActivate: () => void;
  readonly onHoverChange?: (hovered: boolean) => void;
};
type DoorProps = ActionOptions & {
  readonly side: -1 | 1;
  readonly open: boolean;
  readonly reducedMotion: boolean;
};
type Gesture = { readonly id: number; readonly x: number; readonly y: number };

function modified(event: Pick<MouseEvent, 'shiftKey' | 'ctrlKey' | 'metaKey' | 'altKey'>) {
  return event.shiftKey || event.ctrlKey || event.metaKey || event.altKey;
}

function useCabinetAction({ disabled, onActivate, onHoverChange }: ActionOptions) {
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

export function WhiskyCabinetDoor({ side, open, reducedMotion, ...action }: DoorProps) {
  const pivot = useRef<Group>(null);
  const invalidate = useThree(state => state.invalidate);
  const { hovered, handlers } = useCabinetAction(action);
  const inward = -side;
  const centerX = inward * DOOR.width / 2;
  const target = open && !action.disabled ? inward * Math.PI / 2 : 0;
  const label = side > 0 ? 'left' : 'right';
  useLayoutEffect(() => {
    if (pivot.current && (action.disabled || reducedMotion)) pivot.current.rotation.y = target;
    invalidate();
  }, [action.disabled, reducedMotion, target, invalidate]);
  useFrame((state, delta) => {
    const door = pivot.current;
    if (!door || door.rotation.y === target) return;
    const angle = MathUtils.damp(door.rotation.y, target, DOOR.damping, delta);
    door.rotation.y = Math.abs(angle - target) < .0015 ? target : angle;
    door.userData.angle = door.rotation.y;
    state.invalidate();
  });
  return <group ref={pivot} name={`whisky-cabinet-${label}-door`} position={[side * DOOR.hingeX, 0, DOOR.frontZ]}
    userData={{ sceneControl: true, open: open && !action.disabled, angle: target }} {...handlers}>
    <group name={`${label} slim bronze door frame`}>
      {[0, DOOR.width].map(x => <Block key={x} size={[DOOR.frame, DOOR.height, .018]}
        position={[inward * (x === 0 ? DOOR.frame / 2 : x - DOOR.frame / 2), DOOR.centerY, 0]}
        color={WHISKY_CABINET.frame} radius={.0018} roughness={.54} metalness={.68} />)}
      {[-1, 1].map(end => <Block key={end} size={[DOOR.width - DOOR.frame * 2, DOOR.frame, .018]}
        position={[centerX, DOOR.centerY + end * (DOOR.height - DOOR.frame) / 2, 0]}
        color={WHISKY_CABINET.frame} radius={.0015} roughness={.54} metalness={.68} />)}
    </group>
    <mesh name={`whisky-cabinet-${label}-glass`} position={[centerX, DOOR.centerY, 0]}>
      <boxGeometry args={[DOOR.width - DOOR.frame * 2 + .003, DOOR.height - DOOR.frame * 2 + .003, .004]} />
      {/* A thin reflective pane avoids a second transmission pass over the physical bottle glass. */}
      <meshPhysicalMaterial color={PALETTE.white} transparent opacity={.065} depthWrite={false}
        side={DoubleSide} forceSinglePass roughness={.11} metalness={0} clearcoat={.5}
        clearcoatRoughness={.15} envMapIntensity={.5} />
    </mesh>
    <group name={`whisky-cabinet-${label}-pull`} position={[inward * (DOOR.width - .037), 1.30, 0]}>
      {[-.066, .066].map(y => <Rod key={y} from={[0, y, -.009]} to={[0, y, -.032]}
        radius={.0035} color={WHISKY_CABINET.frame} metalness={.72} />)}
      <Block size={[.008, .17, .008]} position={[0, 0, -.032]} radius={.0038}
        color={hovered ? INTERACTION_HANDLE : WHISKY_CABINET.frame} metalness={.72} roughness={.4} />
    </group>
    {[.61, 1.305, 2].map(y => <mesh key={y} name={`${label} bronze hinge barrel`} position={[0, y, .002]} castShadow>
      <cylinderGeometry args={[.0055, .0055, .038, 12]} />
      <meshStandardMaterial color={WHISKY_CABINET.frame} roughness={.42} metalness={.72} />
    </mesh>)}
  </group>;
}

const INTERACTION_HANDLE = '#777062';

export function WhiskyCabinetLightSwitch({ active, ...action }: ActionOptions & { readonly active: boolean }) {
  const { hovered, handlers } = useCabinetAction(action);
  return <group name="whisky-cabinet-light-switch" position={[WHISKY_CABINET.width / 2 - .0485, .57, -.16]}
    userData={{ sceneControl: true, active }} {...handlers}>
    <Block size={[.037, .038, .018]} position={[0, 0, .008]} color={WHISKY_CABINET.frame} radius={.004} roughness={.55} metalness={.6} />
    <mesh name="cabinet recessed round light button" rotation={[Math.PI / 2, 0, 0]} castShadow>
      <cylinderGeometry args={[.012, .012, .003, 24]} />
      <meshStandardMaterial color={hovered ? INTERACTION_HANDLE : WHISKY_CABINET.frame} roughness={.35} metalness={.8} />
    </mesh>
    <mesh name="cabinet light indicator" position={[0, .001, -.002]} rotation={[0, Math.PI, 0]}>
      <circleGeometry args={[.0013, 12]} />
      <meshStandardMaterial color={LIGHTING.warm} emissive={LIGHTING.warm} emissiveIntensity={active ? .65 : 0} />
    </mesh>
  </group>;
}
