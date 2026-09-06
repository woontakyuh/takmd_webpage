import type { Texture } from 'three';
import { PALETTE } from './config';
import { Block, Rod } from './Primitives';

const SHELF_LEVELS = [0.08, 0.55, 1.02, 1.49, 1.96, 2.38] as const;
const BOOK_COLORS = [PALETTE.teal, PALETTE.clay, PALETTE.ink, PALETTE.steel, PALETTE.walnut] as const;

type OfficeStorageProps = { readonly wood: Texture; readonly lamp: number };

export function OfficeStorage({ wood, lamp }: OfficeStorageProps) {
  return (
    <group>
      <group position={[-1.46, 0, 1.72]} rotation={[0, Math.PI, 0]}>
        <Block size={[1.18, 2.42, 0.08]} position={[0, 1.21, -0.16]}
          color={PALETTE.walnutDark} texture={wood} radius={0.012} roughness={0.66} />
        {[-0.59, 0.59].map((x) => (
          <Block key={x} size={[0.055, 2.42, 0.38]} position={[x, 1.21, 0]}
            color={PALETTE.walnut} texture={wood} radius={0.014} roughness={0.64} />
        ))}
        {SHELF_LEVELS.map((level) => (
          <Block key={level} size={[1.18, 0.045, 0.4]} position={[0, level, 0]}
            color={PALETTE.walnut} texture={wood} radius={0.01} roughness={0.64} />
        ))}
        <BookRow position={[-0.18, 1.07, 0.07]} count={7} />
        <BookRow position={[-0.28, 1.54, 0.07]} count={6} />
        <BookRow position={[-0.12, 2.01, 0.07]} count={8} />
        <group position={[0, 0.59, 0.08]}>
          <Block size={[0.62, 0.22, 0.28]} position={[0, 0.13, 0]}
            color={PALETTE.paperLight} radius={0.025} roughness={0.76} />
          <Block size={[0.48, 0.045, 0.3]} position={[0, 0.255, -0.01]}
            color={PALETTE.stone} radius={0.012} roughness={0.8} />
          <Block size={[0.32, 0.012, 0.23]} position={[0, 0.285, 0.01]}
            color={PALETTE.paper} radius={0.003} roughness={0.96} />
          <mesh position={[0.2, 0.135, 0.145]}><circleGeometry args={[0.012, 12]} />
            <meshStandardMaterial color={PALETTE.teal} /></mesh>
        </group>
        <group position={[0, 0.1, 0.06]}>
          {[-0.38, -0.13, 0.13, 0.38].map((x, index) => (
            <group key={x} position={[x, 0.17, 0]}>
              <Block size={[0.2, 0.31, 0.27]} color={index % 2 === 0 ? PALETTE.board : PALETTE.linen}
                radius={0.01} roughness={0.88} />
              <Block size={[0.035, 0.12, 0.012]} position={[0, 0.045, 0.145]}
                color={PALETTE.paperLight} radius={0.003} />
            </group>
          ))}
        </group>
      </group>

      <group position={[-1.63, 0, -0.62]}>
        <Block size={[1.18, 0.06, 0.52]} position={[0, 0.65, 0]}
          color={PALETTE.walnut} texture={wood} radius={0.018} roughness={0.6} />
        <Block size={[1.12, 0.53, 0.47]} position={[0, 0.375, 0]}
          color={PALETTE.walnutDark} texture={wood} radius={0.018} roughness={0.68} />
        {[-0.28, 0.28].map((x) => (
          <group key={x} position={[x, 0.39, 0.245]}>
            <Block size={[0.52, 0.45, 0.025]} color={PALETTE.walnut} texture={wood}
              radius={0.012} roughness={0.64} />
            <Block size={[0.12, 0.012, 0.012]} position={[0, 0.11, 0.018]}
              color={PALETTE.steel} radius={0.004} metalness={0.7} />
          </group>
        ))}
        {[-0.48, 0.48].map((x) => (
          <Block key={x} size={[0.045, 0.11, 0.045]} position={[x, 0.07, 0]}
            color={PALETTE.ink} radius={0.008} metalness={0.55} />
        ))}
        <mesh position={[0, 0.69, 0]} castShadow>
          <cylinderGeometry args={[0.16, 0.18, 0.025, 32]} />
          <meshStandardMaterial color={PALETTE.steel} metalness={0.65} roughness={0.42} />
        </mesh>
        <TaskLamp lamp={lamp} />
      </group>
    </group>
  );
}

function BookRow({ position, count }: { readonly position: readonly [number, number, number]; readonly count: number }) {
  return (
    <group position={[...position]}>
      {Array.from({ length: count }, (_, index) => {
        const width = 0.055 + (index % 3) * 0.008;
        const height = 0.3 + (index % 2) * 0.055;
        return (
          <Book key={index} width={width} height={height} position={[index * 0.075, height / 2, 0]}
            rotation={index === count - 1 ? -0.08 : 0} color={BOOK_COLORS[index % BOOK_COLORS.length] ?? PALETTE.ink} />
        );
      })}
    </group>
  );
}

type BookProps = {
  readonly width: number;
  readonly height: number;
  readonly position: readonly [number, number, number];
  readonly rotation: number;
  readonly color: string;
};

function Book({ width, height, position, rotation, color }: BookProps) {
  return (
    <group position={[...position]} rotation={[0, 0, rotation]}>
      <Block size={[width - 0.006, height - 0.018, 0.228]} color={PALETTE.paperLight}
        radius={0.003} roughness={0.92} />
      {[-0.122, 0.122].map((z) => (
        <Block key={z} size={[width, height, 0.012]} position={[0, 0, z]}
          color={color} radius={0.003} roughness={0.68} />
      ))}
      <Block size={[0.008, height, 0.25]} position={[-width / 2, 0, 0]}
        color={color} radius={0.003} roughness={0.7} />
      {[0.18, 0, -0.18].map((ratio) => (
        <Block key={ratio} size={[0.004, 0.008, 0.14]} position={[-width / 2 - 0.005, height * ratio, 0]}
          color={PALETTE.paperLight} radius={0.001} roughness={0.8} />
      ))}
    </group>
  );
}

function TaskLamp({ lamp }: { readonly lamp: number }) {
  return (
    <group position={[0.43, 0.69, -0.04]}>
      <mesh castShadow><cylinderGeometry args={[0.09, 0.1, 0.022, 28]} />
        <meshStandardMaterial color={PALETTE.ink} metalness={0.62} roughness={0.36} /></mesh>
      <Rod from={[0, 0.015, 0]} to={[0.03, 0.34, 0]} radius={0.011} color={PALETTE.ink} metalness={0.68} />
      <Rod from={[0.03, 0.34, 0]} to={[-0.1, 0.49, 0.07]} radius={0.011} color={PALETTE.ink} metalness={0.68} />
      <group position={[-0.13, 0.5, 0.09]} rotation={[0.14, 0, -0.45]}>
        <mesh castShadow><coneGeometry args={[0.105, 0.14, 28, 1, true]} />
          <meshStandardMaterial color={PALETTE.clay} roughness={0.42} metalness={0.08} side={2} /></mesh>
        <pointLight position={[0, -0.09, 0]} intensity={0.04 + lamp * 1.1} distance={2.2} color={PALETTE.sun} />
      </group>
    </group>
  );
}
