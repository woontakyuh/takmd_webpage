import { useRef } from 'react';
import type { Group } from 'three';
import type { StudioSceneProps } from '../types';
import { DoctorCoat, JiuJitsuGi } from './Garment';
import { EPOCH_HANGER_POSITIONS, GarmentRack, RACK_RAIL_HALF_HEIGHT } from './GarmentRack';
import { Interactive } from './Interactive';
import { PersonalArtworkFrame } from './PersonalArtworkFrame';
import { TexturedArtwork } from './TexturedArtwork';
import { Surfboard } from './Surfboard';
import { SurfboardStoryAnchor } from './SurfboardStoryAnchor';
import { ROOM } from './config';
import { ACADEMIC_OFFICE } from './roomEdition';

type PersonalCornerProps = Pick<StudioSceneProps, 'selected' | 'onSelect' | 'reducedMotion'>;

export function PersonalCorner({ selected, onSelect, reducedMotion }: PersonalCornerProps) {
  const wardrobe = ROOM.wardrobe;
  const surfboard = useRef<Group>(null);
  return (
    <group>
      <PersonalArtworkFrame />
      <TexturedArtwork />
      <group position={[...wardrobe.position]} rotation={[0, wardrobe.rotation, 0]}>
        <GarmentRack />
        <group name="Chamjoeun Hospital physician coat · no external link"
          position={[EPOCH_HANGER_POSITIONS.coat[0], EPOCH_HANGER_POSITIONS.coat[1] - RACK_RAIL_HALF_HEIGHT, EPOCH_HANGER_POSITIONS.coat[2]]}
          rotation={[0, Math.PI / 2 + 0.08, 0]}>
          <DoctorCoat />
        </group>
        {!ACADEMIC_OFFICE && <Interactive id="bjj" selected={selected} onSelect={onSelect} reducedMotion={reducedMotion}
          fixed position={[EPOCH_HANGER_POSITIONS.gi[0], EPOCH_HANGER_POSITIONS.gi[1] - RACK_RAIL_HALF_HEIGHT, EPOCH_HANGER_POSITIONS.gi[2]]}
          rotation={Math.PI / 2}>
          <JiuJitsuGi />
        </Interactive>}
      </group>
      {!ACADEMIC_OFFICE && <Interactive id="surfing" selected={selected} onSelect={onSelect} reducedMotion={reducedMotion}
        position={ROOM.surfboard.position} rotation={ROOM.surfboard.rotation}>
        <group ref={surfboard}><Surfboard /></group>
        {selected === 'surfing' && <SurfboardStoryAnchor target={surfboard} />}
      </Interactive>}
    </group>
  );
}
