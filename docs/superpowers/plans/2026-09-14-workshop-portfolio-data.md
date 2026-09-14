# Workshop Portfolio Data & Photos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce the typed workshop data files, the photo import pipeline, the curated photo set, and their validation tests so that Astra can build `/workshops` and the three modality pages purely from imports.

**Architecture:** Hand-authored TypeScript data under `src/data/workshop-*.ts` (one file per concern: curriculum, team, sessions, outcomes, faculty appearances) plus one generated manifest `src/data/workshop-photos.json`. Photos flow `content/workshops/<sessionId>/<role>-NN.jpg` (gitignored originals) → `scripts/import-workshop-photos.mjs` (sharp, EXIF stripped) → `public/images/workshops/<sessionId>/`. Plain `node:assert` test scripts under `scripts/` (repo convention) pin data invariants and manifest/file consistency.

**Tech Stack:** Astro 5 project, Bun 1.3 (runs TS test scripts directly), sharp 0.34, osxphotos CLI (`~/.local/bin/osxphotos`) for pulling originals from the owner's Photos library.

**Spec:** `docs/superpowers/specs/2026-09-14-workshop-portfolio-design.md` — sections 3 (schema), 4 (photo pipeline), 6 (boundary). Section 5 (pages) is Astra's and is **not** in this plan.

## Global Constraints

- Slugs `dummy` / `cadaver` / `animal-pig` are referenced by `src/components/studio/scene/WorkshopObjects.tsx`; never rename or reorder the existing three records in `src/data/workshops.ts`. Add fields only.
- Public repo: no trainee names, no individual scores, no survey originals, no personal file paths, Notion IDs, budgets, or phone numbers anywhere in committed files. `sources` entries are short memos like `"1st dummy agenda PDF"`, `"GCal Conference"`.
- Language: English fields first; official Korean names in `titleKo` / `nameKo` / `labelKo`.
- Photos: faces allowed only in `group` role (group photos, certification ceremony). `lecture` = speaker from behind / screen; `practice` = hands, instruments, dummy, monitor — no frontal trainee faces. 6–12 photos per session, ~80 total.
- Importer output: long edge 1600 px WebP q85 + `-thumb` long edge 480 px; sharp re-encode strips EXIF/GPS; `rotate()` applies orientation; filename = first 16 hex of sha256 of original bytes.
- Tests are plain `node:assert/strict` scripts in `scripts/` named `*.test.ts`, run with `bun run scripts/<name>.test.ts` (exit 0 = pass). This deviates from the spec's `src/data/*.test.ts` location to match the repo convention.
- Two small deviations from the spec's schema, both driven by the "English first" decision and by planned sessions: `WorkshopOutcome.quotes` is `{ en: string; ko: string }[]` (spec: `string[]`), and `WorkshopSession.venue` is optional so a `planned` session without a confirmed venue type-checks (spec: required).
- Commit after every task with the attribution lines the session reminder requires.

---

## File map

| Path | Responsibility | Task |
|---|---|---|
| `src/data/workshops.ts` | existing 3 modality records + `stage`, `titleKo`, `defaultVenue` | 1 |
| `src/data/workshop-curriculum.ts` | 5 curriculum stages, 6 competency domains, `CompetencyKey` | 2 |
| `src/data/workshop-team.ts` | Spinoscopy Workshop Team, 8 members | 3 |
| `src/data/workshop-sessions.ts` | 9 team-program sessions, `WorkshopSession` type, helpers | 4 |
| `src/data/workshop-outcomes.ts` | pre/post aggregates for 2025-12-20, quotes, difficulties | 5 |
| `src/data/workshop-faculty-appearances.ts` | 4 non-program appearances (`FacultyAppearance`) | 6 |
| `scripts/workshopData.test.ts` | invariants across all data files | 1–6 (grows per task) |
| `content/workshops/.gitignore`, `README.md` | originals folder contract | 7 |
| `scripts/import-workshop-photos.mjs` | originals → public webp + manifest | 7 |
| `src/data/workshop-photos.json` | generated manifest (committed) | 7 |
| `scripts/workshopPhotos.test.ts` | manifest ↔ sessions ↔ files consistency | 7 |
| `package.json` | `photos:workshops` script | 7 |
| `public/images/workshops/**` | generated webp (committed) | 8–9 |

---

### Task 1: Extend `workshops.ts` and start the data test

**Files:**
- Modify: `src/data/workshops.ts`
- Create: `scripts/workshopData.test.ts`

**Interfaces:**
- Produces: `Workshop` gains `stage: 3 | 4 | 5`, `titleKo: string`, `defaultVenue?: { name: string; city: string }`. `workshops`, `workshopSlugs`, `WorkshopSlug`, `getWorkshop` unchanged in name and behavior.

- [ ] **Step 1: Write the failing test**

Create `scripts/workshopData.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run scripts/workshopData.test.ts`
Expected: FAIL — `AssertionError` on `w.stage` (undefined) or TypeScript complaint that `stage` does not exist.

- [ ] **Step 3: Add the fields**

Replace the `Workshop` type and the three records in `src/data/workshops.ts` with:

```ts
export const workshopSlugs = ['dummy', 'cadaver', 'animal-pig'] as const;

export type WorkshopSlug = (typeof workshopSlugs)[number];

export type WorkshopVenue = {
  readonly name: string;
  readonly city: string;
};

export type Workshop = {
  readonly slug: WorkshopSlug;
  readonly title: string;
  readonly titleKo: string;
  /** Position in the five-step curriculum (see workshop-curriculum.ts). */
  readonly stage: 3 | 4 | 5;
  readonly objectLabel: string;
  readonly description: string;
  readonly focus: readonly string[];
  readonly defaultVenue?: WorkshopVenue;
};

export const workshops = [
  {
    slug: 'dummy',
    title: 'Dummy workshop',
    titleKo: '더미 워크샵',
    stage: 3,
    objectLabel: 'UpSurgeOn Endoscopic LumbarBox',
    description: 'Simulation-based spine training with the UpSurgeOn Endoscopic LumbarBox for portal setup, instrument orientation, and stepwise rehearsal.',
    focus: ['Portal setup', 'Instrument orientation', 'Stepwise rehearsal'],
    defaultVenue: { name: 'Hallym University Dongtan Sacred Heart Hospital', city: 'Hwaseong' },
  },
  {
    slug: 'cadaver',
    title: 'Cadaver workshop',
    titleKo: '카데바 워크샵',
    stage: 5,
    objectLabel: 'Biportal instruments',
    description: 'Anatomy-based training for orientation, portal planning, and technique sequence.',
    focus: ['Anatomical orientation', 'Portal planning', 'Technique sequence'],
  },
  {
    slug: 'animal-pig',
    title: 'Animal (pig) live workshop',
    titleKo: '동물(돼지) 라이브 워크샵',
    stage: 4,
    objectLabel: 'Pig workshop',
    description: 'Live animal workshop materials organized around program context and training scope.',
    focus: ['Workshop format', 'Training scope', 'Teaching materials'],
    defaultVenue: { name: 'HLB Biostep training lab', city: 'Incheon' },
  },
] as const satisfies readonly Workshop[];

export function getWorkshop(slug: string): Workshop | undefined {
  return workshops.find((workshop) => workshop.slug === slug);
}
```

- [ ] **Step 4: Run test and type check**

Run: `bun run scripts/workshopData.test.ts && bunx astro check 2>&1 | tail -3`
Expected: `workshopData: workshops.ts checks passed`; astro check reports 0 errors (warnings that pre-exist are fine — compare against `git stash`-free baseline by running `bunx astro check` before editing if unsure).

- [ ] **Step 5: Commit**

```bash
git add src/data/workshops.ts scripts/workshopData.test.ts
git commit -m "feat(workshops): add curriculum stage, Korean title and default venue to modality records"
```

---

### Task 2: Curriculum stages and competency domains

**Files:**
- Create: `src/data/workshop-curriculum.ts`
- Modify: `scripts/workshopData.test.ts`

**Interfaces:**
- Produces: `curriculumStages: readonly CurriculumStage[]` (5), `competencyDomains: readonly CompetencyDomain[]` (6), `CompetencyKey` union `'anatomy' | 'instrumentation' | 'access' | 'boneWork' | 'softTissue' | 'safety'`, `competencyKeys` tuple.

- [ ] **Step 1: Append failing assertions to the test**

Append to `scripts/workshopData.test.ts` (before the final `console.log`, and change that log line to `console.log('workshopData: all checks passed')` — keep it last):

```ts
import { curriculumStages, competencyDomains, competencyKeys } from '../src/data/workshop-curriculum';

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run scripts/workshopData.test.ts`
Expected: FAIL — cannot resolve `../src/data/workshop-curriculum`.

- [ ] **Step 3: Create the file**

`src/data/workshop-curriculum.ts`:

```ts
import type { WorkshopSlug } from './workshops';

export type CurriculumStage = {
  readonly n: 1 | 2 | 3 | 4 | 5;
  readonly title: string;
  readonly titleKo: string;
  /** Present when the stage has its own modality page. */
  readonly slug?: WorkshopSlug;
  readonly summary: string;
};

/** The five-step learning chain the team designed; stages loop back on one another rather than run once. */
export const curriculumStages = [
  { n: 1, title: 'Textbook and surgical video', titleKo: '교과서·수술 영상 학습', summary: 'Self-study of anatomy, instruments and recorded procedures.' },
  { n: 2, title: 'OR observation and limited assist', titleKo: '수술 참관·제한적 어시스트', summary: 'Watching live cases and assisting where the endoscopic workflow allows.' },
  { n: 3, title: 'Dummy simulation', titleKo: '더미 시뮬레이션', slug: 'dummy', summary: 'Portal setup, orientation and stepwise rehearsal on a lumbar simulator.' },
  { n: 4, title: 'Live animal lab', titleKo: '살아있는 동물(돼지) 실습', slug: 'animal-pig', summary: 'Bleeding, tissue response and instrument handling under real physiology.' },
  { n: 5, title: 'Cadaver lab', titleKo: '카데바 실습', slug: 'cadaver', summary: 'Human anatomy for corridor planning and decompression sequence.' },
] as const satisfies readonly CurriculumStage[];

export const competencyKeys = ['anatomy', 'instrumentation', 'access', 'boneWork', 'softTissue', 'safety'] as const;

export type CompetencyKey = (typeof competencyKeys)[number];

export type CompetencyDomain = {
  readonly key: CompetencyKey;
  readonly label: string;
  readonly labelKo: string;
};

/** Six core competency domains scored 0–15 each (3 items × 0–5) in pre/post self-assessment. */
export const competencyDomains = [
  { key: 'anatomy', label: 'Endoscopic anatomy and spatial orientation', labelKo: '내시경 해부학 인지·공간 지각' },
  { key: 'instrumentation', label: 'Instrument handling and endoscopic ergonomics', labelKo: '기구 조작·내시경 인체공학' },
  { key: 'access', label: 'Access planning and corridor establishment', labelKo: '접근 계획·작업 통로 형성' },
  { key: 'boneWork', label: 'Targeted bony decompression', labelKo: '목표 골 감압' },
  { key: 'softTissue', label: 'Soft tissue handling and neural safety', labelKo: '연부조직 처리·신경 안전' },
  { key: 'safety', label: 'Intraoperative physiology and safety management', labelKo: '수술 중 생리·안전 관리' },
] as const satisfies readonly CompetencyDomain[];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run scripts/workshopData.test.ts`
Expected: `workshopData: all checks passed`

- [ ] **Step 5: Commit**

```bash
git add src/data/workshop-curriculum.ts scripts/workshopData.test.ts
git commit -m "feat(workshops): add five-stage curriculum and six competency domains"
```

---

### Task 3: Team

**Files:**
- Create: `src/data/workshop-team.ts`
- Modify: `scripts/workshopData.test.ts`

**Interfaces:**
- Produces: `workshopTeam: { name; nameKo; summary; members: readonly TeamMember[] }`, `TeamMember = { name; nameKo; affiliation }`, `isTeamMember(nameKo: string): boolean`.

Names and affiliations below are the values confirmed with the owner at plan review (see the handoff message). If the owner corrects any, edit the record — the test only checks shape and count.

- [ ] **Step 1: Append failing assertions**

```ts
import { workshopTeam, isTeamMember } from '../src/data/workshop-team';

// --- workshop-team.ts ---
assert.equal(workshopTeam.name, 'Spinoscopy Workshop Team');
assert.equal(workshopTeam.members.length, 8);
assert.equal(new Set(workshopTeam.members.map((m) => m.nameKo)).size, 8, 'unique members');
for (const m of workshopTeam.members) assert.ok(m.name && m.nameKo && m.affiliation, `member ${m.nameKo}`);
assert.equal(workshopTeam.members[0].name, 'Woon Tak Yuh');
assert.ok(isTeamMember('최일'));
assert.ok(!isTeamMember('김진성'));
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run scripts/workshopData.test.ts`
Expected: FAIL — cannot resolve `../src/data/workshop-team`.

- [ ] **Step 3: Create the file**

```ts
export type TeamMember = {
  readonly name: string;
  readonly nameKo: string;
  readonly affiliation: string;
};

export const workshopTeam = {
  name: 'Spinoscopy Workshop Team',
  nameKo: '스피노스코피 워크샵 팀',
  summary:
    'Eight endoscopic spine surgeons who run the ESS Workshop for Beginners together — the same faculty, in matching team uniforms, across dummy, live-animal and cadaver sessions — so that trainees meet one continuous teaching voice from the simulator to the cadaver table.',
  members: [
    { name: 'Woon Tak Yuh', nameKo: '여운탁', affiliation: 'Davos Hospital, Yongin' },
    { name: 'Il Choi', nameKo: '최일', affiliation: 'Hallym University Dongtan Sacred Heart Hospital' },
    { name: 'Yong-San Ko', nameKo: '고용산', affiliation: 'Kyungpook National University Hospital' },
    { name: 'Subum Lee', nameKo: '이수범', affiliation: 'Korea University Anam Hospital' },
    { name: 'Jae-Koo Lee', nameKo: '이재구', affiliation: 'Seoul National University Bundang Hospital' },
    { name: 'Jun-Su Jang', nameKo: '장준수', affiliation: 'Hallym University Dongtan Sacred Heart Hospital' },
    { name: 'Seung-Chan Yoo', nameKo: '유승찬', affiliation: "Incheon St. Mary's Hospital, The Catholic University of Korea" },
    { name: 'Chan Yang Noh', nameKo: '노찬양', affiliation: 'Hallym University Dongtan Sacred Heart Hospital' },
  ],
} as const satisfies { name: string; nameKo: string; summary: string; members: readonly TeamMember[] };

export function isTeamMember(nameKo: string): boolean {
  return workshopTeam.members.some((member) => member.nameKo === nameKo);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run scripts/workshopData.test.ts`
Expected: `workshopData: all checks passed`

- [ ] **Step 5: Commit**

```bash
git add src/data/workshop-team.ts scripts/workshopData.test.ts
git commit -m "feat(workshops): add Spinoscopy Workshop Team roster"
```

---

### Task 4: Sessions

**Files:**
- Create: `src/data/workshop-sessions.ts`
- Modify: `scripts/workshopData.test.ts`

**Interfaces:**
- Produces: `WorkshopSession` type (spec §3 with `venue?` optional), `workshopSessions: readonly WorkshopSession[]` (9, date ascending), `getSession(id)`, `sessionsFor(slug)`, `SessionStatus = 'held' | 'planned'`, `WorkshopPhotoRole` is **not** here (Task 7).

- [ ] **Step 1: Append failing assertions**

```ts
import { workshopSessions, getSession, sessionsFor } from '../src/data/workshop-sessions';

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
assert.equal(getSession('2026-12-19-cadaver')?.venue, undefined);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run scripts/workshopData.test.ts`
Expected: FAIL — cannot resolve `../src/data/workshop-sessions`.

- [ ] **Step 3: Create the file**

```ts
import type { WorkshopSlug, WorkshopVenue } from './workshops';

export type SessionStatus = 'held' | 'planned';

export type SessionLecture = {
  readonly title: string;
  readonly titleKo?: string;
  readonly speaker: string;
  readonly affiliation: string;
};

export type SessionHandsOn = {
  readonly format: string;
  readonly groups?: number;
  readonly sessions?: number;
  readonly durationMin?: number;
};

export type SessionVenue = WorkshopVenue & { readonly nameKo?: string };

export type WorkshopSession = {
  /** 'YYYY-MM-DD-<slug>'; also the photo folder name. */
  readonly id: string;
  readonly workshop: WorkshopSlug;
  /** Running number across all modalities, in the order sessions were actually held. */
  readonly seriesNo: number;
  /** Running number within one modality. */
  readonly modalityNo: number;
  readonly date: string;
  readonly endDate?: string;
  readonly status: SessionStatus;
  readonly title: string;
  readonly titleKo?: string;
  readonly venue?: SessionVenue;
  readonly host?: readonly string[];
  readonly organizers?: readonly string[];
  readonly audience: string;
  /** Woon Tak Yuh's role in this session. */
  readonly role: 'director' | 'faculty' | 'lecturer';
  readonly lectures?: readonly SessionLecture[];
  readonly handsOn?: SessionHandsOn;
  /** Aggregate only — never names. Absent until a roster is confirmed. */
  readonly trainees?: { readonly count: number; readonly composition?: readonly string[] };
  readonly certification?: boolean;
  /** Short provenance memos for maintainers; not rendered. */
  readonly sources: readonly string[];
};

const DONGTAN: SessionVenue = {
  name: 'Hallym University Dongtan Sacred Heart Hospital',
  nameKo: '한림대학교 동탄성심병원',
  city: 'Hwaseong',
};

const HLB: SessionVenue = {
  name: 'HLB Biostep training lab (4F)',
  nameKo: 'HLB바이오스텝 4층 실습실',
  city: 'Incheon',
};

const PORCINE_ANATOMY: SessionLecture = {
  title: 'Comparative anatomy of the human and porcine spine',
  titleKo: '사람과 돼지 척추 형태 비교',
  speaker: 'Dong-Choon Ahn',
  affiliation: 'College of Veterinary Medicine, Jeonbuk National University',
};

export const workshopSessions = [
  {
    id: '2025-05-04-dummy',
    workshop: 'dummy',
    seriesNo: 1,
    modalityNo: 1,
    date: '2025-05-04',
    status: 'held',
    title: 'Endoscopic Spine Surgery Dummy Workshop for Beginners — based on anatomy and pathologies',
    titleKo: 'UBE 더미 워크샵 (사직전공의 대상) 1차',
    venue: DONGTAN,
    host: ['Hallym University Dongtan Sacred Heart Hospital'],
    audience: 'Residents who had resigned during the 2024–25 training-system dispute',
    role: 'lecturer',
    lectures: [
      { title: 'Getting started with endoscopic spine surgery — why, and with which instruments', titleKo: '내시경 척추수술의 시작 — 왜 필요한가, 그리고 어떤 도구를 쓰는가', speaker: 'Il Choi', affiliation: 'Hallym University Dongtan Sacred Heart Hospital' },
      { title: 'Basic anatomy and imaging for endoscopic spine surgery', titleKo: '내시경 척추수술을 위한 기본 해부학과 영상 이해', speaker: 'Woon Tak Yuh', affiliation: 'Davos Hospital' },
      { title: 'Learning from cases — real techniques and tips', titleKo: '케이스로 배우는 내시경 수술 — 실제 술기와 팁', speaker: 'Jun-Su Jang', affiliation: 'Hallym University Dongtan Sacred Heart Hospital' },
    ],
    handsOn: { format: 'Three small groups rotating through dummy stations', groups: 3, sessions: 2, durationMin: 120 },
    sources: ['1st dummy agenda PDF', 'GCal DT NS Spine'],
  },
  {
    id: '2025-06-15-dummy',
    workshop: 'dummy',
    seriesNo: 2,
    modalityNo: 2,
    date: '2025-06-15',
    status: 'held',
    title: 'Endoscopic Spine Surgery Dummy Workshop for Beginners (2nd)',
    titleKo: 'UBE 더미 워크샵 (사직전공의 대상) 2차',
    venue: DONGTAN,
    host: ['Hallym University Dongtan Sacred Heart Hospital'],
    audience: 'Residents who had resigned during the 2024–25 training-system dispute',
    role: 'lecturer',
    lectures: [
      { title: 'Introduction to UBE for beginners', speaker: 'Woon Tak Yuh', affiliation: 'Davos Hospital' },
    ],
    handsOn: { format: 'Small-group dummy stations', groups: 3 },
    sources: ['Notion Schedule', '2nd dummy lecture deck', 'GCal DT NS Spine'],
  },
  {
    id: '2025-08-24-dummy',
    workshop: 'dummy',
    seriesNo: 3,
    modalityNo: 3,
    date: '2025-08-24',
    status: 'held',
    title: 'Endoscopic Spine Surgery Dummy Workshop for Beginners (3rd)',
    titleKo: '더미 워크샵 3차',
    venue: DONGTAN,
    host: ['Hallym University Dongtan Sacred Heart Hospital'],
    audience: 'Beginner spine surgeons and residents',
    role: 'faculty',
    handsOn: { format: 'Small-group dummy stations' },
    sources: ['GCal Conference'],
  },
  {
    id: '2025-10-12-dummy',
    workshop: 'dummy',
    seriesNo: 4,
    modalityNo: 4,
    date: '2025-10-12',
    status: 'held',
    title: 'Endoscopic Spine Surgery Dummy Workshop for Beginners (4th)',
    titleKo: '더미 워크샵 4차',
    venue: DONGTAN,
    host: ['Hallym University Dongtan Sacred Heart Hospital'],
    audience: 'Beginner spine surgeons and residents',
    role: 'faculty',
    handsOn: { format: 'Small-group dummy stations' },
    sources: ['GCal Conference (moved from 2025-10-05)'],
  },
  {
    id: '2025-12-20-animal-pig',
    workshop: 'animal-pig',
    seriesNo: 5,
    modalityNo: 1,
    date: '2025-12-20',
    status: 'held',
    title: 'Endoscopic Spine Surgery 1st Animal Lab Workshop for Beginners — based on anatomy and pathologies',
    titleKo: '척추 내시경 동물 실습 워크샵 1회',
    venue: HLB,
    host: ['Hallym University Dongtan Sacred Heart Hospital'],
    audience: 'Beginner spine surgeons (0–30 endoscopic cases)',
    role: 'faculty',
    lectures: [PORCINE_ANATOMY],
    handsOn: { format: 'Live porcine model, one station per small group', durationMin: 180 },
    trainees: {
      count: 8,
      composition: ['Fellow ×3', 'Clinical assistant professor ×1', 'Resident ×1', 'Military hospital surgeon ×2', 'Regional hospital orthopaedic surgeon ×1'],
    },
    sources: ['Dec 2025 workshop poster', 'Pre-post evaluation summary', 'GCal Conference'],
  },
  {
    id: '2026-02-21-dummy',
    workshop: 'dummy',
    seriesNo: 6,
    modalityNo: 5,
    date: '2026-02-21',
    status: 'held',
    title: 'Endoscopic Spine Surgery Dummy Workshop for Beginners (2026 · 1st)',
    titleKo: '2026 더미 워크샵 1회',
    venue: DONGTAN,
    host: ['Hallym University Dongtan Sacred Heart Hospital'],
    audience: 'Beginner spine surgeons and residents',
    role: 'faculty',
    handsOn: { format: 'Small-group dummy stations' },
    sources: ['GCal Conference'],
  },
  {
    id: '2026-06-13-dummy',
    workshop: 'dummy',
    seriesNo: 7,
    modalityNo: 6,
    date: '2026-06-13',
    status: 'held',
    title: 'Endoscopic Spine Surgery Dummy Workshop for Beginners (2026 · 2nd)',
    titleKo: '2026 더미 워크샵 2회',
    venue: DONGTAN,
    host: ['Hallym University Dongtan Sacred Heart Hospital'],
    audience: 'Beginner spine surgeons and residents',
    role: 'faculty',
    lectures: [
      { title: 'Hurdles and Lessons, from Trainee to Trainer', speaker: 'Jae-Koo Lee', affiliation: 'Seoul National University Bundang Hospital' },
    ],
    handsOn: { format: 'Small-group dummy stations' },
    sources: ['Invited lecture deck', 'Workshop photo set', 'GCal Conference'],
  },
  {
    id: '2026-08-08-animal-pig',
    workshop: 'animal-pig',
    seriesNo: 8,
    modalityNo: 2,
    date: '2026-08-08',
    status: 'held',
    title: 'The 7th Endoscopic Spine Surgery Animal Lab Workshop for Beginners',
    titleKo: '2026 동물 워크샵 1회',
    venue: HLB,
    host: ['Hallym University Dongtan Sacred Heart Hospital'],
    organizers: ['endovision', 'Incheon Technopark', 'Hayan Medical'],
    audience: 'Beginner spine surgeons (0–30 endoscopic cases)',
    role: 'faculty',
    lectures: [
      { title: 'Strategies for effective endoscopic spine surgery education', titleKo: '척추 내시경 수술 효과적인 교육을 위한 전략', speaker: 'Jin-Sung Kim', affiliation: "Seoul St. Mary's Hospital, The Catholic University of Korea" },
      PORCINE_ANATOMY,
    ],
    handsOn: { format: 'Live porcine model, morning and afternoon sections with two faculty per group', groups: 2, sessions: 2, durationMin: 300 },
    certification: true,
    sources: ['Official program and invitation', 'GCal Conference'],
  },
  {
    id: '2026-12-19-cadaver',
    workshop: 'cadaver',
    seriesNo: 9,
    modalityNo: 1,
    date: '2026-12-19',
    status: 'planned',
    title: 'Endoscopic Spine Surgery Cadaver Workshop for Beginners (1st)',
    titleKo: '척추 내시경 카데바 워크샵 1회',
    host: ['Hallym University Dongtan Sacred Heart Hospital'],
    audience: 'Beginner spine surgeons who completed the dummy or animal stage',
    role: 'faculty',
    sources: ['GCal Conference (content changed from animal to human cadaver)'],
  },
] as const satisfies readonly WorkshopSession[];

export function getSession(id: string): WorkshopSession | undefined {
  return workshopSessions.find((session) => session.id === id);
}

export function sessionsFor(slug: WorkshopSlug): readonly WorkshopSession[] {
  return workshopSessions.filter((session) => session.workshop === slug);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run scripts/workshopData.test.ts`
Expected: `workshopData: all checks passed`

- [ ] **Step 5: Commit**

```bash
git add src/data/workshop-sessions.ts scripts/workshopData.test.ts
git commit -m "feat(workshops): add the nine team-program sessions"
```

---

### Task 5: Outcomes

**Files:**
- Create: `src/data/workshop-outcomes.ts`
- Modify: `scripts/workshopData.test.ts`

**Interfaces:**
- Consumes: `CompetencyKey`, `competencyKeys` (Task 2); `getSession` (Task 4).
- Produces: `WorkshopOutcome` type, `workshopOutcomes: readonly WorkshopOutcome[]` (1 entry), `outcomeFor(sessionId)`.

Numbers below are the per-domain means (0–15) over the 8 matched pre/post respondents of the 2025-12-20 session, computed from the raw sheets on 2026-09-14. Totals: 38.4 → 52.0 of 90.

- [ ] **Step 1: Append failing assertions**

```ts
import { workshopOutcomes, outcomeFor } from '../src/data/workshop-outcomes';

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run scripts/workshopData.test.ts`
Expected: FAIL — cannot resolve `../src/data/workshop-outcomes`.

- [ ] **Step 3: Create the file**

```ts
import type { CompetencyKey } from './workshop-curriculum';

export type OutcomeQuote = { readonly en: string; readonly ko: string };

export type WorkshopOutcome = {
  readonly sessionId: string;
  /** Respondents with both pre and post forms. */
  readonly n: number;
  readonly scale: { readonly min: 0; readonly max: 5; readonly itemsPerDomain: 3; readonly domainMax: 15 };
  /** Mean domain score (0–15) across respondents, before and after the session. */
  readonly domains: readonly { readonly key: CompetencyKey; readonly pre: number; readonly post: number }[];
  readonly composition: readonly string[];
  /** Anonymous free-text answers to "why did this format help most?". */
  readonly quotes: readonly OutcomeQuote[];
  /** Steps trainees named as where they get stuck, most-cited first. */
  readonly difficulties?: readonly string[];
};

export const workshopOutcomes = [
  {
    sessionId: '2025-12-20-animal-pig',
    n: 8,
    scale: { min: 0, max: 5, itemsPerDomain: 3, domainMax: 15 },
    domains: [
      { key: 'anatomy', pre: 7.0, post: 9.25 },
      { key: 'instrumentation', pre: 7.0, post: 9.38 },
      { key: 'access', pre: 6.5, post: 9.12 },
      { key: 'boneWork', pre: 6.5, post: 8.75 },
      { key: 'softTissue', pre: 5.75, post: 7.88 },
      { key: 'safety', pre: 5.62, post: 7.62 },
    ],
    composition: ['Fellow ×3', 'Clinical assistant professor ×1', 'Resident ×1', 'Military hospital surgeon ×2', 'Regional hospital orthopaedic surgeon ×1'],
    quotes: [
      { en: 'Because it was a live animal, there was bleeding and the nerves reacted — that is what made it useful.', ko: 'Live animal이어서 bleeding과 nerve 반응이 있어서 좋았다.' },
      { en: 'It was the only program where I could actually use the real surgical equipment.', ko: '교육 프로그램 중 실제 수술 장비를 이용할 수 있었던 유일한 기회였습니다.' },
      { en: 'Unlike the dummy or the cadaver, I could practise bleeding control as well as the technique itself.', ko: '직접 술기를 시행할 수 있고 dummy, 카데바와 달리 bleeding control도 연습해볼 수 있어서.' },
      { en: 'The cadaver is anatomically identical to a patient, which I think helps more than the animal in that respect.', ko: '카데바의 경우 동물과 다르게 해부학적으로 동일해서 더 도움이 된 것 같습니다.' },
    ],
    difficulties: ['Docking and soft-tissue dissection', 'Flavectomy', 'Drilling and bone work', 'Finding the upper margin of the caudal lamina'],
  },
] as const satisfies readonly WorkshopOutcome[];

export function outcomeFor(sessionId: string): WorkshopOutcome | undefined {
  return workshopOutcomes.find((outcome) => outcome.sessionId === sessionId);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run scripts/workshopData.test.ts`
Expected: `workshopData: all checks passed`

- [ ] **Step 5: Commit**

```bash
git add src/data/workshop-outcomes.ts scripts/workshopData.test.ts
git commit -m "feat(workshops): add aggregated pre/post outcomes for the first animal lab"
```

---

### Task 6: Faculty appearances outside the team program

**Files:**
- Create: `src/data/workshop-faculty-appearances.ts`
- Modify: `scripts/workshopData.test.ts`

**Interfaces:**
- Consumes: `WorkshopSlug`; `presentations.json` ids (`src/data/presentations.json` → `presentations[].id`).
- Produces: `FacultyAppearance` type, `facultyAppearances: readonly FacultyAppearance[]` (4), `AppearanceRelation = 'team-dispatch' | 'team-support' | 'individual'`.

- [ ] **Step 1: Append failing assertions**

```ts
import { facultyAppearances } from '../src/data/workshop-faculty-appearances';
import presentationsJson from '../src/data/presentations.json';

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run scripts/workshopData.test.ts`
Expected: FAIL — cannot resolve `../src/data/workshop-faculty-appearances`.

- [ ] **Step 3: Create the file**

```ts
import type { WorkshopSlug } from './workshops';

export type AppearanceRelation = 'team-dispatch' | 'team-support' | 'individual';

export type FacultyAppearance = {
  readonly id: string;
  readonly date: string;
  readonly endDate?: string;
  readonly status: 'held' | 'planned';
  readonly event: string;
  readonly title?: string;
  readonly modality: WorkshopSlug;
  /**
   * team-dispatch: the team was asked and sent faculty as a team.
   * team-support: another organizer's event that team faculty helped run.
   * individual: a personal faculty invitation.
   */
  readonly relation: AppearanceRelation;
  readonly venue: { readonly name: string; readonly city: string; readonly country: string };
  readonly requestedBy?: { readonly name: string; readonly affiliation: string };
  readonly teamMembers?: readonly string[];
  readonly note?: string;
  readonly links?: { readonly presentationId?: string; readonly mediaCaption?: string };
  readonly sources: readonly string[];
};

export const facultyAppearances = [
  {
    id: '2026-02-26-spine-summit',
    date: '2026-02-26',
    endDate: '2026-02-28',
    status: 'held',
    event: 'Spine Summit',
    title: 'Special Course 4 — cadaver lab instructor',
    modality: 'cadaver',
    relation: 'individual',
    venue: { name: 'Spine Summit 2026', city: 'Phoenix, AZ', country: 'USA' },
    note: 'Personal faculty invitation; already listed under presentations.',
    links: { presentationId: '2c7908af25b980edbfc6df234f22a8f1' },
    sources: ['Spine Summit faculty letter', 'Notion Schedule'],
  },
  {
    id: '2026-06-08-tsess-hualien',
    date: '2026-06-08',
    endDate: '2026-06-09',
    status: 'held',
    event: 'TSESS 2026 endoscopic spine cadaver workshop',
    title: 'FE/BE interlaminar and transforaminal decompression, PCF and TLIF stations',
    modality: 'cadaver',
    relation: 'team-dispatch',
    venue: { name: 'Tzu Chi University Medical Simulation Center', city: 'Hualien', country: 'Taiwan' },
    requestedBy: { name: 'Chien-Min Chen', affiliation: 'Taiwan Society of Endoscopic Spine Surgery' },
    note: 'Requested as a team; both societies agreed to keep exchanging faculty on request.',
    sources: ['Notion Schedule', 'Team discussion'],
  },
  {
    id: '2026-09-12-cgbio-cadaver',
    date: '2026-09-12',
    status: 'held',
    event: 'CGBIO Academy cadaver workshop',
    title: 'Mastering the Endoscope Essentials: From Heritage to Hybrid',
    modality: 'cadaver',
    relation: 'individual',
    venue: { name: 'Catholic International Bioskills Education Center', city: 'Seoul', country: 'Korea' },
    note: 'Faculty; participants from Korea and Brazil.',
    sources: ['Workshop program', 'GCal Conference'],
  },
  {
    id: '2026-11-29-wsc-dummy',
    date: '2026-11-29',
    status: 'planned',
    event: 'WSC 2026 / 25th KOMISS Symposium',
    title: 'Dummy workshop day (Room 4)',
    modality: 'dummy',
    relation: 'team-support',
    venue: { name: 'Songdo ConvensiA', city: 'Incheon', country: 'Korea' },
    note: 'KOMISS-hosted congress; team faculty support the dummy workshop that Woon Tak Yuh coordinates as academic secretary.',
    sources: ['WSC academic committee notes'],
  },
] as const satisfies readonly FacultyAppearance[];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run scripts/workshopData.test.ts`
Expected: `workshopData: all checks passed`

- [ ] **Step 5: Commit**

```bash
git add src/data/workshop-faculty-appearances.ts scripts/workshopData.test.ts
git commit -m "feat(workshops): record faculty appearances outside the team program"
```

---

### Task 7: Photo importer, empty manifest, manifest test

**Files:**
- Create: `content/workshops/.gitignore`, `content/workshops/README.md`
- Create: `scripts/import-workshop-photos.mjs`
- Create: `src/data/workshop-photos.json` (initially `[]`)
- Create: `scripts/workshopPhotos.test.ts`
- Modify: `package.json` (scripts)

**Interfaces:**
- Consumes: `workshopSessions` ids (Task 4) — the importer only accepts folders whose name is a known session id.
- Produces: manifest entries `{ sessionId: string; role: 'group' | 'lecture' | 'practice' | 'venue'; order: number; src: string; thumb: string; width: number; height: number }[]`, sorted by sessionId, role order (group, lecture, practice, venue), then `order`. Script `bun run photos:workshops`.

- [ ] **Step 1: Write the originals-folder contract**

`content/workshops/.gitignore`:

```
*
!README.md
!.gitignore
```

`content/workshops/README.md`:

```markdown
# 워크샵 사진 원본

회차별 폴더에 승인된 사진만 넣습니다. 폴더명은 `src/data/workshop-sessions.ts`의 `id`와 같아야 합니다.

    content/workshops/
      2026-06-13-dummy/
        group-01.jpg
        lecture-01.jpg
        practice-01.jpg
        venue-01.jpg
      _inbox/            ← 선별 전 후보. 임포터가 무시합니다.

파일명 접두어가 역할(`group` 단체·수료식, `lecture` 강의, `practice` 실습, `venue` 장소), 번호가 표시 순서입니다.
얼굴은 `group`에서만 허용합니다.

```sh
bun run photos:workshops
```

긴 변 1600px WebP와 480px 썸네일로 변환하고 EXIF·위치정보를 제거해
`public/images/workshops/<회차id>/`와 `src/data/workshop-photos.json`을 생성합니다.
원본은 이 폴더에 두고 커밋하지 않습니다. 매니페스트와 webp만 커밋합니다.
```

- [ ] **Step 2: Write the failing manifest test**

`scripts/workshopPhotos.test.ts`:

```ts
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import manifest from '../src/data/workshop-photos.json';
import { getSession } from '../src/data/workshop-sessions';

type Entry = { sessionId: string; role: string; order: number; src: string; thumb: string; width: number; height: number };
const roles = ['group', 'lecture', 'practice', 'venue'];
const entries = manifest as Entry[];
const root = resolve(import.meta.dir, '..');

const seen = new Set<string>();
entries.forEach((e, i) => {
  assert.ok(getSession(e.sessionId), `manifest[${i}] session ${e.sessionId} exists`);
  assert.ok(roles.includes(e.role), `manifest[${i}] role ${e.role}`);
  assert.ok(Number.isInteger(e.order) && e.order >= 1, `manifest[${i}] order`);
  const key = `${e.sessionId}/${e.role}/${e.order}`;
  assert.ok(!seen.has(key), `duplicate order ${key}`);
  seen.add(key);
  assert.ok(e.src.startsWith(`/images/workshops/${e.sessionId}/`) && e.src.endsWith('.webp'), `manifest[${i}] src path`);
  assert.equal(e.thumb, e.src.replace(/\.webp$/, '-thumb.webp'), `manifest[${i}] thumb naming`);
  assert.ok(existsSync(resolve(root, 'public' + e.src)), `file exists ${e.src}`);
  assert.ok(existsSync(resolve(root, 'public' + e.thumb)), `thumb exists ${e.thumb}`);
  assert.ok(Math.max(e.width, e.height) <= 1600 && e.width > 0 && e.height > 0, `manifest[${i}] dimensions`);
  if (i > 0) {
    const p = entries[i - 1];
    const cmp = p.sessionId.localeCompare(e.sessionId) || roles.indexOf(p.role) - roles.indexOf(e.role) || p.order - e.order;
    assert.ok(cmp < 0, `manifest sorted at [${i}]`);
  }
});
console.log(`workshopPhotos: ${entries.length} manifest entries valid`);
```

- [ ] **Step 3: Run test to verify it fails**

Run: `bun run scripts/workshopPhotos.test.ts`
Expected: FAIL — cannot resolve `../src/data/workshop-photos.json`.

- [ ] **Step 4: Create the empty manifest and the importer**

`src/data/workshop-photos.json`:

```json
[]
```

`scripts/import-workshop-photos.mjs`:

```js
import { readdir, readFile, writeFile, mkdir, rm, stat } from 'node:fs/promises';
import { resolve, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = resolve(root, 'content/workshops');
const output = resolve(root, 'public/images/workshops');
const manifestPath = resolve(root, 'src/data/workshop-photos.json');
const sessionsSource = await readFile(resolve(root, 'src/data/workshop-sessions.ts'), 'utf8');
const knownSessions = new Set([...sessionsSource.matchAll(/id: '(\d{4}-\d{2}-\d{2}-[a-z-]+)'/g)].map((m) => m[1]));
const roles = ['group', 'lecture', 'practice', 'venue'];
const namePattern = /^(group|lecture|practice|venue)-(\d{2})\.(jpe?g|png|webp)$/i;

const folders = (await readdir(source, { withFileTypes: true }))
  .filter((d) => d.isDirectory() && !d.name.startsWith('_') && !d.name.startsWith('.'))
  .map((d) => d.name)
  .sort();
const unknown = folders.filter((f) => !knownSessions.has(f));
if (unknown.length) {
  console.error(`Unknown session folder(s): ${unknown.join(', ')} — names must match ids in src/data/workshop-sessions.ts`);
  process.exit(1);
}

const entries = [];
for (const sessionId of folders) {
  const files = (await readdir(join(source, sessionId))).filter((n) => namePattern.test(n)).sort();
  if (!files.length) continue;
  await mkdir(join(output, sessionId), { recursive: true });
  for (const name of files) {
    const [, role, order] = name.match(namePattern);
    const bytes = await readFile(join(source, sessionId, name));
    const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 16);
    const base = sharp(bytes).rotate();
    const full = await base.clone().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer({ resolveWithObject: true });
    const thumb = await base.clone().resize({ width: 480, height: 480, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
    await writeFile(join(output, sessionId, `${hash}.webp`), full.data);
    await writeFile(join(output, sessionId, `${hash}-thumb.webp`), thumb);
    entries.push({
      sessionId,
      role: role.toLowerCase(),
      order: Number(order),
      src: `/images/workshops/${sessionId}/${hash}.webp`,
      thumb: `/images/workshops/${sessionId}/${hash}-thumb.webp`,
      width: full.info.width,
      height: full.info.height,
    });
  }
}

if (!entries.length && !process.argv.includes('--clear')) {
  console.log('No workshop photos in content/workshops; existing manifest unchanged.');
  process.exit(0);
}

entries.sort((a, b) => a.sessionId.localeCompare(b.sessionId) || roles.indexOf(a.role) - roles.indexOf(b.role) || a.order - b.order);
await writeFile(manifestPath, JSON.stringify(entries, null, 2) + '\n');

const active = new Set(entries.flatMap((e) => [e.src, e.thumb]).map((p) => resolve(root, 'public' + p)));
await mkdir(output, { recursive: true });
for (const sessionId of await readdir(output)) {
  const dir = join(output, sessionId);
  if (!(await stat(dir)).isDirectory()) continue;
  for (const name of await readdir(dir)) {
    if (extname(name) === '.webp' && !active.has(join(dir, name))) await rm(join(dir, name));
  }
  if (!(await readdir(dir)).length) await rm(dir, { recursive: true });
}
console.log(`Imported ${entries.length} workshop photos across ${new Set(entries.map((e) => e.sessionId)).size} sessions. Originals retained; metadata removed.`);
```

Add to `package.json` `scripts`, directly after `"photos:import"`:

```json
"photos:workshops": "node scripts/import-workshop-photos.mjs",
```

- [ ] **Step 5: Run tests and a dry importer run**

Run: `bun run scripts/workshopPhotos.test.ts && bun run photos:workshops`
Expected: `workshopPhotos: 0 manifest entries valid` then `No workshop photos in content/workshops; existing manifest unchanged.`

- [ ] **Step 6: Commit**

```bash
git add content/workshops/.gitignore content/workshops/README.md scripts/import-workshop-photos.mjs src/data/workshop-photos.json scripts/workshopPhotos.test.ts package.json
git commit -m "feat(workshops): add photo importer, originals folder contract and manifest test"
```

---

### Task 8: Curate photos for 2026-06-13 (Dropbox set, already categorized)

**Files:**
- Create (gitignored): `content/workshops/2026-06-13-dummy/*.jpg`
- Generate: `public/images/workshops/2026-06-13-dummy/*.webp`, `src/data/workshop-photos.json`

**Interfaces:**
- Consumes: importer (Task 7).

The Dropbox folder `Tak/2. 학회/2026/2026-06-13 Dummy 워크샵/` holds three sub-folders: `…단체사진` (15), `…이론교육사진` (35), `…실습사진` (54). Map 단체→`group`, 이론→`lecture`, 실습→`practice`.

- [ ] **Step 1: Build a contact sheet per role**

Run from the repo root (scratch script, not committed):

```bash
mkdir -p content/workshops/_inbox/2026-06-13-dummy
SRC="$HOME/Dropbox/Tak/2. 학회/2026/2026-06-13 Dummy 워크샵"
for pair in "단체사진:group" "이론교육사진:lecture" "실습사진:practice"; do
  ko="${pair%%:*}"; role="${pair##*:}"
  node -e '
    const sharp=require("sharp");const fs=require("fs");const path=require("path");
    const [dir,out]=process.argv.slice(1);
    const files=fs.readdirSync(dir).filter(f=>/\.jpe?g$/i.test(f)).sort();
    (async()=>{const W=320,H=240,C=5;const tiles=[];
      for(let i=0;i<files.length;i++){const buf=await sharp(path.join(dir,files[i])).rotate().resize(W,H,{fit:"cover"}).composite([{input:Buffer.from(`<svg width="${W}" height="${H}"><rect x="0" y="${H-26}" width="${W}" height="26" fill="#000a"/><text x="6" y="${H-8}" font-size="16" fill="#fff" font-family="sans-serif">${i+1}  ${files[i].slice(-12)}</text></svg>`),top:0,left:0}]).toBuffer();
        tiles.push({input:buf,left:(i%C)*W,top:Math.floor(i/C)*H});}
      await sharp({create:{width:W*C,height:H*Math.ceil(files.length/C),channels:3,background:"#222"}}).composite(tiles).jpeg({quality:80}).toFile(out);
      console.log(out,files.length);})();
  ' "$SRC/2026-06-13 더미워크샵 $ko" "content/workshops/_inbox/2026-06-13-dummy/contact-$role.jpg"
done
```

Expected: three files `contact-group.jpg`, `contact-lecture.jpg`, `contact-practice.jpg` with numbered tiles.

- [ ] **Step 2: Send the sheets to the owner and get picks**

Send the three contact sheets with SendUserFile and ask for tile numbers per role, applying the Global Constraints (group 1–2, lecture 2–3, practice 4–6; no frontal trainee faces outside `group`). Record the answer as `role:numbers`, e.g. `group:3,11 lecture:4,9,20 practice:2,7,15,31,40`.

- [ ] **Step 3: Copy approved files with role-prefixed names**

```bash
SRC="$HOME/Dropbox/Tak/2. 학회/2026/2026-06-13 Dummy 워크샵"
DST=content/workshops/2026-06-13-dummy; mkdir -p "$DST"
pick() { # pick <ko-folder> <role> <n1> <n2> ...
  local dir="$SRC/2026-06-13 더미워크샵 $1" role=$2; shift 2; local i=1
  for n in "$@"; do f=$(ls "$dir" | grep -iE '\.jpe?g$' | sort | sed -n "${n}p"); cp "$dir/$f" "$DST/$role-$(printf %02d $i).jpg"; i=$((i+1)); done
}
pick 단체사진 group 3 11            # replace numbers with the owner's picks
pick 이론교육사진 lecture 4 9 20
pick 실습사진 practice 2 7 15 31 40
ls "$DST"
```

Expected: 9–11 files named `group-01.jpg … practice-05.jpg`.

- [ ] **Step 4: Import, test, and inspect**

Run: `bun run photos:workshops && bun run scripts/workshopPhotos.test.ts && ls public/images/workshops/2026-06-13-dummy | wc -l`
Expected: `Imported N workshop photos across 1 sessions…`, `workshopPhotos: N manifest entries valid`, file count = 2N. Open two of the webp files with Read to confirm orientation is upright and no letterboxing.

- [ ] **Step 5: Commit**

```bash
git add public/images/workshops/2026-06-13-dummy src/data/workshop-photos.json
git commit -m "content(workshops): add curated photos for the 2026-06-13 dummy workshop"
```

---

### Task 9: Curate photos for the seven iCloud sessions

**Files:**
- Create (gitignored): `content/workshops/<sessionId>/*.jpg` for ids `2025-05-04-dummy`, `2025-06-15-dummy`, `2025-08-24-dummy`, `2025-10-12-dummy`, `2025-12-20-animal-pig`, `2026-02-21-dummy`, `2026-08-08-animal-pig`
- Generate: `public/images/workshops/<sessionId>/*.webp`, `src/data/workshop-photos.json`

**Interfaces:**
- Consumes: importer (Task 7); `osxphotos` at `~/.local/bin/osxphotos`.

Repeat the loop below **one session at a time** so the owner reviews a single sheet per message. The 07:00–13:59 window is the first filter (2025-05-04 and 2025-12-20 include family photos outside it); private shots inside the window are dropped at review.

- [ ] **Step 1: Export the day's candidates as JPEG**

```bash
export PATH="$HOME/.local/bin:$PATH"
ID=2025-12-20-animal-pig; DAY=${ID:0:10}; NEXT=$(date -j -v+1d -f %Y-%m-%d "$DAY" +%Y-%m-%d)
INBOX=content/workshops/_inbox/$ID; mkdir -p "$INBOX"
osxphotos export "$INBOX" --from-date "$DAY" --to-date "$NEXT" --only-photos --skip-original-if-edited \
  --convert-to-jpeg --jpeg-quality 0.9 --filename "{created.strftime,%H%M%S}_{original_name}" --no-progress
# keep the 07:00–13:59 window
find "$INBOX" -maxdepth 1 -name '*.jpg' | awk -F/ '{t=substr($NF,1,2); if (t<"07"||t>"13") print}' | xargs -I{} rm -- "{}"
ls "$INBOX" | wc -l
```

Expected: a few dozen JPEGs named `HHMMSS_IMG_xxxx.jpg` (HEIC converted). If `--only-photos` is rejected by this osxphotos version, drop it and delete `*.mov` afterwards.

- [ ] **Step 2: Build one contact sheet**

Same `node -e` script as Task 8 Step 1, with `dir=$INBOX` and `out=$INBOX/contact.jpg`. Send `contact.jpg` with SendUserFile; ask for `group:… lecture:… practice:… venue:…` picks under the Global Constraints.

- [ ] **Step 3: Copy approved files with role-prefixed names**

```bash
DST=content/workshops/$ID; mkdir -p "$DST"
pick() { local role=$1; shift; local i=1; for n in "$@"; do f=$(ls "$INBOX" | grep -E '\.jpg$' | grep -v '^contact' | sort | sed -n "${n}p"); cp "$INBOX/$f" "$DST/$role-$(printf %02d $i).jpg"; i=$((i+1)); done; }
pick group 12          # replace with the owner's picks; omit a role with no picks
pick lecture 3 5
pick practice 8 14 21 27
pick venue 1
ls "$DST"
```

- [ ] **Step 4: Import, test, inspect, commit**

Run: `bun run photos:workshops && bun run scripts/workshopPhotos.test.ts`
Expected: entry count grows by the number of files just added; test passes. Read one `practice` webp to confirm no frontal trainee face slipped through.

```bash
git add public/images/workshops/$ID src/data/workshop-photos.json
git commit -m "content(workshops): add curated photos for $ID"
```

- [ ] **Step 5: Repeat Steps 1–4 for the remaining six ids**, in date order. For `2026-08-08-animal-pig` prefer the certification-ceremony shot as `group-01`. After the last session:

Run: `bun run scripts/workshopData.test.ts && bun run scripts/workshopPhotos.test.ts && du -sh public/images/workshops`
Expected: both pass; total size well under 20 MB (≈80 photos × ~150 KB + thumbs).

---

### Task 10: Hand-off note for Astra and final checks

**Files:**
- Modify: `docs/superpowers/specs/2026-09-14-workshop-portfolio-design.md` (append a short "Data ready" section)

- [ ] **Step 1: Run the full check set**

Run: `bun run scripts/workshopData.test.ts && bun run scripts/workshopPhotos.test.ts && bunx astro check 2>&1 | tail -3 && bun run build 2>&1 | tail -5`
Expected: both tests pass, astro check shows no new errors, build succeeds (the existing placeholder pages still render; they ignore the new fields).

- [ ] **Step 2: Append the hand-off section to the spec**

Append to the spec file:

```markdown
## 7. Data ready (2026-09-14)

Import from `src/data/`:

- `workshops` (+ `stage`, `titleKo`, `defaultVenue`) — `workshops.ts`
- `curriculumStages`, `competencyDomains`, `competencyKeys` — `workshop-curriculum.ts`
- `workshopTeam`, `isTeamMember` — `workshop-team.ts`
- `workshopSessions`, `getSession`, `sessionsFor` — `workshop-sessions.ts`
- `workshopOutcomes`, `outcomeFor` — `workshop-outcomes.ts`
- `facultyAppearances` — `workshop-faculty-appearances.ts`
- `workshop-photos.json` — `{ sessionId, role, order, src, thumb, width, height }[]`, sorted; roles `group | lecture | practice | venue`

Cover photo rule for the timeline: first `group` entry for the session, else first `practice`, else none.
Tests: `bun run scripts/workshopData.test.ts`, `bun run scripts/workshopPhotos.test.ts`.
Re-import photos: `bun run photos:workshops` (originals live in `content/workshops/`, not committed).
```

- [ ] **Step 3: Commit and open the PR**

```bash
git add docs/superpowers/specs/2026-09-14-workshop-portfolio-design.md
git commit -m "docs(workshops): note data hand-off for page implementation"
git push -u origin claude/work
gh pr create --base main --title "Workshop portfolio data and photos" --body-file - <<'PR'
Typed data for the Spinoscopy Workshop Team portfolio (sessions, curriculum, team, outcomes, faculty appearances), a photo importer with an originals-folder contract, curated photos for the eight held sessions, and validation tests. Pages are out of scope (see spec §5).

Spec: docs/superpowers/specs/2026-09-14-workshop-portfolio-design.md
Plan: docs/superpowers/plans/2026-09-14-workshop-portfolio-data.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01X36ibcVnndXsftScK8tYsD
PR
```

Expected: PR URL printed.
