import { Suspense } from 'react';
import type { Texture } from 'three';
import { Movable } from './Movable';
import { WhiskyCabinet } from './WhiskyCabinet';
import { WhiskyCollection } from './WhiskyCollection';
import { WHISKY_CABINET } from './WhiskyCabinetLayout';
import { BeosoundTheatre } from './BeosoundTheatre';
import { RoyalSystem } from './RoyalSystem';
import { UsmLowboard } from './UsmLowboard';

type OfficeStorageProps = { readonly wood: Texture; readonly lamp: number; readonly reducedMotion: boolean };

export function OfficeStorage({ wood, lamp, reducedMotion }: OfficeStorageProps) {
  return <group name="office-storage">
    <RoyalSystem wood={wood} />
    <UsmLowboard />
    <Movable id="whisky"><group position={[...WHISKY_CABINET.center]} rotation={[0, WHISKY_CABINET.rotation, 0]}>
      <WhiskyCabinet wood={wood} lamp={lamp} reducedMotion={reducedMotion}>
        <Suspense fallback={null}><WhiskyCollection /></Suspense>
      </WhiskyCabinet>
    </group></Movable>
    <group name="Beosound Theatre shelf display" position={[0, 0.82, 3.111]} rotation={[0, Math.PI, 0]}>
      <BeosoundTheatre />
    </group>
  </group>;
}
