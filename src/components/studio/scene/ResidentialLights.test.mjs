import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { residentialOccupancy } from './ResidentialLights.ts';
describe('Seoul residential lights-out schedule', () => {
  it('retains evening windows, progressively reduces them across midnight and keeps a sparse overnight population', () => {
    assert.equal(residentialOccupancy(21.99), 1);
    assert.equal(residentialOccupancy(22), 1);
    let previous = 1;
    for (let minute = 0; minute <= 240; minute++) {
      const value = residentialOccupancy(22 + minute / 60);
      assert.ok(value <= previous + 1e-12 && value >= .079999);
      previous = value;
    }
    assert.ok(Math.abs(residentialOccupancy(0) - .54) < 1e-9);
    assert.equal(residentialOccupancy(4), .08);
    assert.equal(residentialOccupancy(8), 1);
    assert.equal(residentialOccupancy(24), residentialOccupancy(0));
  });
});
