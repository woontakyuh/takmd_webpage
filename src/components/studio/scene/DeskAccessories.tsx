import { DESK_MAT_TOP, DeskMat } from './DeskMat';
import type { StudioSceneProps } from '../types';
import { FamilyPhoto } from './FamilyPhoto';
import { Interactive } from './Interactive';
import { MacMini } from './MacMini';
import { WirelessKeyboard } from './WirelessKeyboard';
import { MxMasterMouse } from './MxMasterMouse';

export function DeskAccessories({ selected, onSelect, reducedMotion }: Pick<StudioSceneProps, 'selected' | 'onSelect' | 'reducedMotion'>) {
  return (
    <group>
      <DeskMat />
      <FamilyPhoto selected={selected} onSelect={onSelect} reducedMotion={reducedMotion} />
      <WirelessKeyboard position={[0.19, DESK_MAT_TOP, 0.1]} />
      <MxMasterMouse position={[0.48, DESK_MAT_TOP, 0.1]} />
      <Interactive id="projects" selected={selected} onSelect={onSelect} reducedMotion={reducedMotion} position={[0.19, DESK_MAT_TOP, -0.17]}><MacMini position={[0, 0, 0]} /></Interactive>
    </group>
  );
}
