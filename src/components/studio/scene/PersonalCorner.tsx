import { Suspense } from 'react';
import type { StudioSceneProps } from '../types';
import { DoctorCoat, JiuJitsuGi } from './Garment';
import { Interactive } from './Interactive';
import { Rod } from './Primitives';
import { Surfboard } from './Surfboard';
import { PALETTE, ROOM } from './config';

type PersonalCornerProps = Pick<StudioSceneProps, 'selected' | 'onSelect' | 'reducedMotion'>;

export function PersonalCorner({ selected, onSelect, reducedMotion }: PersonalCornerProps) {
  const wardrobe = ROOM.wardrobe;
  return (
    <group>
      <group position={[...wardrobe.position]} rotation={[0, wardrobe.rotation, 0]}>
        <Rod from={[-wardrobe.width / 2, 0.035, 0]} to={[-wardrobe.width / 2, wardrobe.height, 0]}
          radius={0.014} color={PALETTE.graphite} metalness={0.7} />
        <Rod from={[wardrobe.width / 2, 0.035, 0]} to={[wardrobe.width / 2, wardrobe.height, 0]}
          radius={0.014} color={PALETTE.graphite} metalness={0.7} />
        <Rod from={[-wardrobe.width / 2, wardrobe.height, 0]} to={[wardrobe.width / 2, wardrobe.height, 0]}
          radius={0.014} color={PALETTE.graphite} metalness={0.7} />
        <Rod from={[-wardrobe.width / 2 - 0.09, 0.025, -0.13]} to={[-wardrobe.width / 2 + 0.09, 0.025, 0.13]}
          radius={0.011} color={PALETTE.graphite} metalness={0.68} />
        <Rod from={[wardrobe.width / 2 - 0.09, 0.025, -0.13]} to={[wardrobe.width / 2 + 0.09, 0.025, 0.13]}
          radius={0.011} color={PALETTE.graphite} metalness={0.68} />
        <Interactive id="spine" selected={selected} onSelect={onSelect} reducedMotion={reducedMotion}
          position={[-0.3, wardrobe.height - 0.045, -0.045]}>
          <DoctorCoat />
        </Interactive>
        <Interactive id="bjj" selected={selected} onSelect={onSelect} reducedMotion={reducedMotion}
          position={[0.3, wardrobe.height - 0.045, 0.035]}>
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
