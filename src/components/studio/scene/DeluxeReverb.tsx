import { useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { CanvasTexture, SRGBColorSpace } from 'three';
import { Block, Rod } from './Primitives';
import { FenderBadge } from './FenderBadge';

export const DELUXE_REVERB_DIMENSIONS = { width: 0.622, height: 0.445, depth: 0.241 } as const;

function useGrilleTexture(): CanvasTexture {
  const anisotropy = useThree(state => Math.min(8, Math.max(1, state.gl.capabilities.getMaxAnisotropy())));
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 768;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = '#aaa99f';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.lineWidth = 1;
      for (let x = -512; x < 1024; x += 7) {
        context.strokeStyle = '#d9d6c9';
        context.beginPath(); context.moveTo(x, 0); context.lineTo(x + 512, 512); context.stroke();
        context.strokeStyle = '#666761';
        context.beginPath(); context.moveTo(x + 3, 0); context.lineTo(x + 515, 512); context.stroke();
      }
      context.globalAlpha = 0.35;
      for (let x = 0; x < 768; x += 8) {
        context.strokeStyle = '#3d3e3b';
        context.beginPath(); context.moveTo(x, 0); context.lineTo(x - 512, 512); context.stroke();
      }
    }
    const result = new CanvasTexture(canvas);
    result.colorSpace = SRGBColorSpace;
    result.anisotropy = anisotropy;
    return result;
  }, [anisotropy]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

function ControlPanel() {
  return <group position={[0, 0.344, 0.126]}>
    <Block size={[0.574, 0.075, 0.012]} color="#171817" radius={0.004} roughness={0.38} metalness={0.18} />
    {[-0.26, -0.235, -0.205, -0.18, -0.13, -0.092, -0.052, -0.005, 0.035, 0.078, 0.12, 0.164, 0.206].map((x, index) =>
      <group key={x} position={[x, -0.002, 0.012]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[index < 4 ? 0.009 : 0.012, index < 4 ? 0.009 : 0.012, 0.012, 20]} />
          <meshStandardMaterial color={index < 4 ? '#242522' : '#171817'} roughness={0.48} />
        </mesh>
        {index >= 4 && <mesh position={[0, 0.008, 0.019]} rotation={[Math.PI / 2, 0, 0]}>
          <boxGeometry args={[0.0018, 0.007, 0.0018]} /><meshStandardMaterial color="#efeee7" roughness={0.72} />
        </mesh>}
      </group>)}
    <mesh position={[0.252, 0.004, 0.014]}>
      <sphereGeometry args={[0.008, 18, 10]} /><meshStandardMaterial color="#a71912" emissive="#7e0d09" emissiveIntensity={0.22} roughness={0.3} />
    </mesh>
  </group>;
}

export function DeluxeReverb() {
  const grille = useGrilleTexture();
  return <group name="Fender 65 Deluxe Reverb amplifier">
    <Block size={[0.622, 0.39, 0.241]} position={[0, 0.215, 0]} color="#171816" radius={0.018} roughness={0.88}
      material={{ bumpScale: 0.002 }} />
    <Block size={[0.584, 0.25, 0.012]} position={[0, 0.171, 0.126]} color="#b4b2a8" radius={0.004} texture={grille} roughness={0.86} />
    <Block size={[0.606, 0.016, 0.014]} position={[0, 0.302, 0.128]} color="#171817" radius={0.003} roughness={0.76} />
    <ControlPanel />
    <group position={[-0.185, 0.247, 0.134]}><FenderBadge /></group>
    <group name="molded strap handle">
      <Rod from={[-0.115, 0.413, 0]} to={[-0.075, 0.435, 0]} radius={0.009} color="#20211e" metalness={0.05} />
      <Rod from={[-0.075, 0.435, 0]} to={[0.075, 0.435, 0]} radius={0.01} color="#20211e" metalness={0.05} />
      <Rod from={[0.075, 0.435, 0]} to={[0.115, 0.413, 0]} radius={0.009} color="#20211e" metalness={0.05} />
      {[-0.12, 0.12].map(x => <Block key={x} size={[0.04, 0.012, 0.035]} position={[x, 0.407, 0]} color="#a6a8a4" radius={0.004} metalness={0.8} roughness={0.24} />)}
    </group>
    {[-0.255, 0.255].map(x => <Block key={x} size={[0.045, 0.034, 0.14]} position={[x, 0.017, 0]} color="#111210" radius={0.006} roughness={0.9} />)}
    {[-0.298, 0.298].map(x => <Block key={x} size={[0.025, 0.35, 0.014]} position={[x, 0.215, 0.128]} color="#1b1c1a" radius={0.003} roughness={0.82} />)}
  </group>;
}
