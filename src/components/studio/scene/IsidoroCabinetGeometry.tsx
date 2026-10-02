import { useEffect, useMemo, type ReactNode, type RefObject } from 'react';
import { useTexture } from '@react-three/drei';
import { CatmullRomCurve3, RepeatWrapping, Vector2, Vector3 } from 'three';
import type { Group, Texture } from 'three';
import { INTERIOR, PALETTE } from './config';
import { Block, Rod } from './Primitives';
import { IsidoroFixedHardware, IsidoroMovingHasps } from './IsidoroHardware';
import { IsidoroDrawerStorage, IsidoroLowerBottleStorage } from './IsidoroStorage';
import {
  ISIDORO_BOTTLE_DECK_TOP,
  ISIDORO_BOTTLE_SHELF_HEIGHT,
  ISIDORO_DIMENSIONS,
  ISIDORO_FIXED_HALF_OFFSET_Z,
  ISIDORO_WORKTOP_HEIGHT,
  ISIDORO_SHELF_THICKNESS,
  ISIDORO_UPPER_SHELF_HEIGHT,
} from './WhiskyCabinetLayout';

const HALF_DEPTH = ISIDORO_DIMENSIONS.depth / 2;
const PANEL = 0.025;
const LEATHER = '#A69583';
const FABRIC = INTERIOR.sand;
const CHROME = PALETTE.aluminiumEdge;

type HalfProps = {
  readonly interiorSide: -1 | 1;
  readonly interior: RefObject<Group | null>;
  readonly moving?: boolean;
  readonly wood: Texture;
  readonly storage?: ReactNode;
  readonly children?: ReactNode;
};

function ChromeRail({ y, interiorSide }: { readonly y: number; readonly interiorSide: -1 | 1 }) {
  const z = interiorSide * (HALF_DEPTH / 2 + 0.006);
  return <group name="miniature chrome guardrail">
    <Rod from={[-0.302, y, z]} to={[0.302, y, z]} radius={0.0018} color={CHROME} metalness={0.96} />
    {[-0.302, 0.302].map(x => <group key={x}>
      <Rod from={[x, y - 0.02, z]} to={[x, y - 0.004, z]} radius={0.0016} color={CHROME} metalness={0.96} />
      <Rod from={[x, y - 0.004, z]} to={[x - Math.sign(x) * 0.007, y, z]}
        radius={0.0018} color={CHROME} metalness={0.96} />
    </group>)}
  </group>;
}

function useLeatherGrain() {
  const [normal, roughness] = useTexture(['/textures/isidoro/leather-normal.webp', '/textures/isidoro/leather-roughness.webp']);
  const maps = useMemo(() => [normal, roughness].map(source => {
    const map = source.clone();
    map.wrapS = map.wrapT = RepeatWrapping;
    map.repeat.set(2.3, 3.7);
    map.anisotropy = 4;
    return map;
  }), [normal, roughness]);
  useEffect(() => () => maps.forEach(map => map.dispose()), [maps]);
  return { normalMap: maps[0], roughnessMap: maps[1], normalScale: new Vector2(0.2, 0.2) };
}

function LeatherSeam({ z }: { readonly z: number }) {
  const curve = useMemo(() => {
    const points: Vector3[] = [];
    for (let corner = 0; corner < 4; corner++) {
      const angle = corner * Math.PI / 2;
      const cx = corner === 0 || corner === 3 ? 0.317 : -0.317;
      const cy = corner < 2 ? 1.105 : 0.085;
      for (let step = 0; step <= 8; step++) {
        const t = angle + step / 8 * Math.PI / 2;
        points.push(new Vector3(cx + Math.cos(t) * 0.016, cy + Math.sin(t) * 0.016, z));
      }
    }
    return new CatmullRomCurve3(points, true);
  }, [z]);
  return <mesh name="fine leather perimeter seam">
    <tubeGeometry args={[curve, 96, 0.00085, 5, true]} />
    <meshStandardMaterial color="#82715f" roughness={0.84} />
  </mesh>;
}

function HalfShell({ interiorSide, interior, moving = false, wood, storage, children }: HalfProps) {
  const outsideZ = -interiorSide * (HALF_DEPTH / 2 - PANEL / 2);
  const leather = useLeatherGrain();
  return <group name={moving ? 'opening leather trunk half' : 'fixed leather trunk half'}>
    <Block size={[ISIDORO_DIMENSIONS.width, ISIDORO_DIMENSIONS.height - 0.04, PANEL]}
      position={[0, 0.595, outsideZ]} color={LEATHER} radius={0.022} roughness={0.83} material={leather} />
    {[-1, 1].map(side => <Block key={side} size={[PANEL, ISIDORO_DIMENSIONS.height - 0.07, HALF_DEPTH]}
      position={[side * (ISIDORO_DIMENSIONS.width - PANEL) / 2, 0.595, 0]}
      color={LEATHER} radius={0.018} roughness={0.83} material={leather} />)}
    <Block size={[ISIDORO_DIMENSIONS.width, PANEL, HALF_DEPTH]} position={[0, 1.1575, 0]}
      color={LEATHER} radius={0.018} roughness={0.83} material={leather} />
    <Block size={[ISIDORO_DIMENSIONS.width, PANEL, HALF_DEPTH]} position={[0, 0.0475, 0]}
      color={LEATHER} radius={0.014} roughness={0.83} material={leather} />
    <group ref={interior} name="Isidoro enclosed structural interior" visible={false}>
    <Block size={[ISIDORO_DIMENSIONS.width - 0.055, ISIDORO_DIMENSIONS.height - 0.095, 0.012]}
      position={[0, 0.59, outsideZ + interiorSide * 0.019]} color={FABRIC} radius={0.015} roughness={0.94} />
    <Block size={[0.64, 0.018, HALF_DEPTH - 0.035]}
      position={[0, ISIDORO_BOTTLE_DECK_TOP - 0.009, 0]}
      color={PALETTE.walnut} texture={wood} radius={0.003} roughness={0.52} />
    {(moving ? [ISIDORO_BOTTLE_SHELF_HEIGHT, ISIDORO_UPPER_SHELF_HEIGHT] : [ISIDORO_WORKTOP_HEIGHT, ISIDORO_UPPER_SHELF_HEIGHT]).map(y => <group key={y} name={`Canaletto walnut shelf ${y}`}>
      <Block size={[0.64, ISIDORO_SHELF_THICKNESS, HALF_DEPTH - 0.035]} position={[0, y, 0]}
        color={PALETTE.walnut} texture={wood} radius={0.0025} roughness={0.5} />
      {(moving || y === ISIDORO_UPPER_SHELF_HEIGHT) && <ChromeRail y={y + 0.027} interiorSide={interiorSide} />}
    </group>)}
    {!moving && <IsidoroDrawerStorage wood={wood} />}
    {storage}
    </group>
    <LeatherSeam z={-interiorSide * (HALF_DEPTH / 2 + 0.0009)} />
    {moving ? <IsidoroMovingHasps /> : <IsidoroFixedHardware leather={leather} />}
    {children}
    <group name={moving ? 'swivel castors' : 'fixed feet'}>
      {[-0.29, 0.29].map(x => <group key={x} position={[x, 0.022, outsideZ]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.018, 0.018, 0.018, 16]} />
          <meshStandardMaterial color={PALETTE.rubber} roughness={0.72} />
        </mesh>
        {moving && <Rod from={[0, 0.014, 0]} to={[0, 0.035, 0]} radius={0.004}
          color={CHROME} metalness={0.88} />}
      </group>)}
    </group>
  </group>;
}

export function IsidoroFixedHalf({ wood, interior, children }: {
  readonly wood: Texture; readonly interior: RefObject<Group | null>; readonly children: ReactNode;
}) {
  return <group position={[0, 0, ISIDORO_FIXED_HALF_OFFSET_Z]}>
    <HalfShell interiorSide={-1} interior={interior} wood={wood}>{children}</HalfShell>
  </group>;
}

export function IsidoroOpeningHalf({ wood, interior, children, worktop }: {
  readonly wood: Texture;
  readonly interior: RefObject<Group | null>;
  readonly children: ReactNode;
  readonly worktop: RefObject<Group | null>;
}) {
  return <group position={[ISIDORO_DIMENSIONS.width / 2, 0, -HALF_DEPTH / 2]}>
    <HalfShell interiorSide={1} interior={interior} moving wood={wood}
      storage={<IsidoroLowerBottleStorage wood={wood} worktop={worktop} />}>
      <group name="bottle collection with unmirrored labels" scale={[-1, 1, 1]}>{children}</group>
    </HalfShell>
  </group>;
}
