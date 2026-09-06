import type { Texture } from 'three';
import { PALETTE } from './config';
import { Block, Rod } from './Primitives';
import { usePrintedTexture } from './Textures';

const SOFA_POSITION = [0.9, 0, 1.4] as const;
const TABLE_POSITION = [1.15, 0, 0.5] as const;
const SOFA_LEG_OFFSETS = [
  [-0.22, -0.62],
  [-0.22, 0.62],
  [0.2, -0.62],
  [0.2, 0.62],
] as const;
const TABLE_LEG_OFFSETS = [
  [-0.2, -0.28],
  [-0.2, 0.28],
  [0.2, -0.28],
  [0.2, 0.28],
] as const;

export function OfficeLounge() {
  const linen = usePrintedTexture('linen');
  const wood = usePrintedTexture('wood');

  return (
    <group>
      <Sofa linen={linen} />
      <CoffeeTable wood={wood} linen={linen} />
    </group>
  );
}

function Sofa({ linen }: { readonly linen: Texture }) {
  return (
    <group position={[...SOFA_POSITION]} rotation={[0, -Math.PI / 2, 0]}>
      <Block size={[0.57, 0.13, 1.46]} position={[-0.04, 0.255, 0]}
        color={PALETTE.ink} radius={0.018} roughness={0.66} />
      {SOFA_LEG_OFFSETS.map(([x, z]) => (
        <Rod key={`${x}-${z}`} from={[x, 0.045, z]} to={[x * 0.88, 0.21, z * 0.94]}
          radius={0.018} endRadius={0.014} color={PALETTE.ink} metalness={0.58} />
      ))}

      <Block size={[0.56, 0.13, 1.38]} position={[-0.055, 0.345, 0]}
        color={PALETTE.linen} texture={linen} radius={0.025} roughness={0.97} />
      {[-0.35, 0.35].map((z) => (
        <Block key={z} size={[0.43, 0.004, 0.008]} position={[-0.055, 0.413, z]}
          color={PALETTE.tealLight} radius={0.002} roughness={0.88} />
      ))}

      <Block size={[0.11, 0.38, 1.55]} position={[0.285, 0.59, 0]}
        color={PALETTE.linen} texture={linen} radius={0.025} roughness={0.97} />
      <Block size={[0.055, 0.3, 1.32]} position={[0.215, 0.59, 0]}
        color={PALETTE.teal} radius={0.018} roughness={0.91} />
      {[-0.35, 0.35].map((z) => (
        <Block key={z} size={[0.006, 0.28, 0.012]} position={[0.182, 0.59, z]}
          color={PALETTE.tealLight} radius={0.002} roughness={0.84} />
      ))}

      {[-0.715, 0.715].map((z) => (
        <Block key={z} size={[0.57, 0.22, 0.12]} position={[-0.025, 0.515, z]}
          color={PALETTE.linen} texture={linen} radius={0.025} roughness={0.97} />
      ))}
    </group>
  );
}

type CoffeeTableProps = {
  readonly linen: Texture;
  readonly wood: Texture;
};

function CoffeeTable({ wood, linen }: CoffeeTableProps) {
  return (
    <group position={[...TABLE_POSITION]} rotation={[0, Math.PI / 2, 0]}>
      {TABLE_LEG_OFFSETS.map(([x, z]) => (
        <Rod key={`${x}-${z}`} from={[x, 0.04, z]} to={[x * 0.78, 0.325, z * 0.76]}
          radius={0.015} endRadius={0.011} color={PALETTE.ink} metalness={0.62} />
      ))}
      <mesh position={[0, 0.3375, 0]} scale={[0.31, 1, 0.42]} castShadow receiveShadow>
        <cylinderGeometry args={[1, 1, 0.045, 48]} />
        <meshStandardMaterial color={PALETTE.walnut} map={wood} roughness={0.61} />
      </mesh>
      <Block size={[0.245, 0.019, 0.155]} position={[-0.035, 0.37, 0.07]}
        rotation={[0, 0.28, 0]} color={PALETTE.paperLight} radius={0.005} roughness={0.94} />
      <Block size={[0.25, 0.006, 0.16]} position={[-0.035, 0.383, 0.07]}
        rotation={[0, 0.28, 0]} color={PALETTE.linen} texture={linen} radius={0.004} roughness={0.94} />
    </group>
  );
}
