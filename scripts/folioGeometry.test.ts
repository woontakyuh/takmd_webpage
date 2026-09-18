import assert from 'node:assert/strict';
import { beginFolioTurn, settleFolioTurn } from '../src/components/studio/scene/folioTurn';
import { FOLIO, folioBindingPose, folioStackLayers } from '../src/components/studio/scene/folioGeometry';

const first = { id: 'first', index: 0 };
const second = { id: 'second', index: 1 };
const last = { id: 'last', index: 28 };
const initial = { kind: 'rest' as const, displayed: first };

// Given an untouched folio, when it rests, then all 29 sheets remain on the right.
assert.deepEqual(folioStackLayers(initial, 29), { left: 0, right: 29, turning: 0 });

// Given a forward turn, when the leaf is lifted, then one sheet leaves the right stack.
const forward = beginFolioTurn(initial, second, 1, 1);
assert.deepEqual(folioStackLayers(forward, 29), { left: 0, right: 28, turning: 1 });
if (forward.kind !== 'turn') throw new TypeError('Expected a lifted folio sheet.');

// Given a lifted sheet, when it settles, then it joins the left stack without losing a page.
assert.deepEqual(folioStackLayers(settleFolioTurn(forward), 29), { left: 1, right: 28, turning: 0 });

// Given a lifted sheet, when the user reverses twice, then the same physical sheet stays in flight.
const reversed = beginFolioTurn(forward, first, -1, 2);
const restored = beginFolioTurn(reversed, second, 1, 3);
assert.deepEqual(folioStackLayers(reversed, 29), folioStackLayers(forward, 29));
assert.deepEqual(folioStackLayers(restored, 29), folioStackLayers(forward, 29));

// Given an archive jump, when the last paper is selected, then the full transferred bundle is conserved.
const jump = beginFolioTurn(initial, last, 1, 4);
assert.deepEqual(folioStackLayers(jump, 29), { left: 0, right: 1, turning: 28 });

// Given a cover at any angle, when the binding unfolds, then its endpoints touch both boards.
for (const angle of [0, Math.PI / 6, Math.PI / 2, Math.PI]) {
  const pose = folioBindingPose(angle);
  assert.ok(Math.abs(pose.coverX - (FOLIO.hingeX - Math.sin(pose.spineAngle) * FOLIO.spineHeight)) < 1e-10);
  assert.ok(Math.abs(pose.coverY - Math.cos(pose.spineAngle) * FOLIO.spineHeight) < 1e-10);
  assert.ok(pose.coverY >= -1e-10);
}
assert.ok(Math.abs(folioBindingPose(Math.PI).coverY) < 1e-10);
console.log('folio geometry scenarios passed: bound cover, conserved stacks, reverse, archive jump');
