import { MathUtils } from 'three';
import { WHISKY_LECTURE } from './WhiskyLectureLayout';

export type LectureLeafState = 'parked' | 'current' | 'waiting';

export function advanceLecturePage(index: number, direction: -1 | 1, count: number) {
  return MathUtils.clamp(index + direction, 0, Math.max(0, count - 1));
}

export function lectureLeafState(page: number, index: number): LectureLeafState {
  if (page < index) return 'parked';
  if (page === index) return 'current';
  return 'waiting';
}

export function visibleLecturePages(index: number, count: number) {
  const first = Math.max(0, index - 1);
  const last = Math.min(count - 1, index + 1);
  return Array.from({ length: Math.max(0, last - first + 1) }, (_, offset) => first + offset);
}

export function lectureStackState(cursor: number, count: number) {
  const page = Math.floor(MathUtils.clamp(cursor, 0, Math.max(0, count - 1)));
  return { page, left: page, right: Math.max(0, count - page - 1), turning: count > 0 ? 1 : 0 };
}

export function stepLectureTurn(cursor: number, target: number, delta: number, reduced: boolean) {
  if (reduced || Math.abs(target - cursor) < .0005) return target;
  const elapsed = Math.min(delta, .1);
  const movement = (target - cursor) * (1 - Math.exp(-8 * elapsed));
  const next = cursor + MathUtils.clamp(movement, -2.8 * elapsed, 2.8 * elapsed);
  return next > cursor ? Math.min(next, Math.floor(cursor) + 1) : Math.max(next, Math.ceil(cursor) - 1);
}

export function lectureSheetPoint(x: number, y: number, progress: number) {
  const turn = MathUtils.clamp(progress, 0, 1);
  const angle = Math.PI * turn;
  const { foldY, foldRadius, height } = WHISKY_LECTURE;
  const distance = foldY - y;
  if (distance <= 0) return { x, y, z: 0 };
  // The clamped strip stays beneath both magnets; a rounded fold clears their caps.
  const curvedLength = Math.min(distance, foldRadius * angle);
  const curvedAngle = curvedLength / foldRadius;
  const freeLength = distance - curvedLength;
  const bend = 1.3 * Math.sin(angle) + .52 * turn;
  const curvature = bend / (foldY + height / 2 - foldRadius * angle);
  const tipAngle = angle - curvature * freeLength;
  const broadBend = curvature > .00001;
  const sweep = broadBend ? (Math.sin(angle) - Math.sin(tipAngle)) / curvature : freeLength * Math.cos(angle);
  const lift = broadBend ? (Math.cos(tipAngle) - Math.cos(angle)) / curvature : freeLength * Math.sin(angle);
  return {
    x,
    y: foldY - foldRadius * Math.sin(curvedAngle) - sweep,
    z: foldRadius * (1 - Math.cos(curvedAngle)) + lift,
  };
}
