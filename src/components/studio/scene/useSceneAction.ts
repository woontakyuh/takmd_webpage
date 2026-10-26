import { useCursor } from '@react-three/drei';
import { useThree, type ThreeEvent } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Object3D } from 'three';
import { useMaterialAccent } from './HoverAccent';
import { beginSceneTap, type SceneTap } from './sceneTap';
import { cancelSceneSingleAction, scheduleSceneSingleAction } from './sceneGesture';

export type ActionOptions = {
  readonly visualAccent?: boolean;
  readonly disabled: boolean;
  readonly onActivate: () => void;
  readonly onHoverChange?: (hovered: boolean) => void;
};
export function useSceneAction({ disabled, onActivate, onHoverChange, visualAccent = false }: ActionOptions) {
  const canvas = useThree(state => state.gl.domElement);
  const gesture = useRef<SceneTap | null>(null);
  const mounted = useRef(false);
  const enabled = useRef(!disabled);
  const revision = useRef(0);
  const activate = useRef(onActivate);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered && !disabled);
  const hoverTarget = useRef<Object3D | null>(null);
  useMaterialAccent(hoverTarget, hovered && !disabled && visualAccent);
  useLayoutEffect(() => {
    enabled.current = !disabled;
    activate.current = onActivate;
    if (disabled) { revision.current += 1; gesture.current?.cancel(); gesture.current = null; setHovered(false); }
  }, [disabled, onActivate]);
  useEffect(() => { onHoverChange?.(hovered && !disabled); }, [hovered, disabled, onHoverChange]);
  useEffect(() => {
    mounted.current = true;
    return () => { gesture.current?.cancel(); mounted.current = false; };
  }, []);
  const hover = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    hoverTarget.current = event.eventObject;
    setHovered(!disabled && event.pointerType !== 'touch' && event.buttons === 0);
  };
  return {
    hovered: hovered && !disabled,
    handlers: {
      onPointerOver: hover,
      onPointerMove: hover,
      onPointerOut: () => setHovered(false),
      onPointerDown: (event: ThreeEvent<PointerEvent>) => {
        setHovered(false);
        event.stopPropagation();
        gesture.current?.cancel();
        gesture.current = disabled ? null : beginSceneTap(canvas, window, event, () => { gesture.current = null; setHovered(false); });
      },
      onPointerCancel: () => { gesture.current?.cancel(); gesture.current = null; setHovered(false); },
      onPointerUp: (event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        const start = gesture.current;
        gesture.current = null;
        const accepted = start?.finish(event, event.delta);
        if (disabled || !accepted) return;
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

