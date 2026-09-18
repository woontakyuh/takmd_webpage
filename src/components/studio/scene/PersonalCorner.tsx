import { Suspense, useRef } from 'react';
import { Deferred } from './DeferredAssets';
import type { Group } from 'three';
import type { StudioSceneProps } from '../types';
import { PERSONAL_LINKS } from '../personal';
import { DoctorCoat, JiuJitsuGi } from './Garment';
import { EPOCH_HANGER_POSITIONS, GarmentRack, RACK_RAIL_HALF_HEIGHT } from './GarmentRack';
import { Interactive } from './Interactive';
import { PersonalArtworkFrame } from './PersonalArtworkFrame';
import { Surfboard } from './Surfboard';
import { SurfboardStoryAnchor } from './SurfboardStoryAnchor';
import { ROOM } from './config';

type PersonalCornerProps = Pick<StudioSceneProps, 'selected' | 'onSelect' | 'reducedMotion'>;

export function PersonalCorner({ selected, onSelect, reducedMotion }: PersonalCornerProps) {
  const wardrobe = ROOM.wardrobe;
  const surfboard = useRef<Group>(null);
  return (
    <group>
      <Suspense fallback={null}><PersonalArtworkFrame /></Suspense>
      <group position={[...wardrobe.position]} rotation={[0, wardrobe.rotation, 0]}>
        <GarmentRack />
        <Interactive id="spine" name="Exhibit hospital" selected={selected} onSelect={onSelect} reducedMotion={reducedMotion}
          onActivate={() => window.open(PERSONAL_LINKS.hospital, '_blank', 'noopener,noreferrer')}
          fixed position={[EPOCH_HANGER_POSITIONS.coat[0], EPOCH_HANGER_POSITIONS.coat[1] - RACK_RAIL_HALF_HEIGHT, EPOCH_HANGER_POSITIONS.coat[2]]}
          rotation={Math.PI / 2 + 0.08}>
          <Deferred><DoctorCoat /></Deferred>
        </Interactive>
        <Interactive id="bjj" selected={selected} onSelect={onSelect} reducedMotion={reducedMotion}
          fixed position={[EPOCH_HANGER_POSITIONS.gi[0], EPOCH_HANGER_POSITIONS.gi[1] - RACK_RAIL_HALF_HEIGHT, EPOCH_HANGER_POSITIONS.gi[2]]}
          rotation={Math.PI / 2}>
          <Deferred><JiuJitsuGi /></Deferred>
        </Interactive>
      </group>
      <Interactive id="surfing" selected={selected} onSelect={onSelect} reducedMotion={reducedMotion}
        position={ROOM.surfboard.position} rotation={ROOM.surfboard.rotation}>
        <group ref={surfboard}><Deferred><Surfboard /></Deferred></group>
        {selected === 'surfing' && <SurfboardStoryAnchor target={surfboard} />}
      </Interactive>
    </group>
  );
}
