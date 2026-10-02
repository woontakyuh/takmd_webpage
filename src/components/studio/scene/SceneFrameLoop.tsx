import { useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { useSceneInspection } from './SceneInspection';
import { usePhone } from './Device';
import { frameInterval } from './frameCadence';
import { RenderBudget, roomPixelRatio } from './renderBudget';

export function SceneFrameLoop({ active, settled, capture = false, wholePixels = false, onPixelRatioChange }: { readonly active: boolean; readonly settled: boolean; readonly capture?: boolean; readonly wholePixels?: boolean; readonly onPixelRatioChange: (ratio: number) => void }) {
  const get = useThree(state => state.get);
  const phone = usePhone();
  const { inspection } = useSceneInspection();
  const nativeFrames = inspection?.id === 'proposal-memory';
  const elapsed = useRef(0);
  const budget = useRef(new RenderBudget());
  useEffect(() => {
    if (!active) return;
    let request = 0;
    let previous = performance.now();
    let rendered = previous;
    let accumulated = 0;
    let viewport = '';
    let ceiling = 0.85;
    let interactiveUntil = previous + 1000;
    let readingUntil = 0;
    let player = get().scene.getObjectByName('Bang & Olufsen Beosound 9000');
    let palm = get().scene.getObjectByName('palm foliage canopy');
    const cameraMatrix = get().camera.matrixWorld.clone();
    const isReading = (event: Event) => event.target instanceof Element && Boolean(event.target.closest('.studio-dialog'));
    const interact = (event: Event) => {
      if (isReading(event)) { readingUntil = performance.now() + 400; return; }
      readingUntil = 0;
      interactiveUntil = performance.now() + 5000;
    };
    const pointerMove = (event: Event) => {
      if (isReading(event)) { readingUntil = performance.now() + 400; return; }
      interactiveUntil = Math.max(interactiveUntil, performance.now() + 500);
    };
    const interactionEvents = ['pointerdown', 'pointerup', 'keydown', 'wheel', 'resize'] as const;
    for (const event of interactionEvents) window.addEventListener(event, interact, { passive: true, capture: true });
    window.addEventListener('pointermove', pointerMove, { passive: true, capture: true });
    window.addEventListener('scroll', pointerMove, { passive: true, capture: true });
    const tick = (now: number) => {
      const state = get();
      if (!capture) {
        const key = `${state.size.width}:${state.size.height}:${window.devicePixelRatio}`;
        if (key !== viewport) {
          viewport = key;
          ceiling = roomPixelRatio(state.size.width, state.size.height, window.devicePixelRatio, wholePixels);
          state.setDpr(ceiling);
          onPixelRatioChange(ceiling);
          budget.current = new RenderBudget();
        }
      }
      player ??= state.scene.getObjectByName('Bang & Olufsen Beosound 9000');
      palm ??= state.scene.getObjectByName('palm foliage canopy');
      const interval = frameInterval({ settled, interacting: now < interactiveUntil,
        animating: player?.userData.animating === true || palm?.userData.animating === true });
      accumulated += now - previous;
      previous = now;
      const reader = phone && settled ? document.querySelector('.studio-dialog[open]') : null;
      const covered = now >= interactiveUntil && reader && (reader.getAttribute('data-expanded') === 'true'
        || (reader.querySelector('.studio-reader-body')?.getBoundingClientRect().top ?? Infinity) < 80);
      if (!covered && !(reader && now < readingUntil) && (nativeFrames || accumulated >= interval - 0.1)) {
        accumulated = Math.max(0, accumulated - interval);
        if (accumulated >= interval) accumulated %= interval;
        elapsed.current += (now - rendered) / 1000;
        rendered = now;
        const started = performance.now();
        state.advance(elapsed.current);
        if (!capture && !wholePixels && settled && now < interactiveUntil && !nativeFrames) {
          const ratio = state.gl.getPixelRatio();
          const next = budget.current.sample(performance.now() - started, now, ratio, ceiling);
          if (next < ratio) { state.setDpr(next); onPixelRatioChange(next); }
        }
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
      window.removeEventListener('scroll', pointerMove, true);
    };
  }, [active, capture, get, nativeFrames, phone, settled, wholePixels, onPixelRatioChange]);
  return null;
}
