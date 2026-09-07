import { useEffect, useMemo } from 'react';
import { CanvasTexture, Object3D, SRGBColorSpace } from 'three';
import { Cable } from './Cable';
import type { Point } from './config';
import { LIGHTING, PALETTE } from './config';
import { Block } from './Primitives';

const HALO_2 = {
  barWidth: 0.5,
  barRadius: 0.018,
  dialRadius: 0.037,
  dialHeight: 0.0395,
} as const;

type HaloProps = {
  readonly power: number;
};

type HaloDialProps = {
  readonly position: Point;
};

export function ScreenBarHalo2({ power }: HaloProps) {
  const frontAim = useMemo(() => new Object3D(), []);
  const rearAim = useMemo(() => new Object3D(), []);
  return <group name="BenQ ScreenBar Halo 2">
    <primitive object={frontAim} position={[0, -0.51, 0.52]} />
    <primitive object={rearAim} position={[0, -0.03, -1.02]} />
    <ScreenBarBody power={power} />
    <MonitorClamp />
    <Cable points={[
      [0.044, 0.219, -0.05], [0.078, 0.188, -0.06], [0.094, 0.084, -0.056], [0.078, -0.118, -0.052],
    ]} radius={0.0017} />
    <spotLight name="ScreenBar Halo 2 asymmetric front task light" position={[0, 0.217, 0.038]} target={frontAim}
      color={LIGHTING.warm} intensity={1.35 * power} distance={1.46} decay={2} angle={0.34} penumbra={0.84}
      castShadow shadow-mapSize={[512, 512]} shadow-camera-near={0.03} shadow-normalBias={0.003} shadow-bias={-0.0001} />
    <spotLight name="ScreenBar Halo 2 rear diffuse light" position={[0, 0.203, -0.11]} target={rearAim}
      color={LIGHTING.warm} intensity={0.36 * power} distance={1.12} decay={2} angle={1.02} penumbra={1} />
  </group>;
}

export function ScreenBarHalo2Dial({ position }: HaloDialProps) {
  const display = useHaloDialDisplay();
  return <group name="ScreenBar Halo 2 wireless dial" position={[...position]}>
    <mesh position={[0, HALO_2.dialHeight / 2, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[HALO_2.dialRadius, HALO_2.dialRadius * 0.94, HALO_2.dialHeight, 36]} />
      <meshPhysicalMaterial color={PALETTE.graphite} roughness={0.34} metalness={0.78} clearcoat={0.08} />
    </mesh>
    <mesh position={[0, HALO_2.dialHeight + 0.0015, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[HALO_2.dialRadius * 0.86, HALO_2.dialRadius * 0.86, 0.004, 36]} />
      <meshStandardMaterial color={PALETTE.ink} roughness={0.29} metalness={0.64} />
    </mesh>
    <mesh name="wireless-dial OLED readout" position={[0, HALO_2.dialHeight + 0.0037, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[0.052, 0.025]} />
      <meshBasicMaterial map={display} toneMapped={false} transparent alphaTest={0.03} />
    </mesh>
  </group>;
}

function ScreenBarBody({ power }: HaloProps) {
  return <group>
    <mesh name="dark-grey aluminium cylindrical lamp head" position={[0, 0.231, 0.012]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
      <cylinderGeometry args={[HALO_2.barRadius, HALO_2.barRadius, HALO_2.barWidth, 36]} />
      <meshPhysicalMaterial color="#3D4241" roughness={0.32} metalness={0.86} clearcoat={0.06} />
    </mesh>
    <mesh name="asymmetric lower front diffuser" position={[0, 0.217, 0.034]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.0042, 0.0042, HALO_2.barWidth - 0.052, 28]} />
      <meshStandardMaterial color={LIGHTING.reflector} emissive={LIGHTING.warm} emissiveIntensity={0.025 + power * 0.16} roughness={0.62} />
    </mesh>
  </group>;
}

function MonitorClamp() {
  return <group name="central anti-slip monitor clamp and rear counterweight">
    <Block size={[0.096, 0.012, 0.035]} position={[0, 0.226, -0.022]} color={PALETTE.graphite}
      radius={0.003} roughness={0.38} metalness={0.72} />
    <Block size={[0.112, 0.018, 0.04]} position={[0, 0.218, -0.043]} color={PALETTE.graphite}
      radius={0.004} roughness={0.38} metalness={0.72} />
    <Block size={[0.086, 0.007, 0.025]} position={[0, 0.23, -0.038]} color={PALETTE.rubber}
      radius={0.0015} roughness={0.92} />
    <Block size={[0.098, 0.06, 0.058]} position={[0, 0.182, -0.076]} color={PALETTE.ink}
      radius={0.008} roughness={0.42} metalness={0.62} />
    <Block size={[0.066, 0.015, 0.004]} position={[0, 0.203, -0.107]} color={LIGHTING.reflector}
      radius={0.0015} roughness={0.66} material={{ emissive: LIGHTING.warm, emissiveIntensity: 0.08 }} />
  </group>;
}

function useHaloDialDisplay() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = '#111413';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = '#C5D0C7';
      context.font = '600 24px Arial';
      context.textAlign = 'right';
      context.textBaseline = 'middle';
      context.fillText('BenQ', canvas.width - 20, 25);
      context.font = '600 52px Arial';
      context.textAlign = 'center';
      context.fillText('50%', canvas.width / 2, 65);
      context.fillText('3000K', canvas.width / 2, 132);
      context.fillText('50%', canvas.width / 2, 199);
    }
    const result = new CanvasTexture(canvas);
    result.colorSpace = SRGBColorSpace;
    return result;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}
