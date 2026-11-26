import { Block } from './Primitives';
import { PALETTE } from './config';

type FolioStackProps = {
  readonly thickness: number;
  readonly centerX: number;
  readonly baseY: number;
  readonly underside?: boolean;
};

export function FolioStack({ thickness, centerX, baseY, underside = false }: FolioStackProps) {
  if (thickness <= 0) return null;
  const direction = underside ? -1 : 1;
  return <group name={underside ? 'Folio left stack' : 'Folio right stack'} position={[centerX, baseY + direction * thickness / 2, 0]} scale={[1, thickness, 1]}>
    <Block size={[0.97, 1, 1.29]} color={PALETTE.paperLight} radius={0.001} roughness={0.96} />
    {[-0.3, -0.1, 0.1, 0.3].map(y => <Block key={y} size={[0.971, 0.012, 1.291]} position={[0, y, 0]} color={PALETTE.line} radius={0.0004} roughness={0.96} />)}
  </group>;
}
