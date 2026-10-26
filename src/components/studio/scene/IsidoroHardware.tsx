import { useEffect, useMemo } from 'react';
import { BufferGeometry, CanvasTexture, CatmullRomCurve3, Float32BufferAttribute, SRGBColorSpace, Vector3 } from 'three';
import type { MeshStandardMaterialParameters } from 'three';
import { Block, Rod } from './Primitives';
import { PALETTE } from './config';

const LEATHER = '#98836D';
const LEATHER_EDGE = '#705A45';
const THREAD = '#c0ac93';
const CHROME = PALETTE.aluminiumEdge;

export const ISIDORO_HARDWARE = {
  strapLength: 0.224 * 1.08,
  padCenters: [-0.122 * 1.08, 0.122 * 1.08],
  padHeight: 0.035 * 1.08,
  catchCenters: [0.29, 0.88],
  catchHeight: 0.060,
} as const;

function strapSection(t: number) {
  const bow = Math.sin(t * Math.PI);
  const normal = new Vector3(0, -0.034 * Math.PI * Math.cos(t * Math.PI), ISIDORO_HARDWARE.strapLength).normalize();
  return {
    center: new Vector3(0, (t - 0.5) * ISIDORO_HARDWARE.strapLength, 0.007 + 0.034 * bow),
    normal, halfWidth: 0.013 + 0.002 * bow, halfDepth: 0.0022 + 0.0007 * bow,
  };
}

export function createIsidoroStrapGeometry() {
  const geometry = new BufferGeometry();
  const positions: number[] = [], uvs: number[] = [], indices: number[] = [];
  const steps = 48, bevel = 0.0008;
  for (let step = 0; step <= steps; step += 1) {
    const t = step / steps;
    const { center, normal, halfWidth: w, halfDepth: d } = strapSection(t);
    const section = [[-w + bevel, -d], [w - bevel, -d], [w, -d + bevel], [w, d - bevel],
      [w - bevel, d], [-w + bevel, d], [-w, d - bevel], [-w, -d + bevel]];
    for (const [x, depth] of section) {
      positions.push(x, center.y + normal.y * depth, center.z + normal.z * depth);
      uvs.push(x / (w * 2) + 0.5, t);
    }
  }
  for (let edge = 0; edge < 8; edge += 1) {
    const start = indices.length;
    for (let step = 0; step < steps; step += 1) {
      const a = step * 8 + edge, b = step * 8 + (edge + 1) % 8;
      const c = b + 8, d = a + 8;
      indices.push(a, d, b, d, c, b);
    }
    geometry.addGroup(start, indices.length - start, edge === 0 || edge === 4 ? 0 : 1);
  }
  const capStart = indices.length;
  for (const end of [0, steps]) {
    const center = strapSection(end / steps).center;
    const vertex = positions.length / 3;
    positions.push(center.x, center.y, center.z); uvs.push(0.5, end / steps);
    for (let edge = 0; edge < 8; edge += 1) {
      const a = end * 8 + edge, b = end * 8 + (edge + 1) % 8;
      indices.push(vertex, end === 0 ? a : b, end === 0 ? b : a);
    }
  }
  geometry.addGroup(capStart, indices.length - capStart, 1);
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals(); geometry.computeBoundingSphere();
  return geometry;
}

function StrapHandle({ leather }: { readonly leather: MeshStandardMaterialParameters }) {
  const { strap, seams } = useMemo(() => {
    return {
      strap: createIsidoroStrapGeometry(),
      seams: [-1, 1].map(side => new CatmullRomCurve3(Array.from({ length: 33 }, (_, i) => {
        const { center, normal, halfWidth, halfDepth } = strapSection(i / 32);
        return center.addScaledVector(normal, halfDepth + 0.0003).setX(side * (halfWidth - 0.003));
      }))),
    };
  }, []);
  useEffect(() => () => strap.dispose(), [strap]);
  return <group name="wide flat bowed Pelle Frau leather carry strap">
    <mesh geometry={strap} castShadow receiveShadow>
      <meshStandardMaterial attach="material-0" {...leather} color={LEATHER} roughness={0.76} />
      <meshStandardMaterial attach="material-1" color={LEATHER_EDGE} roughness={0.87} />
    </mesh>
    {seams.map((curve, index) => <mesh key={index} name="strap edge saddle stitching">
      <tubeGeometry args={[curve, 40, 0.00055, 4, false]} />
      <meshStandardMaterial color={THREAD} roughness={0.85} />
    </mesh>)}
    {ISIDORO_HARDWARE.padCenters.map(y => <group key={y} position={[0, y, 0.004]} name="rectangular sewn leather attachment pad">
      <Block size={[0.033, ISIDORO_HARDWARE.padHeight, 0.004]} color={LEATHER_EDGE} radius={0.0015} roughness={0.87} />
      <Block size={[0.031, ISIDORO_HARDWARE.padHeight - 0.002, 0.003]} position={[0, 0, 0.0011]}
        color={LEATHER} radius={0.0012} roughness={0.76} material={leather} />
      {[-1, 1].map(side => <group key={side}>
        <Rod from={[-0.013, side * 0.0155, 0.0029]} to={[0.013, side * 0.0155, 0.0029]} radius={0.00045} color={THREAD} />
        <Rod from={[side * 0.013, -0.0155, 0.0029]} to={[side * 0.013, 0.0155, 0.0029]} radius={0.00045} color={THREAD} />
        <Rod from={[-0.012, side * 0.0145, 0.0029]} to={[0.012, -side * 0.0145, 0.0029]} radius={0.00045} color={THREAD} />
      </group>)}
    </group>)}
  </group>;
}

function useCombinationNumerals() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 96; canvas.height = 128;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = '#aab0af'; context.fillRect(0, 0, 96, 128);
      context.fillStyle = '#29312f'; context.textAlign = 'center'; context.textBaseline = 'middle';
      context.font = '500 47px Arial'; context.fillText('0', 48, 64);
      context.fillStyle = '#77817f'; context.font = '25px Arial';
      context.fillText('9', 48, 8); context.fillText('1', 48, 122);
    }
    const map = new CanvasTexture(canvas); map.colorSpace = SRGBColorSpace; map.anisotropy = 4;
    return map;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

function CombinationCase() {
  const numerals = useCombinationNumerals();
  return <group name="three numbered recessed chrome combination wheels">
    <Block size={[0.024, ISIDORO_HARDWARE.catchHeight, 0.006]} color={CHROME} metalness={0.96} roughness={0.14} radius={0.002} />
    <Block size={[0.015, 0.043, 0.002]} position={[0, 0, 0.0033]}
      color={PALETTE.ink} roughness={0.35} radius={0.002} />
    {[-0.014, 0, 0.014].map(y => <group key={y} position={[0, y, 0.0042]}>
      <Block size={[0.0105, 0.012, 0.003]} color={CHROME} roughness={0.18} metalness={0.9} radius={0.0015} />
      <mesh position={[0, 0, 0.0017]}>
        <planeGeometry args={[0.0082, 0.0115]} />
        <meshStandardMaterial map={numerals} roughness={0.32} metalness={0.45} />
      </mesh>
    </group>)}
    {[-0.0245, 0.0245].map(y => <Block key={y} size={[0.011, 0.006, 0.003]}
      position={[0, y, 0.004]} color={CHROME} metalness={0.98} roughness={0.1} radius={0.001} />)}
  </group>;
}

export function IsidoroFixedHardware({ leather }: { readonly leather: MeshStandardMaterialParameters }) {
  return <group name="fixed free-edge handle and combination catch bodies" position={[-0.358, 0, -0.1275]} rotation={[0, -Math.PI / 2, 0]}>
    <group position={[0.073, 0.62, 0]}><StrapHandle leather={leather} /></group>
    {ISIDORO_HARDWARE.catchCenters.map(y => <group key={y} position={[0.022, y, 0.001]}><CombinationCase /></group>)}
  </group>;
}

export function IsidoroMovingHasps() {
  return <group name="moving chrome catches crossing the case seam" position={[0.358, 0, 0.1275]} rotation={[0, Math.PI / 2, 0]}>
    {ISIDORO_HARDWARE.catchCenters.map(y => <group key={y} position={[0, y, 0]}>
      <Block size={[0.012, 0.035, 0.006]} position={[0.008, -0.007, 0]}
        color={CHROME} metalness={0.96} roughness={0.14} radius={0.002} />
      <Block size={[0.032, 0.013, 0.005]} position={[-0.009, -0.012, 0.0045]}
        color={CHROME} metalness={0.97} roughness={0.12} radius={0.002} />
      <Block size={[0.009, 0.021, 0.009]} position={[-0.024, -0.008, 0.007]}
        color={CHROME} metalness={0.97} roughness={0.12} radius={0.002} />
    </group>)}
  </group>;
}
