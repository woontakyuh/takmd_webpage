import { INTERIOR, PALETTE, ROOM } from './config';
import { Block } from './Primitives';
import { PalladiomShade } from './PalladiomShade';
import { WindowSky } from './WindowSky';
import type { BlindLift } from '../types';

type WindowBayProps = {
  readonly night: boolean;
  readonly sky: readonly [string, string];
  readonly blindLift: BlindLift;
  readonly reducedMotion: boolean;
};

export function WindowBay({ night, sky, blindLift, reducedMotion }: WindowBayProps) {
  const { leftX, window: opening } = ROOM.architecture;
  const centerY = (opening.bottom + opening.top) / 2;
  const openingHeight = opening.top - opening.bottom;
  return <group name="two-panel-window-bay">
    <WindowSky colors={sky} reducedMotion={reducedMotion} />
    <mesh position={[leftX - 0.025, centerY, opening.centerZ]} rotation={[0, Math.PI / 2, 0]}>
      <planeGeometry args={[opening.width, openingHeight]} />
      <meshPhysicalMaterial color={night ? PALETTE.teal : PALETTE.paperLight} transparent
        opacity={night ? 0.18 : 0.1} roughness={0.14} metalness={0.05} depthWrite={false} />
    </mesh>
    {[-0.5, 0, 0.5].map(fraction => <Block key={fraction}
      size={[0.09, openingHeight + 0.06, 0.045]} position={[leftX + 0.015, centerY, opening.centerZ + opening.width * fraction]}
      color={INTERIOR.bronze} metalness={0.62} roughness={0.44} radius={0.004} />)}
    {[opening.bottom, opening.top].map(y => <Block key={y} size={[0.09, 0.055, opening.width + 0.06]}
      position={[leftX + 0.015, y, opening.centerZ]} color={INTERIOR.bronze} metalness={0.62} roughness={0.44} radius={0.004} />)}
    {([0, 1] as const).map(side => <PalladiomShade key={side}
      centerZ={opening.centerZ + (side === 0 ? 1 : -1) * (opening.width / 4 + 0.047)}
      width={opening.width / 2 + 0.066} bracketSides={side === 0 ? [1] : [-1]}
      leftX={leftX} top={opening.top + 0.16} bottom={opening.bottom - 0.08}
      blindLift={blindLift[side]} />)}
    <Block size={[0.065, 0.105, 0.024]} position={[leftX + 0.12, opening.top + 0.16, opening.centerZ]}
      color={PALETTE.aluminiumEdge} radius={0.01} metalness={0.88} roughness={0.3} />
  </group>;
}
