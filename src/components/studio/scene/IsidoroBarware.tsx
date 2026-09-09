import { DoubleSide } from 'three';
import { PALETTE } from './config';
import { Block, Rod } from './Primitives';

const CHROME = PALETTE.aluminiumEdge;
const UPPER_SHELF_TOP = 0.929;
const COUNTER_TOP = 0.619;
const TRAY_THICKNESS = 0.012;
const TRAY_TOP = COUNTER_TOP + TRAY_THICKNESS;

function Tumbler({ position }: { readonly position: readonly [number, number, number] }) {
  return <mesh position={[...position]} castShadow>
    <cylinderGeometry args={[0.027, 0.023, 0.068, 18, 1, true]} />
    <meshPhysicalMaterial color={PALETTE.white} transparent opacity={0.27} depthWrite={false}
      side={DoubleSide} roughness={0.08} metalness={0} clearcoat={0.8} />
  </mesh>;
}

function MixingGlass() {
  return <group name="cut crystal mixing glass" position={[0.14, TRAY_TOP + 0.065, 0.04]}>
    <mesh castShadow>
      <cylinderGeometry args={[0.047, 0.041, 0.13, 20, 1, true]} />
      <meshPhysicalMaterial color={PALETTE.white} transparent opacity={0.31} depthWrite={false}
        side={DoubleSide} roughness={0.1} metalness={0} clearcoat={0.85} />
    </mesh>
    {[-0.03, 0, 0.03].map(angle => <Rod key={angle} from={[Math.sin(angle) * 0.04, -0.06, Math.cos(angle) * 0.04]}
      to={[Math.sin(angle + 0.3) * 0.045, 0.06, Math.cos(angle + 0.3) * 0.045]} radius={0.0015}
      color={PALETTE.aluminium} metalness={0.25} />)}
  </group>;
}

function Jigger() {
  return <group name="double stainless steel jigger" position={[0.245, TRAY_TOP + 0.0275, 0.04]}>
    <mesh position={[0, 0.025, 0]} castShadow>
      <cylinderGeometry args={[0.019, 0.009, 0.047, 20]} />
      <meshStandardMaterial color={CHROME} roughness={0.18} metalness={0.92} />
    </mesh>
    <mesh position={[0, -0.013, 0]} rotation={[Math.PI, 0, 0]} castShadow>
      <cylinderGeometry args={[0.014, 0.008, 0.029, 20]} />
      <meshStandardMaterial color={CHROME} roughness={0.18} metalness={0.92} />
    </mesh>
  </group>;
}

export function IsidoroBarware() {
  return <group name="Isidoro bartender tools and glassware">
    {[-0.24, -0.16, -0.08, 0, 0.08, 0.16, 0.24].map(x =>
      <Tumbler key={x} position={[x, UPPER_SHELF_TOP + 0.034, 0.06]} />)}
    <MixingGlass />
    <Jigger />
    <group name="long twisted bar spoon" position={[0.04, TRAY_TOP + 0.0022, 0.04]} rotation={[0, 0, -0.08]}>
      <Rod from={[-0.105, 0, 0]} to={[0.105, 0, 0]} radius={0.0022} color={CHROME} metalness={0.92} />
      <mesh position={[-0.114, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <sphereGeometry args={[0.009, 16, 8]} />
        <meshStandardMaterial color={CHROME} roughness={0.18} metalness={0.92} />
      </mesh>
    </group>
    <Block size={[0.27, TRAY_THICKNESS, 0.13]} position={[0.12, COUNTER_TOP + TRAY_THICKNESS / 2, 0.025]}
      color={PALETTE.walnutDark} radius={0.004} roughness={0.48} />
  </group>;
}
