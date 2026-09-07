import { LoungeSofa } from './LoungeSofa';
import { EamesLounge } from './EamesLounge';
import { NoguchiTable } from './NoguchiTable';
import { INTERIOR } from './config';
import { useInteriorMaterial } from './InteriorMaterials';
import { Block } from './Primitives';

const TABLE_POSITION = [0.78, 0.035, 1.08] as const;
const RUG_POSITION = [0.1, 0.018, 0.1] as const;

type Material = ReturnType<typeof useInteriorMaterial>;

export function OfficeLounge() {
  const linen = useInteriorMaterial('linen', [7, 9]);
  return <group>
    <WovenRug linen={linen} />
    <LoungeSofa />
    <NoguchiTable position={[...TABLE_POSITION]} rotation={[0, Math.PI / 2, 0]} />
    <EamesLounge />
  </group>;
}

function WovenRug({ linen }: { readonly linen: Material }) {
  return <group position={[...RUG_POSITION]}>
    <Block size={[4.9, 0.02, 5.5]} color={INTERIOR.sand} material={linen} radius={0.055} roughness={0.98} />
    <Block size={[4.77, 0.007, 5.37]} position={[0, 0.0135, 0]}
      color={INTERIOR.upholstery} material={linen} radius={0.045} roughness={1} />
    {[-2.405, 2.405].map((x) => <Block key={x} size={[0.025, 0.01, 5.34]} position={[x, 0.016, 0]}
      color={INTERIOR.oakLight} radius={0.006} roughness={0.94} />)}
    {[-2.7, 2.7].map((z) => <Block key={z} size={[4.77, 0.01, 0.025]} position={[0, 0.016, z]}
      color={INTERIOR.oakLight} radius={0.006} roughness={0.94} />)}
  </group>;
}
