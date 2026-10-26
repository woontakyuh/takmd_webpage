import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { officeEntryPhase, officeInitialView } from '../src/components/studio/officeEntry';
import { ACADEMIC_OFFICE } from '../src/components/studio/scene/roomEdition';

describe('office entry routing', () => {
  test('the academic homepage starts in Front without the desk intro', () => {
    const url = new URL('https://takmd.com/');
    assert.equal(officeEntryPhase(url), ACADEMIC_OFFICE ? 'complete' : 'seated');
    assert.equal(officeInitialView(url), ACADEMIC_OFFICE ? 1 : 0);
  });
  for (const path of ['/?exhibit=ai', '/?exhibit=education&talk=123', '/?exhibit=research', '/cv', '/#office-reading']) {
    test(`direct destination ${path} bypasses the intro`, () => {
      assert.equal(officeEntryPhase(new URL(path, 'https://takmd.com')), 'complete');
      assert.equal(officeInitialView(new URL(path, 'https://takmd.com')), 0);
    });
  }
  test('poster capture holds its seated pose without starting the reveal', () => {
    assert.equal(officeEntryPhase(new URL('https://takmd.com/?office-capture=seated')), 'capture');
    assert.equal(officeEntryPhase(new URL('https://takmd.com/?office-capture=overview')), 'complete');
    assert.equal(officeInitialView(new URL('https://takmd.com/?office-capture=overview')), 0);
  });
});
