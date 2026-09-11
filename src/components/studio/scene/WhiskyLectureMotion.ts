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
  const pinDistance = (y - WHISKY_LECTURE.pinY) / .028;
  const hinge = -WHISKY_LECTURE.width / 2 + .031 * Math.exp(-(pinDistance ** 2));
  const span = WHISKY_LECTURE.width / 2 - hinge;
  const distance = x - hinge;
  const bend = .95 * Math.sin(angle);
  const hingeAngle = angle + bend / 2;
  const tipAngle = hingeAngle - bend * distance / span;
  const curved = Math.abs(bend) > .00001 && distance > 0;
  const dx = curved ? span * (Math.sin(hingeAngle) - Math.sin(tipAngle)) / bend : distance * Math.cos(angle);
  const lift = curved ? span * (Math.cos(tipAngle) - Math.cos(hingeAngle)) / bend : Math.abs(distance) * Math.sin(angle);
  const down = Math.max(0, (WHISKY_LECTURE.pinY - y) / WHISKY_LECTURE.height);
  return {
    x: hinge + dx,
    y: y - (.0015 + .006 * turn) * down ** 2 * Math.min(1, Math.abs(distance) / span),
    z: Math.max(0, lift) + (.0018 * (1 - turn) * down ** 3 + .003 * turn * down ** 2) * (distance / span) ** 2,
  };
}
