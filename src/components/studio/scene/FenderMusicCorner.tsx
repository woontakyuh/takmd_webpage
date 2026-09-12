import { DeluxeReverb } from './DeluxeReverb';
import { FenderStrat } from './FenderStrat';
import { proposalMemory } from '../proposalMemory';
import { ProposalMemoryFrame } from './ProposalMemoryFrame';

export const FENDER_MUSIC_CORNER_BOUNDS = {
  min: [-0.19, 0, -0.13],
  max: [0.962, 1.112, 0.16],
} as const;

export function FenderMusicCorner({ reducedMotion = false }: { readonly reducedMotion?: boolean }) {
  return <group name="Fender music corner" userData={{ front: '+Z', floorY: 0 }}>
    <group position={[0, -0.006582, 0]}><FenderStrat /></group>
    <group position={[0.65, 0, 0.005]} rotation={[0, -0.035, 0]}>
      <DeluxeReverb />
      <ProposalMemoryFrame {...proposalMemory} reducedMotion={reducedMotion} />
    </group>
  </group>;
}
