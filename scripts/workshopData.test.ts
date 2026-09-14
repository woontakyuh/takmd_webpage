import assert from 'node:assert/strict';
import { workshops, workshopSlugs, getWorkshop } from '../src/data/workshops';
import { curriculumStages, competencyDomains, competencyKeys } from '../src/data/workshop-curriculum';
import { workshopTeam, isTeamMember } from '../src/data/workshop-team';
import { workshopSessions, getSession, sessionsFor } from '../src/data/workshop-sessions';
import { workshopOutcomes, outcomeFor } from '../src/data/workshop-outcomes';
import { facultyAppearances } from '../src/data/workshop-faculty-appearances';
import presentationsJson from '../src/data/presentations.json';

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


// --- workshop-sessions.ts ---
assert.equal(workshopSessions.length, 8);
workshopSessions.forEach((s, i) => {
  assert.equal(s.seriesNo, i + 1, `seriesNo contiguous at ${s.id}`);
  assert.equal(s.id, `${s.date}-${s.workshop}`, `id = date-slug at ${s.id}`);
  assert.ok(workshopSlugs.includes(s.workshop), `known slug at ${s.id}`);
  assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(s.date), `ISO date at ${s.id}`);
  if (i > 0) assert.ok(s.date > workshopSessions[i - 1].date, `ascending dates at ${s.id}`);
  assert.ok(s.title && s.audience && s.role && s.sources.length > 0, `required text at ${s.id}`);
  if (s.status === 'held') assert.ok(s.venue, `held session has venue at ${s.id}`);
  if (s.trainees) assert.ok(s.trainees.count > 0, `trainee count at ${s.id}`);
  for (const src of s.sources) assert.ok(!/[/\\]|notion\.|[0-9a-f]{32}/i.test(src), `sources are memos, not paths/ids at ${s.id}: ${src}`);
});
for (const slug of workshopSlugs) {
  const list = sessionsFor(slug);
  list.forEach((s, i) => assert.equal(s.modalityNo, i + 1, `modalityNo contiguous for ${slug}`));
}
assert.deepEqual(sessionsFor('dummy').length, 5);
assert.deepEqual(sessionsFor('animal-pig').length, 2);
assert.deepEqual(sessionsFor('cadaver').map((s) => s.status), ['planned']);
assert.equal(getSession('2026-08-08-animal-pig')?.certification, true);
assert.equal(getSession('2025-12-20-animal-pig')?.trainees?.count, 8);
assert.equal(getSession('2026-02-21-dummy'), undefined, 'the 2026-02-21 entry was a team dinner, not a workshop');
assert.equal(getSession('2026-06-13-dummy')?.venue?.nameKo, 'HLB바이오스텝');
assert.equal(getSession('2026-08-08-animal-pig')?.seriesNo, 7, 'matches the official "The 7th" title');
assert.equal(getSession('2026-12-20-cadaver')?.venue?.city, 'Seoul');
assert.equal(getSession('2026-12-19-cadaver'), undefined, 'organiser moved it to the 20th');


// --- workshop-outcomes.ts ---
assert.equal(workshopOutcomes.length, 1);
for (const o of workshopOutcomes) {
  assert.ok(getSession(o.sessionId), `outcome session exists: ${o.sessionId}`);
  assert.equal(getSession(o.sessionId)?.trainees?.count, o.n, 'n matches session trainees');
  assert.deepEqual(o.domains.map((d) => d.key), [...competencyKeys], 'one entry per domain, in order');
  for (const d of o.domains) {
    assert.ok(d.pre >= o.scale.min * 3 && d.post <= o.scale.domainMax, `range ${d.key}`);
    assert.ok(d.post > d.pre, `post > pre for ${d.key}`);
  }
  assert.ok(o.quotes.length >= 3 && o.quotes.every((q) => q.en && q.ko), 'bilingual quotes');
  assert.ok(o.difficulties && o.difficulties.length >= 3);
}
assert.equal(outcomeFor('2025-12-20-animal-pig')?.domains[0].post, 9.25);
assert.equal(outcomeFor('2026-08-08-animal-pig'), undefined);


// --- workshop-faculty-appearances.ts ---
const presentationIds = new Set((presentationsJson as { presentations: { id: string }[] }).presentations.map((p) => p.id));
assert.equal(facultyAppearances.length, 4);
assert.deepEqual(facultyAppearances.map((a) => a.relation).sort(), ['individual', 'individual', 'team-dispatch', 'team-support']);
for (const a of facultyAppearances) {
  assert.ok(a.id && a.event && a.date && a.venue.country, `required at ${a.id}`);
  assert.ok(workshopSlugs.includes(a.modality), `modality at ${a.id}`);
  if (a.links?.presentationId) assert.ok(presentationIds.has(a.links.presentationId), `presentation exists for ${a.id}`);
  if (a.relation === 'team-dispatch') assert.ok(a.requestedBy, 'dispatch records who asked');
  for (const src of a.sources) assert.ok(!/[/\\]|notion\.|[0-9a-f]{32}/i.test(src), `sources are memos at ${a.id}`);
}
assert.equal(facultyAppearances.find((a) => a.event === 'Spine Summit')?.links?.presentationId, '2c7908af25b980edbfc6df234f22a8f1');

console.log('workshopData: all checks passed');
