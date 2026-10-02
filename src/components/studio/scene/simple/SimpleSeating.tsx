import { StaticShapes } from './StaticShapes';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';
import { Block, Rod } from '../Primitives';
import { MAQUETTE as M } from '../OfficeStyle';

function StarBase({ height = 0.34 }: { readonly height?: number }) {
  return <group>
    <Rod from={[0, 0.08, 0]} to={[0, height, 0]} radius={0.025} color={M.metal} metalness={0.35} />
    {[0, 1, 2, 3, 4].map(i => {
      const a = i * Math.PI * 2 / 5;
      return <Rod key={i} from={[0, 0.11, 0]} to={[Math.sin(a) * 0.32, 0.045, Math.cos(a) * 0.32]}
        radius={0.015} color={M.metal} metalness={0.35} />;
    })}
  </group>;
}

export function SimpleLoungeSofa() {
  return <group name="Florence Knoll Relaxed two-seater" position={[2, 0.0185, 1.14]} rotation={[0, -Math.PI / 2, 0]}><StaticShapes>
    {[-0.7, 0.7].flatMap(x => [-0.29, 0.29].map(z => <Rod key={`${x}:${z}`} from={[x, 0.025, z]} to={[x, 0.28, z]} radius={0.016} color={M.metal} metalness={0.35} />))}
    <Block size={[1.59, 0.17, 0.77]} position={[0, 0.3, 0]} color={M.cushion} radius={0.035} />
    {[-0.365, 0.365].map(x => <group key={x}>
      <Block size={[0.71, 0.14, 0.61]} position={[x, 0.43, -0.035]} color={M.cream} radius={0.05} roughness={0.92} />
      <Block size={[0.71, 0.39, 0.16]} position={[x, 0.62, -0.29]} rotation={[-0.12, 0, 0]} color={M.cream} radius={0.05} roughness={0.92} />
    </group>)}
    {[-0.735, 0.735].map(x => <Block key={x} size={[0.13, 0.37, 0.76]} position={[x, 0.49, 0]} color={M.cushion} radius={0.035} />)}
  </StaticShapes></group>;
}

export function SimpleEamesLounge() {
  return <>
    <group name="Eames lounge chair" position={[-0.9, 0.0185, 2.12]} rotation={[0, Math.PI - 0.32, 0]}><StaticShapes>
      <StarBase height={0.34} />
      <group rotation={[-0.13, 0, 0]} position={[0, 0.4, 0]}>
        <Block size={[0.68, 0.065, 0.64]} color={M.timber} radius={0.07} />
        <Block size={[0.64, 0.15, 0.6]} position={[0, 0.075, 0]} color={M.cream} radius={0.075} />
        {[0.29, 0.59].map(y => <group key={y} position={[0, y, -0.29]} rotation={[-0.16, 0, 0]}>
          <Block size={[0.66, 0.3, 0.065]} color={M.timber} radius={0.065} />
          <Block size={[0.62, 0.27, 0.12]} position={[0, 0, 0.055]} color={M.cream} radius={0.06} />
        </group>)}
        {[-0.37, 0.37].map(x => <group key={x}>
          <Rod from={[x, 0.03, -0.14]} to={[x, 0.22, 0.02]} radius={0.018} color={M.metal} />
          <Block size={[0.16, 0.095, 0.45]} position={[x, 0.24, 0.015]} color={M.cream} radius={0.04} />
        </group>)}
      </group>
    </StaticShapes></group>
    <group name="Eames ottoman" position={[-0.58, 0.0185, 1.15]} rotation={[0, Math.PI - 0.32, 0]}><StaticShapes>
      <StarBase height={0.29} />
      <Block size={[0.62, 0.07, 0.52]} position={[0, 0.32, 0]} color={M.timber} radius={0.05} />
      <Block size={[0.61, 0.14, 0.51]} position={[0, 0.4, 0]} color={M.cream} radius={0.06} />
    </StaticShapes></group>
  </>;
}

export function SimpleOfficeChair({ reducedMotion }: { readonly reducedMotion: boolean }) {
  const swivel = useRef<Group>(null);
  const elapsed = useRef(2);
  useFrame((_, delta) => {
    elapsed.current = Math.min(2, elapsed.current + delta);
    if (swivel.current) swivel.current.rotation.y = reducedMotion ? 0 : Math.sin(elapsed.current * 8) * Math.exp(-elapsed.current * 3) * 0.105;
  });
  return <group name="Desk chair" ref={swivel} onPointerOver={() => { if (elapsed.current >= 1.5) elapsed.current = 0; }}><StaticShapes>
    <StarBase height={0.42} />
    <Block size={[0.51, 0.095, 0.48]} position={[0, 0.47, 0]} color={M.cushion} radius={0.05} />
    <group position={[0, 0.77, -0.2]} rotation={[-0.1, 0, 0]}>
      <Block size={[0.49, 0.6, 0.045]} color={M.metal} radius={0.055} />
      {[-0.2, 0, 0.2].map(y => <Block key={y} size={[0.45, 0.185, 0.065]} position={[0, y, 0.035]} color={M.cream} radius={0.035} />)}
    </group>
    {[-0.3, 0.3].map(x => <group key={x}>
      <Rod from={[x, 0.44, -0.12]} to={[x, 0.66, 0.14]} radius={0.013} color={M.metal} metalness={0.4} />
      <Rod from={[x, 0.66, 0.14]} to={[x, 0.66, -0.15]} radius={0.023} color={M.metal} metalness={0.4} />
    </group>)}
  </StaticShapes></group>;
}

export function SimpleNoguchiTable({ position, rotation }: { readonly position?: [number, number, number]; readonly rotation?: [number, number, number] }) {
  return <group name="Noguchi coffee table" position={position} rotation={rotation}><StaticShapes>
    {[-1, 1].map(sign => <group key={sign} rotation={[0, sign * 0.55, 0]}>
      <Block size={[0.8, 0.08, 0.12]} position={[0, 0.075, 0]} color={M.timber} radius={0.04} />
      <Block size={[0.12, 0.32, 0.12]} position={[sign * 0.3, 0.22, 0]} rotation={[0, 0, -sign * 0.22]} color={M.timber} radius={0.04} />
    </group>)}
    <mesh position={[0, 0.41, 0]} scale={[1, 1, 0.7]} receiveShadow>
      <cylinderGeometry args={[0.67, 0.67, 0.022, 48]} />
      <meshStandardMaterial color={M.glass} transparent opacity={0.35} roughness={0.25} depthWrite={false} />
    </mesh>
  </StaticShapes></group>;
}
