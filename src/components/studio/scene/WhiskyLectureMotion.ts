import { MathUtils } from 'three';

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
