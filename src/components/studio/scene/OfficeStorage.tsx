import type { Texture } from 'three';
import { BeosoundTheatre } from './BeosoundTheatre';
import { RoyalSystem } from './RoyalSystem';
import { UsmLowboard } from './UsmLowboard';

type OfficeStorageProps = { readonly wood: Texture; readonly lamp: number };

export function OfficeStorage({ wood }: OfficeStorageProps) {
  return <group name="office-storage">
    <RoyalSystem wood={wood} />
    <UsmLowboard />
    <group name="Beosound Theatre shelf display" position={[0, 0.82, 3.111]} rotation={[0, Math.PI, 0]}>
      <BeosoundTheatre />
    </group>
  </group>;
}
