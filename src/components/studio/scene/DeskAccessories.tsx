import { ROOM } from './config';
import type { StudioSceneProps } from '../types';
import { FamilyPhoto } from './FamilyPhoto';
import { Interactive } from './Interactive';
import { MacMini } from './MacMini';
import { WirelessKeyboard } from './WirelessKeyboard';
import { MxMasterMouse } from './MxMasterMouse';

const DESK_TOP = 0.0185 + ROOM.desk.height;

export function DeskAccessories({ selected, onSelect, reducedMotion, onClaudeSticker }: Pick<StudioSceneProps, 'selected' | 'onSelect' | 'onClaudeSticker' | 'reducedMotion'>) {
  return (
    <group>
      <FamilyPhoto selected={selected} onSelect={onSelect} reducedMotion={reducedMotion} />
      <WirelessKeyboard position={[0.19, DESK_TOP, 0.1]} />
      <MxMasterMouse position={[0.48, DESK_TOP, 0.1]} />
      <Interactive id="projects" selected={selected} onSelect={onSelect} reducedMotion={reducedMotion} position={[0.19, DESK_TOP, -0.17]}><MacMini position={[0, 0, 0]} onClaudeSticker={onClaudeSticker} /></Interactive>
    </group>
  );
}
