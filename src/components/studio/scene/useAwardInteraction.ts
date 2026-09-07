import { useCursor } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import type { MeshPhysicalMaterial } from 'three';

const CLICK_THRESHOLD = 5;
const SHIMMER_SECONDS = 1.8;
export const AWARD_INSET_NAME = 'Gold award polished play-button inset';

type Gesture = {
  readonly pointerId: number; readonly x: number; readonly y: number;
  readonly focused: boolean; readonly inset: boolean;
};
type Options = {
  readonly focused: boolean; readonly reducedMotion: boolean;
  readonly channelUrl: string; readonly onSelect: () => void;
};

function modified(event: Pick<MouseEvent, 'shiftKey' | 'ctrlKey' | 'metaKey' | 'altKey'>): boolean {
  return event.shiftKey || event.ctrlKey || event.metaKey || event.altKey;
}

export function useAwardInteraction({ focused, reducedMotion, channelUrl, onSelect }: Options) {
  const material = useRef<MeshPhysicalMaterial>(null);
  const gesture = useRef<Gesture | null>(null);
  const shimmer = useRef(0);
  const [region, setRegion] = useState<'body' | 'inset' | null>(null);
  const insetHovered = region === 'inset' && focused;
  useCursor(region !== null && (!focused || insetHovered));

  useEffect(() => {
    gesture.current = null;
    setRegion(null);
  }, [focused]);
  useEffect(() => { shimmer.current = 0; }, [insetHovered]);
  useEffect(() => {
    const cancel = () => { gesture.current = null; };
    const track = (event: PointerEvent) => {
      const start = gesture.current;
      if (start && (event.pointerId !== start.pointerId || modified(event)
        || Math.hypot(event.clientX - start.x, event.clientY - start.y) >= CLICK_THRESHOLD)) cancel();
    };
    const key = (event: KeyboardEvent) => { if (modified(event)) cancel(); };
    window.addEventListener('pointerdown', track, true);
    window.addEventListener('pointermove', track, true);
    window.addEventListener('pointerup', cancel);
    window.addEventListener('pointercancel', cancel, true);
    window.addEventListener('keydown', key, true);
    window.addEventListener('blur', cancel);
    return () => {
      window.removeEventListener('pointerdown', track, true);
      window.removeEventListener('pointermove', track, true);
      window.removeEventListener('pointerup', cancel);
      window.removeEventListener('pointercancel', cancel, true);
      window.removeEventListener('keydown', key, true);
      window.removeEventListener('blur', cancel);
    };
  }, []);

  useFrame((_, delta) => {
    if (!material.current) return;
    shimmer.current = insetHovered ? (shimmer.current + delta) % SHIMMER_SECONDS : 0;
    const pulse = reducedMotion ? 0.5 : 0.5 + 0.5 * Math.sin(2 * Math.PI * shimmer.current / SHIMMER_SECONDS);
    material.current.emissiveIntensity = insetHovered ? 0.65 + pulse * 0.5 : 0;
    material.current.envMapIntensity = insetHovered ? 2.2 + pulse * 0.9 : 1.7;
    material.current.roughness = insetHovered ? 0.12 : 0.22;
  });

  const hover = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setRegion(event.pointerType !== 'touch' && event.buttons === 0
      ? event.object.name === AWARD_INSET_NAME ? 'inset' : 'body' : null);
  };
  return {
    material,
    insetHovered,
    handlers: {
      onPointerOver: hover,
      onPointerMove: hover,
      onPointerOut: () => setRegion(null),
      onPointerDown: (event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        setRegion(null);
        gesture.current = event.button !== 0 || !event.isPrimary || modified(event) ? null
          : { pointerId: event.pointerId, x: event.clientX, y: event.clientY, focused, inset: event.object.name === AWARD_INSET_NAME };
      },
      onPointerCancel: () => { gesture.current = null; setRegion(null); },
      onPointerUp: (event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        const start = gesture.current;
        gesture.current = null;
        if (!start || start.focused !== focused || event.button !== 0 || !event.isPrimary || modified(event)
          || event.pointerId !== start.pointerId
          || Math.hypot(event.clientX - start.x, event.clientY - start.y) >= CLICK_THRESHOLD) return;
        if (!focused) onSelect();
        else if (start.inset && event.object.name === AWARD_INSET_NAME) window.open(channelUrl, '_blank', 'noopener,noreferrer');
      },
      onClick: (event: ThreeEvent<MouseEvent>) => event.stopPropagation(),
    },
  };
}
