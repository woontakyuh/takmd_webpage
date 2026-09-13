import { useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { useSceneInspection } from './SceneInspection';

export function SceneFrameLoop({ active }: { readonly active: boolean }) {
  const get = useThree(state => state.get);
  const { inspection } = useSceneInspection();
  const nativeFrames = inspection?.id === 'proposal-memory';
  const elapsed = useRef(0);
  useEffect(() => {
    if (!active) return;
    let request = 0;
    let previous = performance.now();
    let rendered = previous;
    let accumulated = 0;
    let interactiveUntil = previous + 1000;
    const cameraMatrix = get().camera.matrixWorld.clone();
    const interact = () => { interactiveUntil = performance.now() + 5000; };
    const pointerMove = () => { interactiveUntil = Math.max(interactiveUntil, performance.now() + 150); };
    const interactionEvents = ['pointerdown', 'pointerup', 'keydown', 'wheel', 'resize'] as const;
    for (const event of interactionEvents) window.addEventListener(event, interact, { passive: true, capture: true });
    window.addEventListener('pointermove', pointerMove, { passive: true, capture: true });
    const tick = (now: number) => {
      const state = get();
      const interval = 1000 / (now < interactiveUntil ? 60 : 30);
      accumulated += now - previous;
      previous = now;
      if (nativeFrames || accumulated >= interval - 0.1) {
        accumulated = Math.max(0, accumulated - interval);
        if (accumulated >= interval) accumulated %= interval;
        elapsed.current += (now - rendered) / 1000;
        rendered = now;
        state.advance(elapsed.current);
        if (cameraMatrix.elements.some((value, index) => Math.abs(value - state.camera.matrixWorld.elements[index]) > 0.00001)) {
          interactiveUntil = Math.max(interactiveUntil, now + 200);
          cameraMatrix.copy(state.camera.matrixWorld);
        }
      }
      request = requestAnimationFrame(tick);
    };
    request = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(request);
      for (const event of interactionEvents) window.removeEventListener(event, interact, true);
      window.removeEventListener('pointermove', pointerMove, true);
    };
  }, [active, get, nativeFrames]);
  return null;
}
