import { Movable } from './Movable';
import { OfficeChair } from './OfficeChair';
import { OfficeStorage } from './OfficeStorage';
import { FenderMusicCorner, FENDER_MUSIC_CORNER_BOUNDS } from './FenderMusicCorner';
import type { StudioSceneProps } from '../types';
import { ROOM } from './config';
import { usePrintedTexture } from './Textures';

export function Furniture({ lamp, reducedMotion, selected, onAwardPhoto }: { readonly lamp: number } & Pick<StudioSceneProps, 'selected' | 'onAwardPhoto' | 'reducedMotion'>) {
  const wood = usePrintedTexture('wood');
  const { chair } = ROOM;
  return (
    <group>
      <Movable id="chair"><group position={[...chair.position]} rotation={[0, chair.rotation, 0]}>
        <OfficeChair reducedMotion={reducedMotion} />
      </group></Movable>
      <OfficeStorage wood={wood} lamp={lamp} selected={selected} reducedMotion={reducedMotion} onAwardPhoto={onAwardPhoto} />
      <Movable id="music"><group position={[...ROOM.music.position]} rotation={[0, ROOM.music.rotation, 0]}>
        <group position={[-(FENDER_MUSIC_CORNER_BOUNDS.min[0] + FENDER_MUSIC_CORNER_BOUNDS.max[0]) / 2, 0, 0]}>
          <FenderMusicCorner reducedMotion={reducedMotion} />
        </group>
      </group></Movable>
    </group>
  );
}
