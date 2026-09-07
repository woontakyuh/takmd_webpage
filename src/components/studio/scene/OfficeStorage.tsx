import type { Texture } from 'three';
import { RoyalSystem } from './RoyalSystem';
import { UsmLowboard } from './UsmLowboard';

type OfficeStorageProps = { readonly wood: Texture; readonly lamp: number };

export function OfficeStorage({ wood }: OfficeStorageProps) {
  return <group name="office-storage">
    <RoyalSystem wood={wood} />
    <UsmLowboard />
  </group>;
}
