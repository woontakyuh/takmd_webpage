import { useState } from 'react';
import type { StudioSceneProps } from '../types';
import { DigitalPhotoFrame } from './DigitalPhotoFrame';
import { Interactive } from './Interactive';
import { ROOM } from './config';

export function FamilyPhoto(props: Pick<StudioSceneProps, 'familyPhotoSrc' | 'selected' | 'onSelect' | 'reducedMotion'>) {
  const [hovered, setHovered] = useState(false);
  return <Interactive id="family" {...props} position={[-0.72, 0.0185 + ROOM.desk.height, -0.23]}
    rotation={0.13} onHoverChange={setHovered}>
    <DigitalPhotoFrame src={props.familyPhotoSrc} hovered={hovered} active={props.selected === 'family'} reducedMotion={props.reducedMotion} />
  </Interactive>;
}
