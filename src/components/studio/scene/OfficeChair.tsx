import { PALETTE } from './config';
import { Block, Rod } from './Primitives';

const STAR_ANGLES = [0, 1.257, 2.513, 3.77, 5.027] as const;

export function OfficeChair() {
  return (
    <group>
      <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.035, 0.05, 0.36, 20]} />
        <meshStandardMaterial color={PALETTE.ink} metalness={0.72} roughness={0.38} />
      </mesh>
      {STAR_ANGLES.map((angle) => {
        const x = Math.sin(angle) * 0.35;
        const z = Math.cos(angle) * 0.35;
        return (
          <group key={angle}>
            <Rod from={[0, 0.2, 0]} to={[x, 0.1, z]} radius={0.018} endRadius={0.014}
              color={PALETTE.steel} metalness={0.7} />
            <mesh position={[x, 0.075, z]} rotation={[0, angle, 0]} castShadow>
              <torusGeometry args={[0.035, 0.012, 8, 16]} />
              <meshStandardMaterial color={PALETTE.ink} roughness={0.52} />
            </mesh>
          </group>
        );
      })}
      <Block size={[0.58, 0.09, 0.53]} position={[0, 0.46, -0.015]}
        color={PALETTE.linen} radius={0.024} roughness={0.95} />
      <Block size={[0.5, 0.035, 0.42]} position={[0, 0.515, -0.04]}
        color={PALETTE.teal} radius={0.022} roughness={0.98} />
      <Rod from={[0, 0.46, 0.19]} to={[0, 0.82, 0.23]} radius={0.025}
        color={PALETTE.ink} metalness={0.55} />
      <Block size={[0.5, 0.51, 0.07]} position={[0, 0.825, 0.245]} rotation={[-0.1, 0, 0]}
        color={PALETTE.linen} radius={0.028} roughness={0.94} />
      <Block size={[0.43, 0.43, 0.012]} position={[0, 0.825, 0.202]} rotation={[-0.1, 0, 0]}
        color={PALETTE.teal} radius={0.022} roughness={0.98} />
      {[-0.17, 0, 0.17].map((x) => (
        <Rod key={x} from={[x, 0.62, 0.194]} to={[x, 1.02, 0.235]} radius={0.0022}
          color={PALETTE.tealLight} />
      ))}
      <Block size={[0.39, 0.16, 0.075]} position={[0, 1.11, 0.29]} rotation={[-0.1, 0, 0]}
        color={PALETTE.linen} radius={0.03} roughness={0.94} />
      {[-0.34, 0.34].map((x) => (
        <group key={x}>
          <Rod from={[x * 0.76, 0.49, 0.08]} to={[x * 0.82, 0.72, 0.06]} radius={0.018}
            color={PALETTE.ink} metalness={0.55} />
          <Block size={[0.08, 0.035, 0.31]} position={[x * 0.82, 0.73, -0.02]}
            color={PALETTE.ink} radius={0.015} roughness={0.7} />
        </group>
      ))}
    </group>
  );
}
