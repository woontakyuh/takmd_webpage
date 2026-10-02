import assert from 'node:assert/strict';
import { bookPageAfter, canReadShelfBook, beginBookPagePress, moveBookPagePress, finishBookPagePress } from '../src/components/studio/personalBookInteraction';

const mouse = { pointerId: 1, clientX: 100, clientY: 100, button: 0, isPrimary: true, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false };
assert.equal(bookPageAfter(-1, 2, 1), 0);
assert.equal(bookPageAfter(0, 2, 1), 1);
assert.equal(bookPageAfter(1, 2, 1), 1);
assert.equal(bookPageAfter(1, 2, -1), 0);
assert.equal(bookPageAfter(0, 2, -1), -1);
assert.equal(bookPageAfter(-1, 2, -1), -1);
assert.equal(bookPageAfter(-1, 0, 1), -1);
assert.equal(bookPageAfter(0, 0, -1), -1);
assert.equal(canReadShelfBook({ x: 4.5, y: 3.4, z: -6.5 }), false);
assert.equal(canReadShelfBook({ x: -1.875, y: 2.12, z: 2.35 }), true);
assert.equal(canReadShelfBook({ x: -1.875, y: 1.82, z: .9 }), false);

const givenPress = beginBookPagePress(mouse, 1);
assert.equal(finishBookPagePress(givenPress, mouse, 1), true);
assert.equal(finishBookPagePress(givenPress, mouse, -1), false);
assert.equal(finishBookPagePress(givenPress, { ...mouse, pointerId: 2 }, 1), false);
assert.equal(finishBookPagePress(givenPress, { ...mouse, clientX: 105 }, 1), false);
for (const key of ['shiftKey', 'ctrlKey', 'altKey', 'metaKey'] as const) {
  assert.equal(beginBookPagePress({ ...mouse, [key]: true }, 1), null);
  assert.equal(finishBookPagePress(givenPress, { ...mouse, [key]: true }, 1), false);
}
assert.equal(beginBookPagePress({ ...mouse, button: 2 }, 1), null);
assert.equal(beginBookPagePress({ ...mouse, isPrimary: false }, 1), null);
assert.equal(finishBookPagePress(givenPress, { ...mouse, isPrimary: false }, 1), false);
assert.equal(moveBookPagePress(givenPress, { ...mouse, pointerId: 2 }), null);
const whenDraggedAway = moveBookPagePress(givenPress, { ...mouse, clientX: 160 });
const whenReturned = moveBookPagePress(whenDraggedAway, mouse);
assert.equal(finishBookPagePress(whenReturned, mouse, 1), false);
const givenTouch = beginBookPagePress({ ...mouse, pointerId: 7 }, -1);
assert.equal(finishBookPagePress(givenTouch, { ...mouse, pointerId: 7, clientY: 102 }, -1), true);
console.log('Personal books: bounded pages, shelf reach, mouse/touch, modifiers, cross-page and drag-return checks passed.');
