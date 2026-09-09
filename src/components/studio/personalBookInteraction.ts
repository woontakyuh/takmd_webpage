export const BOOK_SHELF_CENTER = [-1.875, 2.145, 3.004] as const;
const SHELF_REACH = 1.2;
const CLICK_DRAG_THRESHOLD = 5;

export function canReadShelfBook(position: { readonly x: number; readonly y: number; readonly z: number }): boolean {
  return Math.hypot(position.x - BOOK_SHELF_CENTER[0], position.y - BOOK_SHELF_CENTER[1], position.z - BOOK_SHELF_CENTER[2]) <= SHELF_REACH;
}

export function bookPageAfter(index: number, pageCount: number, direction: 1 | -1): number {
  return Math.max(-1, Math.min(pageCount - 1, index + direction));
}

type BookPointer = Pick<PointerEvent, 'pointerId' | 'clientX' | 'clientY' | 'button' | 'isPrimary' | 'shiftKey' | 'ctrlKey' | 'metaKey' | 'altKey'>;
export type BookPagePress = {
  readonly pointerId: number;
  readonly x: number;
  readonly y: number;
  readonly direction: 1 | -1;
};

function plainPointer(pointer: BookPointer): boolean {
  return pointer.isPrimary && !pointer.shiftKey && !pointer.ctrlKey && !pointer.metaKey && !pointer.altKey;
}

export function beginBookPagePress(pointer: BookPointer, direction: 1 | -1): BookPagePress | null {
  return pointer.button === 0 && plainPointer(pointer)
    ? { pointerId: pointer.pointerId, x: pointer.clientX, y: pointer.clientY, direction }
    : null;
}

export function moveBookPagePress(press: BookPagePress | null, pointer: BookPointer): BookPagePress | null {
  return press && press.pointerId === pointer.pointerId && plainPointer(pointer)
    && Math.hypot(pointer.clientX - press.x, pointer.clientY - press.y) < CLICK_DRAG_THRESHOLD ? press : null;
}

export function finishBookPagePress(press: BookPagePress | null, pointer: BookPointer, direction: 1 | -1): boolean {
  return pointer.button === 0 && press?.direction === direction && moveBookPagePress(press, pointer) !== null;
}
