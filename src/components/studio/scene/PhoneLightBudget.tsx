import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import type { Light, Object3D } from 'three';

const KEEP_ON_PHONES = ['Window daylight', 'TV rear', 'Shelf left wash', 'Shelf right wash'] as const;
const isRectAreaLight = (object: Object3D): object is Light => (object as Light).isLight === true && object.type === 'RectAreaLight';

// Rect-area lights are the costliest light in the forward shader and the room carries twenty: window daylight, the
// television's rear strips, shelf and storage washes, floor lamps. A phone keeps the eight that shape the evening —
// daylight, the television halo and the shelf strips — and drops the rest; their emissive strips still glow. Lights mount
// over time, so the sweep repeats once a second.
export function PhoneLightBudget({ mobile }: { readonly mobile: boolean }) {
  const scene = useThree(state => state.scene);
  const frames = useRef(0);
  const managed = useRef(new WeakSet<Object3D>());
  useFrame(() => {
    frames.current += 1;
    if (frames.current % 60 !== 1) return;
    scene.traverse(object => {
      if (!isRectAreaLight(object) || KEEP_ON_PHONES.some(prefix => object.name.startsWith(prefix))) return;
      if (mobile) { object.visible = false; managed.current.add(object); }
      else if (managed.current.has(object)) { object.visible = true; managed.current.delete(object); }
    });
  });
  return null;
}
