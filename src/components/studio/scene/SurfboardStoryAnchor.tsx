import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import type { RefObject } from 'react';
import { Box3 } from 'three';
import type { Group } from 'three';
import { positionCollectionCopy, projectCollectionBounds } from './CollectionInspectionLayout';
import { surfboardReadingLayout } from './surfboardReading';

export function SurfboardStoryAnchor({ target }: { readonly target: RefObject<Group | null> }) {
  const bounds = useMemo(() => new Box3(), []);
  useFrame(({ camera, size }) => {
    const board = target.current;
    const caption = document.querySelector<HTMLDialogElement>('.surfboard-story[open]');
    if (!board || !caption) return;
    const object = projectCollectionBounds(bounds.setFromObject(board), camera, size);
    const layout = { ...surfboardReadingLayout(size.width, size.height), copyHeight: caption.offsetHeight };
    const { left, top } = positionCollectionCopy(object, layout, size);
    caption.style.transform = `translate3d(${left}px, ${top}px, 0)`;
    caption.style.visibility = 'visible';
  });
  return null;
}
