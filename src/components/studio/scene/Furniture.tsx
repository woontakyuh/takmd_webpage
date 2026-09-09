import { Movable } from './Movable';
import { DeskAccessories } from './DeskAccessories';
import { ExecutiveDesk } from './ExecutiveDesk';
import { OfficeChair } from './OfficeChair';
import { OfficeStorage } from './OfficeStorage';
import { FenderMusicCorner, FENDER_MUSIC_CORNER_BOUNDS } from './FenderMusicCorner';
import type { StudioSceneProps } from '../types';
import { ROOM } from './config';
import { usePrintedTexture } from './Textures';

export function Furniture({ familyPhotoSrc, lamp, reducedMotion, selected, onSelect, onClaudeSticker, onAwardPhoto, halo, onHaloControls }: { readonly lamp: number } & Pick<StudioSceneProps, 'familyPhotoSrc' | 'selected' | 'onSelect' | 'onClaudeSticker' | 'onAwardPhoto' | 'reducedMotion' | 'halo' | 'onHaloControls'>) {
  const wood = usePrintedTexture('wood');
  const { desk, chair } = ROOM;
  return (
    <group>
      <Movable id="desk"><group position={[...desk.position]} rotation={[0, desk.rotation, 0]}>
        <ExecutiveDesk />
        <DeskAccessories familyPhotoSrc={familyPhotoSrc} selected={selected} onSelect={onSelect} onClaudeSticker={onClaudeSticker} reducedMotion={reducedMotion} halo={halo} onHaloControls={onHaloControls} />
      </group></Movable>
      <Movable id="chair"><group position={[...chair.position]} rotation={[0, chair.rotation, 0]}>
        <OfficeChair reducedMotion={reducedMotion} />
      </group></Movable>
      <OfficeStorage wood={wood} lamp={lamp} reducedMotion={reducedMotion} onAwardPhoto={onAwardPhoto} />
      <Movable id="music"><group position={[...ROOM.music.position]} rotation={[0, ROOM.music.rotation, 0]}>
        <group position={[-(FENDER_MUSIC_CORNER_BOUNDS.min[0] + FENDER_MUSIC_CORNER_BOUNDS.max[0]) / 2, 0, 0]}>
          <FenderMusicCorner />
        </group>
      </group></Movable>
    </group>
  );
}
