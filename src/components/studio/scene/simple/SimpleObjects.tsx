import { StaticShapes } from './StaticShapes';
import { useEffect, useMemo } from 'react';
import { ExtrudeGeometry, Shape } from 'three';
import { Block, Rod } from '../Primitives';
import { MAQUETTE as M } from '../OfficeStyle';

function Ellipsoid({ position, scale, color }: {
  readonly position: [number, number, number]; readonly scale: [number, number, number]; readonly color: string;
}) {
  return <mesh position={position} scale={scale} castShadow receiveShadow>
    <sphereGeometry args={[1, 16, 12]} /><meshStandardMaterial color={color} roughness={0.88} />
  </mesh>;
}

export function SimplePigPlush() {
  return <group name="Reference pale-pink plush pig" rotation={[0, Math.PI / 2, 0]}><StaticShapes>
    <Ellipsoid position={[0, 0.11, 0]} scale={[0.14, 0.12, 0.13]} color={M.plush} />
    <Ellipsoid position={[0, 0.085, 0.123]} scale={[0.061, 0.041, 0.034]} color={M.plushSnout} />
    {[-1, 1].map(sign => <group key={sign}>
      <Ellipsoid position={[sign * 0.12, 0.025, 0.015]} scale={[0.056, 0.026, 0.066]} color={M.plushLimbs} />
      <Ellipsoid position={[sign * 0.086, 0.193, 0.01]} scale={[0.04, 0.052, 0.026]} color={M.plushLimbs} />
      <Ellipsoid position={[sign * 0.058, 0.131, 0.111]} scale={[0.007, 0.008, 0.004]} color={M.graphite} />
      <Ellipsoid position={[sign * 0.021, 0.085, 0.154]} scale={[0.004, 0.007, 0.002]} color={M.plushDetail} />
    </group>)}
  </StaticShapes></group>;
}

function guitarBody() {
  const s = new Shape();
  s.moveTo(0, 0.12);
  s.bezierCurveTo(-0.23, 0.1, -0.21, 0.28, -0.13, 0.34);
  s.bezierCurveTo(-0.09, 0.38, -0.12, 0.44, -0.12, 0.51);
  s.bezierCurveTo(-0.1, 0.59, -0.07, 0.48, -0.038, 0.45);
  s.lineTo(0.035, 0.45);
  s.bezierCurveTo(0.08, 0.48, 0.08, 0.6, 0.115, 0.59);
  s.bezierCurveTo(0.17, 0.55, 0.09, 0.38, 0.13, 0.34);
  s.bezierCurveTo(0.23, 0.25, 0.21, 0.1, 0, 0.12);
  return new ExtrudeGeometry(s, { depth: 0.044, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.012, bevelSegments: 2, curveSegments: 12, steps: 1 });
}

export function SimpleFenderStrat() {
  const body = useMemo(guitarBody, []);
  useEffect(() => () => body.dispose(), [body]);
  return <group name="Fender USA Stratocaster Sienna Sunburst on floor stand"><StaticShapes>
    <mesh geometry={body} position={[0, 0, -0.045]} castShadow receiveShadow>
      <meshStandardMaterial color={M.guitar} roughness={0.6} />
    </mesh>
    <mesh geometry={body} position={[0, 0.066, 0.005]} scale={[0.67, 0.72, 0.12]}>
      <meshStandardMaterial color={M.pickguard} roughness={0.75} />
    </mesh>
    <Block size={[0.05, 0.49, 0.023]} position={[0, 0.717, -0.009]} color={M.timber} radius={0.005} />
    <Block size={[0.065, 0.133, 0.028]} position={[0.012, 1.013, -0.009]} rotation={[0, 0, -0.1]} color={M.timber} radius={0.019} />
    {[0.25, 0.315, 0.38].map(y => <Block key={y} size={[0.059, 0.014, 0.011]} position={[0, y, 0.023]} color={M.cream} radius={0.003} />)}
    <Block size={[0.072, 0.047, 0.015]} position={[0, 0.203, 0.02]} color={M.metal} radius={0.004} />
    {Array.from({ length: 6 }, (_, i) => <group key={i}>
      <Rod from={[-0.018 + i * 0.0072, 0.203, 0.03]} to={[-0.018 + i * 0.0072, 1, 0.009]} radius={0.00055} color={M.strings} />
      <Block size={[0.021, 0.012, 0.013]} position={[0.053, 0.963 + i * 0.018, -0.01]} color={M.metal} radius={0.004} />
    </group>)}
    {[-1, 1].map(sign => <group key={sign}>
      <Rod from={[sign * 0.15, 0.02, 0.1]} to={[sign * 0.07, 0.39, -0.075]} radius={0.008} color={M.graphite} />
      <Rod from={[sign * 0.07, 0.39, -0.075]} to={[sign * 0.12, 0.02, -0.13]} radius={0.008} color={M.graphite} />
    </group>)}
  </StaticShapes></group>;
}
