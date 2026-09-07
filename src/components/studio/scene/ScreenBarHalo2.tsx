import { useEffect, useMemo } from 'react';
import { CanvasTexture, Object3D } from 'three';
import type { Texture } from 'three';
import { Cable } from './Cable';
import { LIGHTING, PALETTE } from './config';
import { Block } from './Primitives';

export { ScreenBarHalo2Dial } from './ScreenBarHalo2Dial';

const HALO_2 = {
  barWidth: 0.5,
  barRadius: 0.018,
} as const;

type HaloProps = {
  readonly power: number;
};

export function ScreenBarHalo2({ power }: HaloProps) {
  const beam = useHaloBeam();
  const rearAim = useMemo(() => new Object3D(), []);
  return <group name="BenQ ScreenBar Halo 2">
    <primitive object={rearAim} position={[0, -0.03, -1.02]} />
    <ScreenBarBody power={power} />
    <MonitorClamp />
    <Cable points={[
      [0.044, 0.219, -0.05], [0.078, 0.188, -0.06], [0.094, 0.084, -0.056], [0.078, -0.118, -0.052],
    ]} radius={0.0017} />
    {[-0.15, 0.15].map(x => <FrontEmitter key={x} x={x} power={power} beam={beam} />)}
    <spotLight name="ScreenBar Halo 2 rear diffuse light" position={[0, 0.203, -0.11]} target={rearAim}
      color={LIGHTING.warm} intensity={0.36 * power} distance={1.12} decay={2} angle={1.02} penumbra={1} />
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
      <meshStandardMaterial color={LIGHTING.reflector} emissive={LIGHTING.warmWhite} emissiveIntensity={power * 0.2} roughness={0.62} />
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

function FrontEmitter({ x, power, beam }: {
  readonly x: number; readonly power: number; readonly beam: Texture;
}) {
  const aim = useMemo(() => new Object3D(), []);
  return <>
    <primitive object={aim} position={[x, -0.51, 0.52]} />
    <spotLight name={x < 0 ? 'ScreenBar Halo 2 asymmetric front task light' : `ScreenBar Halo 2 front segment ${x}`}
      position={[x, 0.217, 0.038]} target={aim} map={beam}
      color={LIGHTING.warmWhite} intensity={0.57 * power} distance={1.46} decay={2} angle={0.85} penumbra={0.7}
      castShadow shadow-mapSize={[512, 512]} shadow-camera-near={0.03} shadow-normalBias={0.003}
      shadow-bias={-0.0001} shadow-radius={2} />
  </>;
}

function useHaloBeam() {
  const beam = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = '#000';
      context.fillRect(0, 0, 256, 256);
      context.translate(128, 128);
      context.scale(1, 0.53);
      // Project a broad lateral lobe with a soft front/back cutoff, following BenQ's coverage diagram.
      const gradient = context.createRadialGradient(0, 0, 0, 0, 0, 125);
      gradient.addColorStop(0, '#fff');
      gradient.addColorStop(0.4, '#dedede');
      gradient.addColorStop(0.68, '#828282');
      gradient.addColorStop(0.86, '#303030');
      gradient.addColorStop(1, '#000');
      context.fillStyle = gradient;
      context.fillRect(-128, -256, 256, 512);
    }
    return new CanvasTexture(canvas);
  }, []);
  useEffect(() => () => beam.dispose(), [beam]);
  return beam;
}
