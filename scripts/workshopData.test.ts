import assert from 'node:assert/strict';
import { workshops, workshopSlugs, getWorkshop } from '../src/data/workshops';

// --- workshops.ts ---
assert.deepEqual(workshopSlugs, ['dummy', 'cadaver', 'animal-pig'], 'slug contract used by WorkshopObjects.tsx');
assert.deepEqual(workshops.map((w) => w.slug), [...workshopSlugs], 'record order matches slug order');
assert.deepEqual(workshops.map((w) => w.stage), [3, 5, 4], 'dummy=3, cadaver=5, animal-pig=4');
for (const w of workshops) {
  assert.ok(w.titleKo.length > 0, `${w.slug} titleKo`);
  assert.ok(w.focus.length >= 3, `${w.slug} focus kept`);
}
assert.equal(getWorkshop('dummy')?.defaultVenue?.city, 'Hwaseong');
assert.equal(getWorkshop('animal-pig')?.defaultVenue?.city, 'Incheon');
assert.equal(getWorkshop('cadaver')?.defaultVenue, undefined);

console.log('workshopData: workshops.ts checks passed');
