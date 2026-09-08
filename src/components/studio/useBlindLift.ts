import { useCallback, useEffect, useRef, useState } from 'react';
import type { BlindLift } from './types';

export function useBlindLift(reducedMotion: boolean) {
  const [lift, setLift] = useState<BlindLift>([0.82, 0.82]);
  const current = useRef<BlindLift>(lift);
  const targets = useRef<[number | null, number | null]>([null, null]);
  const frame = useRef(0);
  const previousTime = useRef(0);
  const change = useCallback((side: 0 | 1, value: number) => {
    const bounded = Math.max(0, Math.min(1, value));
    const fullTravel = !reducedMotion && (bounded === 0 || bounded === 1);
    targets.current[side] = fullTravel ? bounded : null;
    if (!fullTravel) {
      current.current = side === 0 ? [bounded, current.current[1]] : [current.current[0], bounded];
      setLift(current.current);
    }
    if (frame.current || !fullTravel) return;
    previousTime.current = performance.now();
    const advance = (time: number) => {
      frame.current = 0;
      const step = Math.max(0, Math.min((time - previousTime.current) / 1000, 0.064)) * 0.45;
      previousTime.current = time;
      const next: [number, number] = [...current.current];
      for (const index of [0, 1] as const) {
        const target = targets.current[index];
        if (target === null) continue;
        next[index] += Math.max(-step, Math.min(step, target - next[index]));
        if (next[index] === target) targets.current[index] = null;
      }
      current.current = next;
      setLift(next);
      if (targets.current.some(target => target !== null)) frame.current = requestAnimationFrame(advance);
    };
    frame.current = requestAnimationFrame(advance);
  }, [reducedMotion]);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  return [lift, change] as const;
}
