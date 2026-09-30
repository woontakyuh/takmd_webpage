import { Movable } from './Movable';
import { ExecutiveDesk } from './ExecutiveDesk';
import { DeskAccessories } from './DeskAccessories';
import { ROOM } from './config';
import type { StudioSceneProps } from '../types';

export function DeskFurniture(props: StudioSceneProps) {
  return <Movable id="desk"><group position={[...ROOM.desk.position]} rotation={[0, ROOM.desk.rotation, 0]}>
    <ExecutiveDesk />
    <DeskAccessories {...props} />
  </group></Movable>;
}
