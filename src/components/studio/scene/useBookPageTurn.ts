import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { beginBookPagePress, finishBookPagePress, moveBookPagePress } from '../personalBookInteraction';
import type { BookPagePress } from '../personalBookInteraction';
import { cancelSceneSingleAction, scheduleSceneSingleAction } from './sceneGesture';

export function useBookPageTurn(active: boolean, onStep: (direction: 1 | -1) => void) {
  const canvas = useThree(state => state.gl.domElement);
  const press = useRef<BookPagePress | null>(null);
  useEffect(() => {
    if (!active) return;
    const cancel = () => { press.current = null; };
    const track = (event: PointerEvent) => { press.current = moveBookPagePress(press.current, event); };
    window.addEventListener('pointerdown', track, true);
    window.addEventListener('pointermove', track, true);
    window.addEventListener('pointercancel', cancel, true);
    window.addEventListener('blur', cancel);
    return () => {
      cancel();
      cancelSceneSingleAction(canvas);
      window.removeEventListener('pointerdown', track, true);
      window.removeEventListener('pointermove', track, true);
      window.removeEventListener('pointercancel', cancel, true);
      window.removeEventListener('blur', cancel);
    };
  }, [active, canvas]);

  return (direction: 1 | -1) => ({
    onPointerDown: (event: ThreeEvent<PointerEvent>) => {
      if (!active) return;
      event.stopPropagation();
      press.current = beginBookPagePress(event, direction);
    },
    onPointerUp: (event: ThreeEvent<PointerEvent>) => {
      if (!active) return;
      event.stopPropagation();
      const clicked = finishBookPagePress(press.current, event, direction);
      press.current = null;
      if (clicked) scheduleSceneSingleAction(canvas, () => onStep(direction));
    },
    onPointerCancel: () => { press.current = null; },
    onClick: (event: ThreeEvent<MouseEvent>) => { if (active) event.stopPropagation(); },
  });
}
