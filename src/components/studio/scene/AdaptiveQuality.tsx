import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';

export function AdaptiveQuality({ onChange }: { readonly onChange: (step: number) => void }) {
  const sample = useRef({ warmup: 3, seconds: 0, frames: 0, slow: 0, fast: 0 });
  useFrame((_, delta) => {
    const value = sample.current;
    if (document.hidden || delta > 1) {
      value.seconds = value.frames = value.slow = value.fast = 0;
      return;
    }
    if (value.warmup > 0) { value.warmup -= delta; return; }
    value.seconds += delta;
    value.frames += 1;
    if (value.seconds < 1) return;
    const fps = value.frames / value.seconds;
    value.slow = fps < 42 ? value.slow + 1 : 0;
    value.fast = fps > 57 ? value.fast + 1 : 0;
    if (value.slow >= 2 || value.fast >= 8) {
      onChange(value.slow >= 2 ? -0.25 : 0.25);
      value.slow = value.fast = 0;
    }
    value.seconds = value.frames = 0;
  });
  return null;
}
