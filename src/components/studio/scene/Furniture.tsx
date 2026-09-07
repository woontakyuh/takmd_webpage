import { DeskAccessories } from './DeskAccessories';
import { ExecutiveDesk } from './ExecutiveDesk';
import { OfficeChair } from './OfficeChair';
import { OfficeStorage } from './OfficeStorage';
import type { StudioSceneProps } from '../types';
import { ROOM } from './config';
import { usePrintedTexture } from './Textures';

export function Furniture({ lamp, reducedMotion, selected, onSelect, onClaudeSticker }: { readonly lamp: number } & Pick<StudioSceneProps, 'selected' | 'onSelect' | 'onClaudeSticker' | 'reducedMotion'>) {
  const wood = usePrintedTexture('wood');
  const { desk, chair } = ROOM;
  return (
    <group>
      <group position={[...desk.position]} rotation={[0, desk.rotation, 0]}>
        <ExecutiveDesk />
        <DeskAccessories selected={selected} onSelect={onSelect} onClaudeSticker={onClaudeSticker} reducedMotion={reducedMotion} />
      </group>
      <group position={[...chair.position]} rotation={[0, chair.rotation, 0]}>
        <OfficeChair reducedMotion={reducedMotion} />
      </group>
      <OfficeStorage wood={wood} lamp={lamp} />
    </group>
  );
}
