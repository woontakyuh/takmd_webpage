import type { Texture } from 'three';
import { INTERIOR, PALETTE, ROOM } from './config';
import { useInteriorMaterial } from './InteriorMaterials';
import { Block } from './Primitives';

const BAY_X = [-1.85, 1.85] as const;
const SHELVES = [1.28, 1.72, 2.16, 2.6] as const;
const BOOK_COLORS = [INTERIOR.bronze, INTERIOR.oakShadow, PALETTE.muted, INTERIOR.sand, PALETTE.teal] as const;

type OfficeStorageProps = { readonly wood: Texture; readonly lamp: number };
type Material = ReturnType<typeof useInteriorMaterial>;

export function OfficeStorage({ lamp }: OfficeStorageProps) {
  const oak = useInteriorMaterial('oak', [1.3, 3.2]);
  const stone = useInteriorMaterial('stone', [2, 2]);

  return <group>
    {BAY_X.map((x, bayIndex) => <CabinetBay key={x} x={x} lamp={lamp} bayIndex={bayIndex} oak={oak} stone={stone} />)}
    <Credenza oak={oak} />
  </group>;
}

type CabinetBayProps = {
  readonly x: number; readonly lamp: number; readonly bayIndex: number;
  readonly oak: Material; readonly stone: Material;
};

function CabinetBay({ x, lamp, bayIndex, oak, stone }: CabinetBayProps) {
  return <group position={[x, 0, 3.06]}>
    <Block size={[0.91, 0.08, 0.34]} position={[0, 0.04, 0.035]}
      color={INTERIOR.oakShadow} material={oak} radius={0.012} roughness={0.72} />
    <Block size={[1.05, 2.54, 0.055]} position={[0, 1.35, 0.205]}
      color={INTERIOR.ivory} material={oak} radius={0.008} roughness={0.72} />
    {[-0.5, 0.5].map((side) => <Block key={side} size={[0.05, 2.54, 0.48]} position={[side, 1.35, 0]}
      color={PALETTE.white} material={oak} radius={0.012} roughness={0.66} />)}
    <Block size={[1.05, 0.055, 0.48]} position={[0, 2.592, 0]}
      color={PALETTE.white} material={oak} radius={0.012} roughness={0.64} />

    <Block size={[0.96, 0.69, 0.43]} position={[0, 0.435, 0.005]}
      color={PALETTE.white} material={oak} radius={0.012} roughness={0.68} />
    {[-0.237, 0.237].map((doorX) => <group key={doorX} position={[doorX, 0.44, -0.222]}>
      <Block size={[0.458, 0.65, 0.026]} color={PALETTE.white} material={oak} radius={0.009} roughness={0.66} />
      <Block size={[0.008, 0.19, 0.012]} position={[doorX < 0 ? 0.18 : -0.18, 0.06, -0.019]}
        color={INTERIOR.bronze} radius={0.003} roughness={0.36} metalness={0.55} />
    </group>)}
    <Block size={[1, 0.055, 0.5]} position={[0, 0.795, -0.005]}
      color={PALETTE.white} material={oak} radius={0.012} roughness={0.62} />

    {SHELVES.map((level) => <group key={level}>
      <Block size={[0.98, 0.045, 0.45]} position={[0, level, -0.005]}
        color={PALETTE.white} material={oak} radius={0.009} roughness={0.64} />
      <mesh position={[0, level - 0.031, -0.215]}>
        <boxGeometry args={[0.82, 0.012, 0.014]} />
        <meshStandardMaterial color={PALETTE.sun} emissive={PALETTE.sun}
          emissiveIntensity={0.18 + lamp * 0.75} roughness={0.72} />
      </mesh>
      <pointLight position={[0, level - 0.12, -0.12]} intensity={0.025 + lamp * 0.32}
        distance={0.72} decay={2} color={PALETTE.sun} />
    </group>)}
    <ShelfObjects bayIndex={bayIndex} stone={stone} />
  </group>;
}

function ShelfObjects({ bayIndex, stone }: { readonly bayIndex: number; readonly stone: Material }) {
  const rows = bayIndex === 0
    ? [{ y: 0.83, x: -0.38, count: 5 }, { y: 1.31, x: 0.02, count: 7 }, { y: 2.19, x: -0.42, count: 4 }]
    : [{ y: 0.83, x: 0.02, count: 6 }, { y: 1.75, x: -0.4, count: 5 }, { y: 2.19, x: -0.08, count: 4 }];
  return <>
    {rows.map((row, rowIndex) => <BookCluster key={`${row.y}-${row.x}`} position={[row.x, row.y + 0.025, -0.105]}
      count={row.count} seed={rowIndex + bayIndex * 2} />)}
    <Ceramic position={[bayIndex === 0 ? 0.27 : -0.28, bayIndex === 0 ? 1.84 : 0.94, -0.1]}
      scale={bayIndex === 0 ? 0.82 : 1} stone={stone} />
    <Ceramic position={[bayIndex === 0 ? -0.22 : 0.27, 2.27, -0.1]}
      scale={0.65} stone={stone} />
    <group position={[bayIndex === 0 ? 0.02 : -0.37, 1.785, -0.11]} rotation={[0, 0, bayIndex === 0 ? -0.04 : 0.03]}>
      {[0, 0.045, 0.09].map((y, index) => <Block key={y} size={[0.32 - index * 0.025, 0.035, 0.22]}
        position={[0, y, 0]} color={index === 1 ? INTERIOR.sand : INTERIOR.ivory} radius={0.004} roughness={0.92} />)}
    </group>
  </>;
}

function BookCluster({ position, count, seed }: {
  readonly position: readonly [number, number, number]; readonly count: number; readonly seed: number;
}) {
  return <group position={[...position]}>{Array.from({ length: count }, (_, index) => {
    const width = 0.042 + ((index + seed) % 3) * 0.012;
    const height = 0.225 + ((index * 2 + seed) % 4) * 0.035;
    return <Block key={index} size={[width, height, 0.19]}
      position={[index * 0.062 + width / 2, height / 2, 0]}
      rotation={[0, 0, index === count - 1 && count < 6 ? -0.12 : 0]}
      color={BOOK_COLORS[(index + seed) % BOOK_COLORS.length] ?? INTERIOR.bronze}
      radius={0.004} roughness={0.82} />;
  })}</group>;
}

function Ceramic({ position, scale, stone }: {
  readonly position: readonly [number, number, number]; readonly scale: number; readonly stone: Material;
}) {
  return <group position={[...position]} scale={scale}>
    <mesh castShadow receiveShadow><sphereGeometry args={[0.115, 28, 20]} />
      <meshStandardMaterial {...stone} color={INTERIOR.stone} roughness={0.82} /></mesh>
    <mesh position={[0, 0.1, 0]} castShadow><cylinderGeometry args={[0.052, 0.066, 0.08, 28]} />
      <meshStandardMaterial {...stone} color={INTERIOR.stone} roughness={0.82} /></mesh>
  </group>;
}

function Credenza({ oak }: { readonly oak: Material }) {
  const doorZ = [-1.2, -0.4, 0.4, 1.2] as const;
  return <group position={[...ROOM.credenza.position]}>
    <Block size={[ROOM.credenza.depth - 0.08, 0.08, ROOM.credenza.width - 0.16]} position={[-0.015, 0.04, 0]}
      color={INTERIOR.oakShadow} material={oak} radius={0.01} roughness={0.72} />
    <Block size={[ROOM.credenza.depth, 0.61, ROOM.credenza.width]} position={[0, 0.385, 0]}
      color={PALETTE.white} material={oak} radius={0.016} roughness={0.68} />
    {doorZ.map((z) => <group key={z} position={[ROOM.credenza.depth / 2 + 0.014, 0.4, z]}>
      <Block size={[0.026, 0.56, 0.766]} color={PALETTE.white} material={oak} radius={0.009} roughness={0.66} />
      <Block size={[0.012, 0.16, 0.009]} position={[0.02, 0.04, z < 0 ? 0.31 : -0.31]}
        color={INTERIOR.bronze} radius={0.003} roughness={0.36} metalness={0.55} />
    </group>)}
    <Block size={[ROOM.credenza.depth + 0.04, 0.055, ROOM.credenza.width + 0.04]}
      position={[0.01, ROOM.credenza.height - 0.027, 0]} color={PALETTE.white}
      material={oak} radius={0.014} roughness={0.62} />

  </group>;
}
