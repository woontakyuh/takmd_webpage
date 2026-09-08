import { Block, Rod } from './Primitives';
import { INTERIOR, PALETTE } from './config';
import { usePrintedTexture } from './Textures';

export const RACK_RAIL_HALF_HEIGHT = 0.015;
const WHITE = '#eeeae2';
const BAYS = [-0.30, 0.30] as const;

export function GarmentRack() {
  const wood = usePrintedTexture('wood');
  return <group name="String System 120cm white and oak wardrobe">
    {[-0.60, 0, 0.60].map(x => <group key={x} name="String 200x30cm wire floor panel">
      {[-0.10, 0.20].map(z => <Rod key={z} from={[x, 0.025, z]} to={[x, 1.99, z]} radius={0.006} color={WHITE} />)}
      {Array.from({ length: 40 }, (_, i) => <Rod key={i} from={[x, 0.05 + i * 0.05, -0.10]} to={[x, 0.05 + i * 0.05, 0.20]} radius={0.0025} color={WHITE} />)}
      {[-0.10, 0.20].map(z => <Block key={z} size={[0.026, 0.018, 0.026]} position={[x, 0.018, z]} color={PALETTE.rubber} radius={0.008} />)}
      {[0.15, 1.85].map(y => <Rod key={y} from={[x, y, 0.20]} to={[x, y, 0.365]} radius={0.005} color={WHITE} />)}
    </group>)}
    {BAYS.map(x => <group key={x} name="String 58cm wardrobe bay">
      <Block size={[0.58, 0.018, 0.30]} position={[x, 1.97, 0.05]} color={INTERIOR.lightWood} texture={wood} radius={0.004} roughness={0.6} />
      {[0.20, 1.65].map(y => <group key={y} name="String white metal shelf with low edge">
        <Block size={[0.58, 0.009, 0.30]} position={[x, y, 0.05]} color={WHITE} radius={0.003} roughness={0.45} />
        {[-0.097, 0.197].map(z => <Block key={z} size={[0.58, 0.018, 0.006]} position={[x, y + 0.008, z]} color={WHITE} radius={0.002} />)}
      </group>)}
      <Rod from={[x - 0.265, 1.485, 0]} to={[x + 0.265, 1.485, 0]} radius={0.012} color={WHITE} />
      {[-0.265, 0.265].map(dx => <Rod key={dx} from={[x + dx, 1.485, 0]} to={[x + dx, 1.64, 0]} radius={0.005} color={WHITE} />)}
    </group>)}
  </group>;
}
