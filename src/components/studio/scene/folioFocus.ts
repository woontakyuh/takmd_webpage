import { FOCUS, MOBILE_FOCUS, ROOM, SIDE_READER_SPACE, focusFov } from './config';
import type { Point } from './config';

const dot = (left: Point, right: Point) => left[0] * right[0] + left[1] * right[1] + left[2] * right[2];

export const folioUsesCompactReader = (width: number, height: number) => width < 760 || height < 560;
export const folioReadingPose = (width: number, height: number) => folioUsesCompactReader(width, height) ? MOBILE_FOCUS.research : FOCUS.research;

export function folioReadingView(width: number, height: number) {
  if (!folioUsesCompactReader(width, height)) return { fov: focusFov('research', false, width, height), offsetX: SIDE_READER_SPACE / 2, offsetY: 0 };
  const landscape = width > height && height < 560;
  const readerWidth = Math.min(width * .48, 360);
  const area = { left: 16, right: landscape ? width - readerWidth - 24 : width - 16,
    top: 80, bottom: landscape ? height - 16 : height * .52 - 20 };
  const pose = folioReadingPose(width, height);
  const distance = Math.hypot(...pose.position.map((value, index) => value - pose.target[index]));
  const backward: Point = [(pose.position[0] - pose.target[0]) / distance, (pose.position[1] - pose.target[1]) / distance, (pose.position[2] - pose.target[2]) / distance];
  const horizontal = Math.hypot(backward[0], backward[2]);
  const right: Point = [backward[2] / horizontal, 0, -backward[0] / horizontal];
  const up: Point = [-backward[1] * backward[0] / horizontal, horizontal, -backward[1] * backward[2] / horizontal];
  const cosine = Math.cos(ROOM.folio.rotation), sine = Math.sin(ROOM.folio.rotation);
  const corners = [-.515, .515].flatMap(x => [-.68, .68].map(z => {
    const relative: Point = [ROOM.folio.position[0] + .3 * (x * cosine + z * sine) - pose.position[0],
      ROOM.folio.position[1] + .018 - pose.position[1], ROOM.folio.position[2] + .3 * (-x * sine + z * cosine) - pose.position[2]];
    const depth = -dot(relative, backward);
    return { x: dot(relative, right) / depth, y: -dot(relative, up) / depth };
  }));
  const bounds = { left: Math.min(...corners.map(point => point.x)), right: Math.max(...corners.map(point => point.x)),
    top: Math.min(...corners.map(point => point.y)), bottom: Math.max(...corners.map(point => point.y)) };
  const focalLength = Math.min((area.right - area.left) / (bounds.right - bounds.left), Math.max(32, area.bottom - area.top) / (bounds.bottom - bounds.top));
  return { fov: 2 * Math.atan(height / (2 * focalLength)) * 180 / Math.PI,
    offsetX: (width + focalLength * (bounds.left + bounds.right) - area.left - area.right) / 2,
    offsetY: (height + focalLength * (bounds.top + bounds.bottom) - area.top - area.bottom) / 2 };
}

export function folioReadingPanelLeft(width: number, height: number): number | undefined {
  if (width > height && height < 560) return width - Math.min(width * .48, 360) - 8;
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
