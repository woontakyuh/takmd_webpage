import { BufferGeometry, DoubleSide, Float32BufferAttribute, Vector2 } from 'three';
import { PALETTE, ROOM } from './config';
import { Rod } from './Primitives';

const POT_PROFILE = [new Vector2(0.19, 0), new Vector2(0.23, 0.035), new Vector2(0.29, 0.4), new Vector2(0.27, 0.48), new Vector2(0.24, 0.49)];
const BRANCHES = [
  { start: [-0.01, 0.76, 0], end: [-0.34, 1.48, 0.04], turn: -0.5 },
  { start: [0.01, 0.88, 0], end: [0.26, 1.68, -0.05], turn: 0.7 },
  { start: [0.02, 1.04, 0], end: [0.09, 1.94, 0.08], turn: -0.15 },
  { start: [0, 0.72, 0.02], end: [-0.2, 1.2, 0.25], turn: 1.05 },
  { start: [0.02, 0.82, 0.01], end: [0.36, 1.31, 0.16], turn: -0.9 },
] as const;

const LEAF_GEOMETRY = createLeafGeometry();

export function Greenery() {
  return (
    <group position={[...ROOM.plant.position]} scale={0.72}>
      <mesh castShadow receiveShadow><latheGeometry args={[POT_PROFILE, 40]} /><meshStandardMaterial color={PALETTE.clay} roughness={0.9} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.465, 0]}><circleGeometry args={[0.243, 32]} /><meshStandardMaterial color={PALETTE.walnutDark} /></mesh>
      <Rod from={[0, 0.45, 0]} to={[0.025, 1.78, 0]} radius={0.025} endRadius={0.009} color={PALETTE.walnutDark} />
      {BRANCHES.map(({ start, end, turn }, index) => (
        <group key={index}>
          <Rod from={start} to={end} radius={0.012} endRadius={0.0035} color={PALETTE.walnutDark} />
          {Array.from({ length: 6 }, (_, leaf) => {
            const progress = 0.32 + leaf * 0.13;
            const side = leaf % 2 === 0 ? -1 : 1;
            const base = [
              start[0] + (end[0] - start[0]) * progress,
              start[1] + (end[1] - start[1]) * progress,
              start[2] + (end[2] - start[2]) * progress,
            ] as const;
            const tip = [base[0] + side * 0.12, base[1] + 0.06, base[2] + side * 0.045] as const;
            return (
              <group key={leaf}>
                <Rod from={base} to={tip} radius={0.0035} endRadius={0.0015} color={PALETTE.walnutDark} />
                <Leaf position={tip} rotation={[0.18 + leaf * 0.07, turn + side * 0.72, side * 0.78]} light={leaf % 3 === 0} />
              </group>
            );
          })}
          <Leaf position={end} rotation={[0.08, turn, 0.18]} light={index % 2 === 0} />
        </group>
      ))}
    </group>
  );
}

type LeafProps = {
  readonly position: readonly [number, number, number];
  readonly rotation: readonly [number, number, number];
  readonly light: boolean;
};

function Leaf({ position, rotation, light }: LeafProps) {
  return (
    <mesh geometry={LEAF_GEOMETRY} position={[...position]} rotation={[...rotation]} castShadow receiveShadow>
      <meshStandardMaterial color={light ? PALETTE.tealLight : PALETTE.teal}
        roughness={0.7} side={DoubleSide} />
    </mesh>
  );
}

function createLeafGeometry() {
  const geometry = new BufferGeometry();
  const sections = [
    { y: 0, width: 0, curve: 0 },
    { y: 0.055, width: 0.035, curve: 0.004 },
    { y: 0.13, width: 0.05, curve: 0.014 },
    { y: 0.205, width: 0.033, curve: 0.025 },
    { y: 0.27, width: 0, curve: 0.034 },
  ] as const;
  const positions = sections.flatMap(({ y, width, curve }) => [-width, y, curve, width, y, curve]);
  const indices = sections.slice(0, -1).flatMap((_, index) => {
    const left = index * 2;
    return [left, left + 1, left + 2, left + 1, left + 3, left + 2];
  });
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
