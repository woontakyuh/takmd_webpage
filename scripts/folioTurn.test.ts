import assert from 'node:assert/strict';
import { FOLIO_TURN_ANGLE, beginFolioTurn, settleFolioTurn } from '../src/components/studio/scene/folioTurn';

type Paper = { readonly id: string };

const first: Paper = { id: 'first' };
const second: Paper = { id: 'second' };
const third: Paper = { id: 'third' };

const givenFirst = { kind: 'rest' as const, displayed: first };
const whenNextSelected = beginFolioTurn(givenFirst, second, 1, 1);
assert.deepEqual(whenNextSelected, { kind: 'turn', displayed: second, from: first, to: second, leaf: first, base: second, direction: 1, target: FOLIO_TURN_ANGLE, initialAngle: 0, preserveAngle: false, sequence: 1 });

const givenSecond = { kind: 'rest' as const, displayed: second };
const whenPreviousSelected = beginFolioTurn(givenSecond, first, -1, 2);
assert.deepEqual(whenPreviousSelected, { kind: 'turn', displayed: first, from: second, to: first, leaf: first, base: second, direction: -1, target: 0, initialAngle: FOLIO_TURN_ANGLE, preserveAngle: false, sequence: 2 });
assert.ok(Math.sin(whenPreviousSelected.initialAngle / 2) >= 0);

const givenNextTurn = beginFolioTurn(givenFirst, second, 1, 3);
const whenPreviousInterrupts = beginFolioTurn(givenNextTurn, first, -1, 4);
assert.deepEqual(whenPreviousInterrupts, { kind: 'turn', displayed: first, from: second, to: first, leaf: first, base: second, direction: -1, target: 0, initialAngle: 0, preserveAngle: true, sequence: 4 });

const whenNextInterrupts = beginFolioTurn(givenNextTurn, third, 1, 5);
assert.deepEqual(whenNextInterrupts, { kind: 'turn', displayed: third, from: second, to: third, leaf: second, base: third, direction: 1, target: FOLIO_TURN_ANGLE, initialAngle: 0, preserveAngle: true, sequence: 5 });

const givenPreviousTurn = beginFolioTurn(givenSecond, first, -1, 6);
const whenNextReversesPrevious = beginFolioTurn(givenPreviousTurn, second, 1, 7);
assert.deepEqual(whenNextReversesPrevious, { kind: 'turn', displayed: second, from: first, to: second, leaf: first, base: second, direction: 1, target: FOLIO_TURN_ANGLE, initialAngle: FOLIO_TURN_ANGLE, preserveAngle: true, sequence: 7 });

const givenTurn = beginFolioTurn(givenSecond, third, 1, 8);
if (givenTurn.kind === 'rest') throw new TypeError('Expected an active folio turn.');
const whenLeafSettles = settleFolioTurn(givenTurn);
assert.deepEqual(whenLeafSettles, { kind: 'rest', displayed: third });

console.log('folio turn scenarios passed: next, previous, rapid next/previous, settled selection');
