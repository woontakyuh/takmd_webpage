import { Suspense } from 'react';
import type { StudioSceneProps } from '../types';
import { DoctorCoat, JiuJitsuGi } from './Garment';
import { GarmentRack, RACK_RAIL_HALF_HEIGHT } from './GarmentRack';
import { Interactive } from './Interactive';
import { Surfboard } from './Surfboard';
import { ROOM } from './config';

type PersonalCornerProps = Pick<StudioSceneProps, 'selected' | 'onSelect' | 'reducedMotion'>;

export function PersonalCorner({ selected, onSelect, reducedMotion }: PersonalCornerProps) {
  const wardrobe = ROOM.wardrobe;
  return (
    <group>
      <group position={[...wardrobe.position]} rotation={[0, wardrobe.rotation, 0]}>
        <GarmentRack />
        <Interactive id="spine" selected={selected} onSelect={onSelect} reducedMotion={reducedMotion}
          fixed position={[-0.12, wardrobe.height - RACK_RAIL_HALF_HEIGHT, 0]} rotation={0.08}>
          <DoctorCoat />
        </Interactive>
        <Interactive id="bjj" selected={selected} onSelect={onSelect} reducedMotion={reducedMotion}
          fixed position={[0.12, wardrobe.height - RACK_RAIL_HALF_HEIGHT, 0]} rotation={-0.1}>
          <JiuJitsuGi />
        </Interactive>
      </group>
      <Interactive id="surfing" selected={selected} onSelect={onSelect} reducedMotion={reducedMotion}
        position={ROOM.surfboard.position} rotation={ROOM.surfboard.rotation}>
        <Suspense fallback={null}><Surfboard /></Suspense>
      </Interactive>
    </group>
  );
}
