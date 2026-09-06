import { Cable } from './Cable';
import { Block, Rod } from './Primitives';
import { PALETTE } from './config';

export const MONITOR_ARM = {
  clamp: [-0.012, -0.0075, -0.15],
  vesa: [0, 0.37, -0.027],
  miniDisplayPort: [0.047, 0.0205, 0.063],
  monitorPowerPort: [0.052, 0.36, -0.027],
  underDeskOutlet: [-0.083, -0.6345, -0.148],
} as const;

export function MonitorArm() {
  const [clampX, clampY, clampZ] = MONITOR_ARM.clamp;
  return (
    <group>
      <Block size={[0.098, 0.009, 0.08]} position={[clampX, clampY + 0.0045, clampZ]}
        color={PALETTE.ink} radius={0.004} roughness={0.42} metalness={0.7} />
      <Block size={[0.07, 0.009, 0.06]} position={[clampX, -0.067, clampZ]}
        color={PALETTE.ink} radius={0.004} roughness={0.42} metalness={0.7} />
      <Block size={[0.014, 0.052, 0.02]} position={[clampX, -0.04, clampZ]}
        color={PALETTE.steel} radius={0.003} roughness={0.44} metalness={0.72} />
      <Rod from={[clampX, clampY, clampZ]} to={[clampX, 0.305, clampZ]} radius={0.013}
        color={PALETTE.ink} metalness={0.74} />
      <Rod from={[clampX, 0.305, clampZ]} to={[clampX, 0.36, -0.055]} radius={0.012}
        color={PALETTE.ink} metalness={0.74} />
      <Rod from={[clampX, 0.36, -0.055]} to={[...MONITOR_ARM.vesa]} radius={0.011}
        color={PALETTE.ink} metalness={0.74} />
      {[0.305, 0.36].map((y, index) => <mesh key={y} position={[clampX, y, index === 0 ? clampZ : -0.055]} castShadow>
        <sphereGeometry args={[0.021, 16, 12]} />
        <meshStandardMaterial color={PALETTE.steel} roughness={0.38} metalness={0.75} />
      </mesh>)}
      <Block size={[0.13, 0.13, 0.016]} position={[...MONITOR_ARM.vesa]} color={PALETTE.ink}
        radius={0.008} roughness={0.42} metalness={0.7} />
      <Block size={[0.016, 0.009, 0.003]} position={[...MONITOR_ARM.monitorPowerPort]} color={PALETTE.ink}
        radius={0.001} roughness={0.72} />
      {[0.075, 0.18, 0.285].map(y => <Block key={y} size={[0.025, 0.007, 0.012]} position={[clampX, y, clampZ - 0.004]}
        color={PALETTE.steel} radius={0.002} roughness={0.52} metalness={0.65} />)}
      <Cable points={[
        MONITOR_ARM.miniDisplayPort, [0.055, 0.04, 0.025], [clampX, 0.025, clampZ], [clampX, 0.305, clampZ], [clampX, 0.36, -0.055], MONITOR_ARM.vesa,
      ]} />
      <Cable points={[
        MONITOR_ARM.monitorPowerPort, [0.025, 0.35, -0.07], [clampX, 0.305, clampZ], [clampX, 0.025, clampZ], [-0.02, -0.005, clampZ], MONITOR_ARM.underDeskOutlet,
      ]} radius={0.0034} />
    </group>
  );
}
