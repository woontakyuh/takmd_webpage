import { ROOM } from './config';
import type { StudioSceneProps } from '../types';
import { FamilyPhoto } from './FamilyPhoto';
import { Interactive } from './Interactive';
import { MacMini } from './MacMini';
import { WirelessKeyboard } from './WirelessKeyboard';
import { MxMasterMouse } from './MxMasterMouse';
import { ScreenBarHalo2Dial } from './ScreenBarHalo2';

const DESK_TOP = 0.0185 + ROOM.desk.height;

export function DeskAccessories({ familyPhotoSrc, selected, onSelect, reducedMotion, onClaudeSticker, halo, onHaloControls }: Pick<StudioSceneProps, 'familyPhotoSrc' | 'selected' | 'onSelect' | 'onClaudeSticker' | 'reducedMotion' | 'halo' | 'onHaloControls'>) {
  return (
    <group>
      <FamilyPhoto familyPhotoSrc={familyPhotoSrc} selected={selected} onSelect={onSelect} reducedMotion={reducedMotion} />
      <WirelessKeyboard position={[0, DESK_TOP, 0.1]} />
      <MxMasterMouse position={[0.31, DESK_TOP, 0.1]} />
      <ScreenBarHalo2Dial position={[ROOM.macMini.position[0] + 0.13, DESK_TOP, ROOM.macMini.position[2]]} halo={halo} onHaloControls={onHaloControls} />
      <Interactive id="projects" selected={selected} onSelect={onSelect} reducedMotion={reducedMotion} position={ROOM.macMini.position}><MacMini position={[0, 0, 0]} onClaudeSticker={onClaudeSticker} /></Interactive>
    </group>
  );
}
