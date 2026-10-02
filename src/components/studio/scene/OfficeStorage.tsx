import type { Texture } from 'three';
import type { StudioSceneProps } from '../types';
import { Movable } from './Movable';
import { WhiskyCabinet } from './WhiskyCabinet';
import { WHISKY_CABINET } from './WhiskyCabinetLayout';
import { Beosound9000 } from './Beosound9000';
import { Beolab8000Pair } from './Beolab8000';
import { RoyalSystem } from './RoyalSystem';
import { UsmLowboard } from './UsmLowboard';

type OfficeStorageProps = { readonly wood: Texture; readonly lamp: number; readonly onAwardPhoto: () => void } & Pick<StudioSceneProps, 'selected' | 'reducedMotion'>;

export function OfficeStorage({ wood, selected, reducedMotion, onAwardPhoto, lamp }: OfficeStorageProps) {
  return <group name="office-storage">
    <RoyalSystem wood={wood} onAwardPhoto={onAwardPhoto} selected={selected} reducedMotion={reducedMotion} />
    <UsmLowboard />
    <Movable id="whisky"><group position={[...WHISKY_CABINET.center]} rotation={[0, WHISKY_CABINET.rotation, 0]}>
      <WhiskyCabinet wood={wood} reducedMotion={reducedMotion} lamp={lamp} />
    </group></Movable>
    <group name="Beosound 9000 shelf display" position={[0, 0.82, 3.111]} rotation={[0, Math.PI, 0]}>
      <Beosound9000 reducedMotion={reducedMotion} />
    </group>
    <Beolab8000Pair />
  </group>;
}
