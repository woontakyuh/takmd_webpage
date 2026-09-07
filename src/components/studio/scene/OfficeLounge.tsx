import { INTERIOR, PALETTE } from './config';
import { useInteriorMaterial } from './InteriorMaterials';
import { Block, Rod } from './Primitives';

const SOFA_POSITION = [2, 0, 1.1] as const;
const TABLE_POSITION = [0.9, 0, 1.1] as const;
const CHAIR_POSITION = [0.15, 0, 2.05] as const;
const RUG_POSITION = [0.1, 0.018, 0.1] as const;

type Material = ReturnType<typeof useInteriorMaterial>;

export function OfficeLounge() {
  const linen = useInteriorMaterial('linen', [7, 9]);
  const stone = useInteriorMaterial('stone', [1.5, 1]);
  const oak = useInteriorMaterial('oak', [1.4, 1.4]);
  return <group>
    <WovenRug linen={linen} />
    <Sofa linen={linen} oak={oak} />
    <CoffeeTable stone={stone} />
    <LoungeChair linen={linen} oak={oak} />
  </group>;
}

function WovenRug({ linen }: { readonly linen: Material }) {
  return <group position={[...RUG_POSITION]}>
    <Block size={[4.25, 0.02, 5.5]} color={INTERIOR.sand} material={linen} radius={0.055} roughness={0.98} />
    <Block size={[4.12, 0.007, 5.37]} position={[0, 0.0135, 0]}
      color={INTERIOR.upholstery} material={linen} radius={0.045} roughness={1} />
    {[-2.08, 2.08].map((x) => <Block key={x} size={[0.025, 0.01, 5.34]} position={[x, 0.016, 0]}
      color={INTERIOR.oakLight} radius={0.006} roughness={0.94} />)}
    {[-2.7, 2.7].map((z) => <Block key={z} size={[4.12, 0.01, 0.025]} position={[0, 0.016, z]}
      color={INTERIOR.oakLight} radius={0.006} roughness={0.94} />)}
  </group>;
}

function Sofa({ linen, oak }: { readonly linen: Material; readonly oak: Material }) {
  return <group position={[...SOFA_POSITION]}>
    {[-0.23, 0.23].flatMap(x => [-0.75, 0.75].map(z => <Block key={`${x}-${z}`}
      size={[0.055, 0.078, 0.07]} position={[x, 0.075, z]} color={INTERIOR.bronze} radius={0.008} />))}
    <Block size={[0.72, 0.095, 1.82]} position={[0.04, 0.16, 0]}
      color={INTERIOR.oakShadow} material={oak} radius={0.035} roughness={0.66} />
    <Block size={[0.78, 0.11, 1.9]} position={[0.03, 0.245, 0]}
      color={PALETTE.white} material={linen} radius={0.055} roughness={0.96} />
    {[-0.48, 0.48].map((z) => <group key={z} position={[-0.12, 0.39, z]}>
      <Block size={[0.61, 0.2, 0.9]} color={PALETTE.white} material={linen} radius={0.085} roughness={0.98} />
      <SeatPiping />
    </group>)}
    {[-0.47, 0.47].map((z) => <group key={z} position={[0.27, 0.72, z]} rotation={[0, 0, -0.08]}>
      <Block size={[0.23, 0.56, 0.88]} color={PALETTE.white} material={linen} radius={0.09} roughness={0.98} />
      <BackPiping />
    </group>)}
    {[-0.965, 0.965].map((z) => <group key={z} position={[0.03, 0.54, z]}>
      <Block size={[0.75, 0.42, 0.14]} color={PALETTE.white} material={linen} radius={0.065} roughness={0.98} />
      <Block size={[0.58, 0.026, 0.012]} position={[-0.03, 0.08, -Math.sign(z) * 0.076]}
        color={INTERIOR.sand} radius={0.004} roughness={1} />
    </group>)}
  </group>;
}

function CoffeeTable({ stone }: { readonly stone: Material }) {
  return <group position={[...TABLE_POSITION]}>
    <mesh position={[0, 0.19, 0]} castShadow receiveShadow><cylinderGeometry args={[0.26, 0.34, 0.3, 48]} />
      <meshStandardMaterial color={INTERIOR.stone} normalMap={stone.normalMap} normalScale={stone.normalScale}
        roughnessMap={null} roughness={0.9} /></mesh>
    <mesh position={[0, 0.36, 0]} scale={[0.52, 1, 0.36]} castShadow receiveShadow>
      <cylinderGeometry args={[1, 1, 0.075, 64]} />
      <meshStandardMaterial color={INTERIOR.stone} normalMap={stone.normalMap} normalScale={stone.normalScale}
        roughnessMap={null} roughness={0.9} />
    </mesh>
    <mesh position={[-0.1, 0.402, 0.02]} scale={[0.13, 1, 0.1]} receiveShadow>
      <cylinderGeometry args={[1, 1, 0.008, 40]} />
      <meshStandardMaterial color={INTERIOR.ivory} roughness={0.86} />
    </mesh>
  </group>;
}

function LoungeChair({ linen, oak }: { readonly linen: Material; readonly oak: Material }) {
  return <group position={[...CHAIR_POSITION]} rotation={[0, -0.65, 0]}>
    <mesh position={[0, 0.075, 0]} castShadow><cylinderGeometry args={[0.13, 0.19, 0.08, 32]} />
      <meshStandardMaterial color={INTERIOR.bronze} metalness={0.25} roughness={0.48} /></mesh>
    {[-0.2, 0.2].map((x) => <Rod key={x} from={[0, 0.08, 0]} to={[x, 0.28, 0]}
      radius={0.024} endRadius={0.018} color={INTERIOR.bronze} metalness={0.38} />)}
    <Block size={[0.68, 0.14, 0.66]} position={[0, 0.34, -0.02]}
      color={INTERIOR.oakShadow} material={oak} radius={0.075} roughness={0.68} />
    <Block size={[0.61, 0.17, 0.57]} position={[0, 0.44, -0.07]}
      color={PALETTE.white} material={linen} radius={0.085} roughness={0.98} />
    <Block size={[0.64, 0.56, 0.18]} position={[0, 0.71, 0.26]} rotation={[-0.12, 0, 0]}
      color={PALETTE.white} material={linen} radius={0.09} roughness={0.98} />
    {[-0.315, 0.315].map((x) => <Block key={x} size={[0.13, 0.37, 0.52]} position={[x, 0.57, 0.02]}
      rotation={[0, 0, x < 0 ? -0.08 : 0.08]} color={PALETTE.white}
      material={linen} radius={0.065} roughness={0.98} />)}
  </group>;
}

function SeatPiping() {
  return <>
    {[-0.39, 0.39].map((z) => <Rod key={z} from={[-0.255, 0.105, z]} to={[0.255, 0.105, z]}
      radius={0.006} color={INTERIOR.upholstery} />)}
    {[-0.255, 0.255].map((x) => <Rod key={x} from={[x, 0.105, -0.39]} to={[x, 0.105, 0.39]}
      radius={0.006} color={INTERIOR.upholstery} />)}
  </>;
}

function BackPiping() {
  return <>
    {[-0.39, 0.39].map((z) => <Rod key={z} from={[-0.12, -0.22, z]} to={[-0.12, 0.22, z]}
      radius={0.006} color={INTERIOR.upholstery} />)}
    {[-0.22, 0.22].map((y) => <Rod key={y} from={[-0.12, y, -0.39]} to={[-0.12, y, 0.39]}
      radius={0.006} color={INTERIOR.upholstery} />)}
  </>;
}
