import { Movable } from './Movable';
import { LoungeSofa } from './LoungeSofa';
import { EamesLounge } from './EamesLounge';
import { NoguchiTable } from './NoguchiTable';

const TABLE_POSITION = [0.78, 0.0185, 1.08] as const;

export function OfficeLounge() {
  return <group>
    <Movable id="sofa"><LoungeSofa /></Movable>
    <Movable id="table"><NoguchiTable position={[...TABLE_POSITION]} rotation={[0, Math.PI / 2, 0]} /></Movable>
    <Movable id="lounge"><EamesLounge /></Movable>
  </group>;
}
