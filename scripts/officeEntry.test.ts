import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { officeEntryPhase } from '../src/components/studio/officeEntry';

describe('office entry routing', () => {
  test('a normal homepage starts at the desk', () => {
    assert.equal(officeEntryPhase(new URL('https://takmd.com/')), 'seated');
  });
  for (const path of ['/?exhibit=ai', '/?exhibit=education&talk=123', '/?exhibit=research', '/cv', '/#office-reading']) {
    test(`direct destination ${path} bypasses the intro`, () => {
      assert.equal(officeEntryPhase(new URL(path, 'https://takmd.com')), 'complete');
    });
  }
  test('poster capture holds its seated pose without starting the reveal', () => {
    assert.equal(officeEntryPhase(new URL('https://takmd.com/?office-capture=seated')), 'capture');
    assert.equal(officeEntryPhase(new URL('https://takmd.com/?office-capture=overview')), 'complete');
  });
});
