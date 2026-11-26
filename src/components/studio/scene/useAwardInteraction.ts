import { useCursor } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import type { MeshPhysicalMaterial, MeshStandardMaterial } from 'three';
import { useArrangement } from '../arrangement';
import { scheduleSceneSingleAction } from './sceneGesture';

const CLICK_THRESHOLD = 5;
const SHIMMER_SECONDS = 1.8;
export const AWARD_INSET_NAME = 'Gold award polished play-button inset';

type Gesture = {
  readonly pointerId: number; readonly x: number; readonly y: number;
  readonly focused: boolean;
};
type Options = {
  readonly focused: boolean; readonly reducedMotion: boolean;
  readonly channelUrl: string; readonly onSelect: () => void;
};

function modified(event: Pick<MouseEvent, 'shiftKey' | 'ctrlKey' | 'metaKey' | 'altKey'>): boolean {
  return event.shiftKey || event.ctrlKey || event.metaKey || event.altKey;
}

export function useAwardInteraction({ focused, reducedMotion, channelUrl, onSelect }: Options) {
  const { editing } = useArrangement();
  const canvas = useThree(state => state.gl.domElement);
  const material = useRef<MeshPhysicalMaterial>(null);
  const bodyMaterial = useRef<MeshStandardMaterial>(null);
  const edgeMaterial = useRef<MeshStandardMaterial>(null);
  const gesture = useRef<Gesture | null>(null);
  const shimmer = useRef(0);
  const [region, setRegion] = useState<'body' | 'inset' | null>(null);
  const hovered = region !== null;
  useCursor(region !== null && !editing);

  useEffect(() => {
    gesture.current = null;
    setRegion(null);
  }, [focused]);
  useEffect(() => { if (editing) setRegion(null); }, [editing]);
  useEffect(() => { shimmer.current = 0; }, [hovered]);
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
    shimmer.current = hovered ? (shimmer.current + delta) % SHIMMER_SECONDS : 0;
    const pulse = reducedMotion ? 0.5 : 0.5 + 0.5 * Math.sin(2 * Math.PI * shimmer.current / SHIMMER_SECONDS);
    if (material.current) {
      material.current.emissiveIntensity = hovered ? 0.65 + pulse * 0.5 : 0;
      material.current.envMapIntensity = hovered ? 2.2 + pulse * 0.9 : 1.7;
      material.current.roughness = hovered ? 0.12 : 0.22;
    }
    if (bodyMaterial.current) {
      bodyMaterial.current.emissiveIntensity = hovered ? 0.045 : 0;
      bodyMaterial.current.envMapIntensity = hovered ? 1.16 : 1.1;
    }
    if (edgeMaterial.current) {
      edgeMaterial.current.emissiveIntensity = hovered ? 0.07 : 0;
      edgeMaterial.current.envMapIntensity = hovered ? 1.22 : 1;
    }
  });

  const hover = (event: ThreeEvent<PointerEvent>) => {
    if (editing) {
      setRegion(null);
      return;
    }
    event.stopPropagation();
    setRegion(event.pointerType !== 'touch' && event.buttons === 0
      ? event.object.name === AWARD_INSET_NAME ? 'inset' : 'body' : null);
  };
  return {
    material,
    bodyMaterial,
    edgeMaterial,
    hovered,
    handlers: {
      onPointerOver: hover,
      onPointerMove: hover,
      onPointerOut: () => setRegion(null),
      onPointerDown: (event: ThreeEvent<PointerEvent>) => {
        if (editing) return;
        event.stopPropagation();
        setRegion(null);
        gesture.current = event.button !== 0 || !event.isPrimary || modified(event) ? null
          : { pointerId: event.pointerId, x: event.clientX, y: event.clientY, focused };
      },
      onPointerCancel: () => { gesture.current = null; setRegion(null); },
      onPointerUp: (event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        const start = gesture.current;
        gesture.current = null;
        if (editing || !start || start.focused !== focused || event.button !== 0 || !event.isPrimary || modified(event)
          || event.pointerId !== start.pointerId
          || Math.hypot(event.clientX - start.x, event.clientY - start.y) >= CLICK_THRESHOLD) return;
        if (!focused) {
          scheduleSceneSingleAction(canvas, onSelect);
        } else {
          scheduleSceneSingleAction(canvas, () => window.open(channelUrl, '_blank', 'noopener,noreferrer'));
        }
      },
      onClick: (event: ThreeEvent<MouseEvent>) => event.stopPropagation(),
    },
  };
}
