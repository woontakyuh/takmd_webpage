import { DeskAccessories } from './DeskAccessories';
import { OfficeChair } from './OfficeChair';
import { OfficeStorage } from './OfficeStorage';
import { PALETTE, ROOM } from './config';
import { Block, Rod } from './Primitives';
import { usePrintedTexture } from './Textures';

export function Furniture({ lamp }: { readonly lamp: number }) {
  const wood = usePrintedTexture('wood');
  const { desk, chair } = ROOM;
  return (
    <group>
      <group position={[...desk.position]} rotation={[0, desk.rotation, 0]}>
        <Block size={[desk.width, 0.055, desk.depth]} position={[0, desk.height, 0]}
          radius={0.018} color={PALETTE.walnut} texture={wood} roughness={0.6} />
        {[-0.79, 0.79].flatMap((x) => [-0.34, 0.34].map((z) => (
          <Rod key={`${x}-${z}`} from={[x, 0.04, z]} to={[x, 0.72, z]}
            radius={0.025} endRadius={0.022} color={PALETTE.ink} metalness={0.6} />
        )))}
        <Rod from={[-0.79, 0.2, -0.34]} to={[0.79, 0.2, -0.34]}
          radius={0.018} color={PALETTE.steel} metalness={0.62} />
        <DeskAccessories />
      </group>
      <group position={[...chair.position]} rotation={[0, chair.rotation, 0]}>
        <OfficeChair />
      </group>
      <OfficeStorage wood={wood} lamp={lamp} />
    </group>
  );
}
