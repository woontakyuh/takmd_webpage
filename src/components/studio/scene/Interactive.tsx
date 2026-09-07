import { useCursor } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { MathUtils } from 'three';
import type { Group } from 'three';
import type { ExhibitId } from '../types';
import { MOTION } from './config';
import type { Point } from './config';
import { scheduleSceneSingleAction } from './sceneGesture';

type InteractiveProps = {
  readonly id: ExhibitId;
  readonly selected: ExhibitId | null;
  readonly onSelect: (id: ExhibitId) => void;
  readonly reducedMotion: boolean;
  readonly position: Point;
  readonly rotation?: number;
  readonly fixed?: boolean;
  readonly name?: string;
  readonly onActivate?: () => void;
  readonly onHoverChange?: (hovered: boolean) => void;
  readonly children: ReactNode;
};

const CLICK_DRAG_THRESHOLD = 5;

export function Interactive({ id, selected, onSelect, reducedMotion, position, rotation = 0, fixed = false, name, onActivate, onHoverChange, children }: InteractiveProps) {
  const canvas = useThree(state => state.gl.domElement);
  const group = useRef<Group>(null);
  const pointerStart = useRef<{ readonly x: number; readonly y: number } | null>(null);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);
  useFrame((_, delta) => {
    if (!group.current) return;
    const lift = !fixed && id !== 'ai' && id !== 'projects' && id !== 'family' && (hovered || selected === id) ? MOTION.hoverLift : 0;
    group.current.position.y = reducedMotion ? position[1] + lift
      : MathUtils.damp(group.current.position.y, position[1] + lift, MOTION.object, delta);
  });
  return (
    <group name={name ?? `Exhibit ${id}`} ref={group} position={[...position]} rotation={[0, rotation, 0]}
      onPointerOver={(event) => { event.stopPropagation(); setHovered(true); onHoverChange?.(true); }}
      onPointerOut={() => { setHovered(false); onHoverChange?.(false); }}
      onPointerDown={(event) => {
        pointerStart.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerCancel={() => { pointerStart.current = null; }}
      onClick={(event) => {
        event.stopPropagation();
        const start = pointerStart.current;
        pointerStart.current = null;
        if (!start || event.delta >= CLICK_DRAG_THRESHOLD
          || Math.hypot(event.clientX - start.x, event.clientY - start.y) >= CLICK_DRAG_THRESHOLD
          || (selected === id && !onActivate)) return;
        scheduleSceneSingleAction(canvas, onActivate ?? (() => onSelect(id)));
      }}>
      {children}
    </group>
  );
}
