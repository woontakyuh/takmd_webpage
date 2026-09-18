import { Box3, Vector3 } from 'three';
import {
  ISIDORO_BOTTLE_DECK_TOP,
  ISIDORO_BOTTLE_SHELF_HEIGHT,
  ISIDORO_SHELF_THICKNESS,
  ISIDORO_STORAGE_TOP,
  ISIDORO_UPPER_SHELF_HEIGHT,
} from './WhiskyCabinetLayout';

export const ISIDORO_LOWER_DOOR_FRONT = 0.428;

export function isidoroOpeningObstacles() {
  const shelf = (y: number, thickness: number) => new Box3(
    new Vector3(-0.32, y - thickness, -0.11), new Vector3(0.32, y, 0.11));
  return [
    shelf(ISIDORO_BOTTLE_DECK_TOP, 0.018),
    shelf(ISIDORO_STORAGE_TOP, 0.012),
    ...[ISIDORO_BOTTLE_SHELF_HEIGHT, ISIDORO_UPPER_SHELF_HEIGHT].flatMap(y => [
      shelf(y + ISIDORO_SHELF_THICKNESS / 2, ISIDORO_SHELF_THICKNESS),
      new Box3(new Vector3(-0.304, y + 0.0252, 0.1317), new Vector3(0.304, y + 0.0288, 0.1353)),
    ]),
    new Box3(new Vector3(-0.355, 1.145, -0.1275), new Vector3(0.355, 1.17, 0.1275)),
    ...[-1, 1].map(side => new Box3(
      new Vector3(side * 0.319 - 0.008, 0.0688, 0.1108),
      new Vector3(side * 0.319 + 0.008, 0.4762, ISIDORO_LOWER_DOOR_FRONT))),
  ];
}
