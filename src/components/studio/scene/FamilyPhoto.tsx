import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import { Box3 } from 'three';
import type { Group } from 'three';
import type { StudioSceneProps } from '../types';
import { DigitalPhotoFrame } from './DigitalPhotoFrame';
import { Interactive } from './Interactive';
import { ROOM } from './config';
import { positionCollectionCopy, projectCollectionBounds } from './CollectionInspectionLayout';

export function FamilyPhoto(props: Pick<StudioSceneProps, 'familyPhotoSrc' | 'selected' | 'onSelect' | 'reducedMotion'>) {
  const [hovered, setHovered] = useState(false);
  const frame = useRef<Group>(null);
  const bounds = useMemo(() => new Box3(), []);
  useFrame(({ camera, size }) => {
    if (props.selected !== 'family' || !frame.current) return;
    const caption = document.querySelector<HTMLDialogElement>('.office-frame-info--family[open]');
    const body = frame.current.getObjectByName('photo-frame-body');
    if (!caption || !body) return;
    const object = projectCollectionBounds(bounds.setFromObject(body), camera, size);
    const layout = {
      placement: size.width < 760 || size.width < size.height ? 'bottom' : 'right',
      copyWidth: caption.offsetWidth, copyHeight: caption.offsetHeight, gap: size.width < 760 ? 16 : 24,
    } as const;
    const { left, top } = positionCollectionCopy(object, layout, size);
    caption.style.transform = `translate3d(${left}px, ${top}px, 0)`;
  });
  return <Interactive id="family" {...props} position={[-0.72, 0.0185 + ROOM.desk.height, -0.23]}
    rotation={0.13} onHoverChange={setHovered}>
    <group ref={frame}>
    <DigitalPhotoFrame src={props.familyPhotoSrc} hovered={hovered} active={props.selected === 'family'} reducedMotion={props.reducedMotion} />
    </group>
  </Interactive>;
}
