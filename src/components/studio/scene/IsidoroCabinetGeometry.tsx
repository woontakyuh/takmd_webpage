import { useEffect, useMemo, type ReactNode } from 'react';
import { useTexture } from '@react-three/drei';
import { CatmullRomCurve3, RepeatWrapping, Vector2, Vector3 } from 'three';
import type { Texture } from 'three';
import { INTERIOR, PALETTE } from './config';
import { Block, Rod } from './Primitives';
import {
  ISIDORO_BOTTLE_DECK_TOP,
  ISIDORO_BOTTLE_SHELF_HEIGHT,
  ISIDORO_DIMENSIONS,
  ISIDORO_FIXED_HALF_OFFSET_Z,
  ISIDORO_WORKTOP_HEIGHT,
} from './WhiskyCabinetLayout';

const HALF_DEPTH = ISIDORO_DIMENSIONS.depth / 2;
const PANEL = 0.025;
const LEATHER = '#A69583';
const FABRIC = INTERIOR.sand;
const CHROME = PALETTE.aluminiumEdge;

type HalfProps = {
  readonly interiorSide: -1 | 1;
  readonly moving?: boolean;
  readonly wood: Texture;
  readonly children?: ReactNode;
};

function ChromeRail({ y, interiorSide }: { readonly y: number; readonly interiorSide: -1 | 1 }) {
  const z = interiorSide * (HALF_DEPTH / 2 + 0.006);
  return <group name="miniature chrome guardrail">
    <Rod from={[-0.295, y, z]} to={[0.295, y, z]} radius={0.004} color={CHROME} metalness={0.93} />
    {[-0.295, 0.295].map(x => <Rod key={x} from={[x, y - 0.035, z]} to={[x, y, z]}
      radius={0.003} color={CHROME} metalness={0.93} />)}
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

function HalfShell({ interiorSide, moving = false, wood, children }: HalfProps) {
  const outsideZ = -interiorSide * (HALF_DEPTH / 2 - PANEL / 2);
  const leather = useLeatherGrain();
  return <group name={moving ? 'opening leather trunk half' : 'fixed leather trunk half'}>
    <Block size={[ISIDORO_DIMENSIONS.width, ISIDORO_DIMENSIONS.height - 0.04, PANEL]}
      position={[0, 0.595, outsideZ]} color={LEATHER} radius={0.022} roughness={0.83} material={leather} />
    <Block size={[ISIDORO_DIMENSIONS.width - 0.055, ISIDORO_DIMENSIONS.height - 0.095, 0.012]}
      position={[0, 0.59, outsideZ + interiorSide * 0.019]} color={FABRIC} radius={0.015} roughness={0.94} />
    {[-1, 1].map(side => <Block key={side} size={[PANEL, ISIDORO_DIMENSIONS.height - 0.07, HALF_DEPTH]}
      position={[side * (ISIDORO_DIMENSIONS.width - PANEL) / 2, 0.595, 0]}
      color={LEATHER} radius={0.018} roughness={0.83} material={leather} />)}
    <Block size={[ISIDORO_DIMENSIONS.width, PANEL, HALF_DEPTH]} position={[0, 1.1575, 0]}
      color={LEATHER} radius={0.018} roughness={0.83} material={leather} />
    <Block size={[ISIDORO_DIMENSIONS.width, PANEL, HALF_DEPTH]} position={[0, 0.0475, 0]}
      color={LEATHER} radius={0.014} roughness={0.83} material={leather} />
    <Block size={[0.64, 0.06, HALF_DEPTH - 0.035]}
      position={[0, ISIDORO_BOTTLE_DECK_TOP - 0.03, 0]}
      color={PALETTE.walnut} texture={wood} radius={0.005} roughness={0.52} />
    {(moving ? [ISIDORO_BOTTLE_SHELF_HEIGHT] : [ISIDORO_WORKTOP_HEIGHT, 0.92]).map(y => <group key={y} name={`Canaletto walnut shelf ${y}`}>
      <Block size={[0.64, 0.018, HALF_DEPTH - 0.035]} position={[0, y, 0]}
        color={PALETTE.walnut} texture={wood} radius={0.004} roughness={0.5} />
      <ChromeRail y={y + 0.038} interiorSide={interiorSide} />
    </group>)}
    <Block size={[0.64, 0.405, 0.022]} position={[0, 0.31, outsideZ + interiorSide * 0.023]}
      color={PALETTE.walnutDark} texture={wood} radius={0.007} roughness={0.54} />
    <LeatherSeam z={-interiorSide * (HALF_DEPTH / 2 + 0.0009)} />
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

export function IsidoroFixedHalf({ wood, children }: { readonly wood: Texture; readonly children: ReactNode }) {
  return <group position={[0, 0, ISIDORO_FIXED_HALF_OFFSET_Z]}>
    <HalfShell interiorSide={-1} wood={wood}>{children}</HalfShell>
  </group>;
}

export function IsidoroOpeningHalf({ wood, children, marker }: { readonly wood: Texture; readonly children: ReactNode; readonly marker: boolean }) {
  return <group position={[ISIDORO_DIMENSIONS.width / 2, 0, -HALF_DEPTH / 2]}>
    <HalfShell interiorSide={1} moving wood={wood}>
      <group name="bottle collection with unmirrored labels" scale={[-1, 1, 1]}>{children}</group>
    </HalfShell>
    <group name="Pelle Frau carry handle" position={[0.29, 0.62, -HALF_DEPTH / 2 - 0.012]}>
      <Rod from={[-0.018, -0.11, 0]} to={[-0.045, -0.075, -0.022]} radius={0.007} color={CHROME} metalness={0.84} />
      <Rod from={[-0.045, -0.075, -0.022]} to={[-0.045, 0.075, -0.022]} radius={0.012} color={LEATHER} />
      <Rod from={[-0.045, 0.075, -0.022]} to={[-0.018, 0.11, 0]} radius={0.007} color={CHROME} metalness={0.84} />
      {marker && <group position={[-0.045, 0, -0.0345]} rotation={[0, Math.PI, 0]}><IsidoroGripMarker /></group>}
    </group>
    {[0.34, 0.83].map(y => <group key={y} name="chrome combination snap lock"
      position={[0.31, y, -HALF_DEPTH / 2 - 0.014]}>
      <Block size={[0.035, 0.067, 0.018]} color={CHROME} radius={0.004} roughness={0.18} metalness={0.9} />
      {[-0.016, 0, 0.016].map(offset => <Block key={offset} size={[0.024, 0.009, 0.005]}
        position={[0, offset, -0.011]} color={PALETTE.ink} radius={0.002} roughness={0.35} />)}
    </group>)}
  </group>;
}

export function IsidoroGripMarker() {
  return <group name="Isidoro grip marker">
    <mesh>
      <circleGeometry args={[0.006, 24]} />
      <meshBasicMaterial color={PALETTE.teal} />
    </mesh>
    <mesh>
      <ringGeometry args={[0.006, 0.008, 24]} />
      <meshBasicMaterial color={PALETTE.paperLight} />
    </mesh>
  </group>;
}
