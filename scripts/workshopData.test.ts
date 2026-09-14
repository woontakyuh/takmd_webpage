import assert from 'node:assert/strict';
import { workshops, workshopSlugs, getWorkshop } from '../src/data/workshops';
import { curriculumStages, competencyDomains, competencyKeys } from '../src/data/workshop-curriculum';
import { workshopTeam, isTeamMember } from '../src/data/workshop-team';

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


// --- workshop-curriculum.ts ---
assert.deepEqual(curriculumStages.map((s) => s.n), [1, 2, 3, 4, 5]);
assert.deepEqual(curriculumStages.map((s) => s.slug), [undefined, undefined, 'dummy', 'animal-pig', 'cadaver']);
for (const s of curriculumStages) assert.ok(s.title && s.titleKo, `stage ${s.n} titles`);
for (const s of curriculumStages) {
  if (s.slug) assert.equal(getWorkshop(s.slug)?.stage, s.n, `stage ${s.n} agrees with workshops.ts`);
}
assert.deepEqual(competencyKeys, ['anatomy', 'instrumentation', 'access', 'boneWork', 'softTissue', 'safety']);
assert.deepEqual(competencyDomains.map((d) => d.key), [...competencyKeys]);
for (const d of competencyDomains) assert.ok(d.label && d.labelKo, `domain ${d.key} labels`);


// --- workshop-team.ts ---
assert.equal(workshopTeam.name, 'Spinoscopy Workshop Team');
assert.equal(workshopTeam.members.length, 8);
assert.equal(new Set(workshopTeam.members.map((m) => m.nameKo)).size, 8, 'unique members');
for (const m of workshopTeam.members) assert.ok(m.name && m.nameKo && m.affiliation, `member ${m.nameKo}`);
assert.equal(workshopTeam.members[0].name, 'Woon Tak Yuh');
assert.ok(isTeamMember('최일'));
assert.ok(!isTeamMember('김진성'));

console.log('workshopData: all checks passed');
