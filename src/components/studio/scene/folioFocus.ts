import { FOCUS, ROOM, SIDE_READER_SPACE, focusFov } from './config';
import type { Point } from './config';

const dot = (left: Point, right: Point) => left[0] * right[0] + left[1] * right[1] + left[2] * right[2];

export function folioReadingPanelLeft(width: number, height: number): number | undefined {
  if (width < 760) return undefined;
  const { position, target } = FOCUS.research;
  const distance = Math.hypot(position[0] - target[0], position[1] - target[1], position[2] - target[2]);
  const backward: Point = [(position[0] - target[0]) / distance, (position[1] - target[1]) / distance, (position[2] - target[2]) / distance];
  const horizontal = Math.hypot(backward[0], backward[2]);
  const right: Point = [backward[2] / horizontal, 0, -backward[0] / horizontal];
  const focalLength = height / (2 * Math.tan(focusFov('research', false, width, height) * Math.PI / 360));
  const cosine = Math.cos(ROOM.folio.rotation);
  const sine = Math.sin(ROOM.folio.rotation);
  const edges = [-.515, .515].flatMap(x => [-.68, .68].map(z => {
    const relative: Point = [ROOM.folio.position[0] + .3 * (x * cosine + z * sine) - position[0],
      ROOM.folio.position[1] + .018 - position[1],
      ROOM.folio.position[2] + .3 * (-x * sine + z * cosine) - position[2]];
    return width / 2 - SIDE_READER_SPACE / 2 + focalLength * dot(relative, right) / -dot(relative, backward);
  }));
  return Math.max(18, Math.min(width - SIDE_READER_SPACE, Math.max(...edges) + 24));
}
