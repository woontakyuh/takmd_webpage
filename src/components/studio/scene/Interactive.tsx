import { useCursor } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { ExhibitId } from '../types';
import type { Point } from './config';
import { scheduleSceneSingleAction } from './sceneGesture';
import { useArrangement } from '../arrangement';

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

export function Interactive({ id, selected, onSelect, position, rotation = 0, name, onActivate, onHoverChange, children }: InteractiveProps) {
  const { editing } = useArrangement();
  const canvas = useThree(state => state.gl.domElement);
  const pointerStart = useRef<{ readonly x: number; readonly y: number } | null>(null);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);
  useEffect(() => {
    if (!editing) return;
    setHovered(false);
    onHoverChange?.(false);
  }, [editing, onHoverChange]);
  return (
    <group name={name ?? `Exhibit ${id}`} position={[...position]} rotation={[0, rotation, 0]}
      onPointerEnter={(event) => { if (editing) return; event.stopPropagation(); setHovered(true); onHoverChange?.(true); }}
      onPointerLeave={(event) => { event.stopPropagation(); setHovered(false); onHoverChange?.(false); }}
      onPointerDown={(event) => {
        pointerStart.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerCancel={() => { pointerStart.current = null; }}
      onClick={(event) => {
        event.stopPropagation();
        const start = pointerStart.current;
        pointerStart.current = null;
        if (editing || !start || event.delta >= CLICK_DRAG_THRESHOLD
          || Math.hypot(event.clientX - start.x, event.clientY - start.y) >= CLICK_DRAG_THRESHOLD
          || (selected === id && !onActivate)) return;
        scheduleSceneSingleAction(canvas, onActivate ?? (() => onSelect(id)));
      }}>
      {children}
    </group>
  );
}
