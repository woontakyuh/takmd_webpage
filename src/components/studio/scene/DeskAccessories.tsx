import { DESK_MAT_TOP, DeskMat } from './DeskMat';
import { MacMini } from './MacMini';
import { Block, Rod } from './Primitives';
import { PALETTE } from './config';
import { WirelessKeyboard } from './WirelessKeyboard';
import { WirelessMouse } from './WirelessMouse';

export function DeskAccessories() {
  return (
    <group>
      <DeskMat />
      <WirelessKeyboard position={[0.19, DESK_MAT_TOP, 0.1]} />
      <WirelessMouse position={[0.48, DESK_MAT_TOP, 0.1]} />
      <MacMini position={[0.19, DESK_MAT_TOP, -0.17]} />
      <Block size={[0.135, 0.025, 0.035]} position={[0.17, 0.135, -0.448]}
        color={PALETTE.ink} radius={0.006} roughness={0.65} />
      {[[0.145, -0.452], [0.171, -0.445]].map(([x, z]) => <Block key={x}
        size={[0.018, 0.012, 0.021]} position={[x, 0.152, z]}
        color={PALETTE.steel} radius={0.003} roughness={0.7} />)}
      {[0.12, 0.22].map(x => <Rod key={x} from={[x, 0.2, -0.34]} to={[x, 0.14, -0.448]}
        radius={0.0025} color={PALETTE.ink} metalness={0.65} />)}
    </group>
  );
}
