# Workshop portfolio — design spec (2026-09-14)

Spinoscopy Workshop Team의 교육 워크샵 이력을 takmd.com 하부 페이지로 보여주기 위한 설계.
이 문서는 **데이터·사진 파이프라인(이 워크트리에서 구현)** 과 **페이지 스펙(Astra가 별도 구현)** 을 함께 정의한다.

## 1. 목표와 범위

**무엇을 보여주는가.** 교과서 → 수술 참관 → 더미 → 살아있는 동물 → 카데바로 이어지는 5단계 학습 사슬을
팀이 설계해 2025년 5월부터 운영해 왔고, 2026년 12월 카데바로 사슬을 완성한다는 이야기.
방문자가 다음을 한 번의 스크롤로 이해해야 한다.

1. 우리가 무엇을 하고 있고 그것이 왜 이 순서인가
2. 지금까지 몇 회를 어디서 누구와 했는가
3. 교육생이 무엇을 얻었는가 (pre/post 역량 변화, 익명 피드백)
4. 앞으로의 계획
5. 팀(faculty)은 누구인가

**서사의 주어는 팀이다.** 팀 이름은 *Spinoscopy Workshop Team*. 개인 사이트(takmd.com)에 올리지만
데이터는 팀 기준으로 짜서 나중에 별도 팀 사이트(`workspace/spinoscopy-workshop` 기획)가 그대로 가져갈 수 있게 한다.
팀 사이트 자체는 이번 범위 밖이다.

**범위 밖.** 팀 사이트 구축, 신청·문의 폼, i18n 프레임워크, 교육생 개인 데이터, 회차별 장문 서사.

**결정 요약** (2026-09-13 ~ 14 브레인스토밍)

| 결정 | 내용 |
|---|---|
| 페이지 구조 | `/workshops` 인덱스 신설 + 기존 3개 모달리티 페이지 채움 |
| 공개 범위 | 교육생은 집계만. 얼굴은 단체사진·수료식만. 실명·개인 점수 없음 |
| 산출물 경계 | 데이터·사진·테스트는 이 워크트리, Astro 페이지·컴포넌트·차트는 Astra |
| 언어 | 영어 기본, 공식 한국어 명칭은 `titleKo` 병기 |
| 접근 방식 | 손으로 쓴 타입드 데이터 + photo-frame 방식 임포터 (Notion 자동수집·콘텐츠 컬렉션 기각) |
| 회차 번호 | 실제 개최 순서로 센다. 2025-10 더미 4차는 10-05 → 10-12 연기, 1회 개최 |
| 외부 카데바 이력 | 통합 타임라인에 섞지 않고 카데바 페이지 안에 별도 층 |
| 수료자 수 | 최일 교수 쪽 명단이 올 때까지 비워 둔다. 페이지는 숫자 없이도 렌더 |

## 2. 사실 관계 (확인된 것만)

### 팀 프로그램 회차 — 9건

통합 회차 `seriesNo`는 모달리티를 합쳐 실제 개최 순서로 센다. 2026-08-08의 공식명 "The 7th"는
주최 측 번호이며 실제로는 8번째다. 공식명은 `title`에 그대로 두고 번호는 우리 계산을 쓴다.

| seriesNo | id | 모달리티 | 상태 | 비고 |
|---|---|---|---|---|
| 1 | 2025-05-04-dummy | dummy | held | 사직전공의 대상. 이론 3강(최일 / 여운탁 / 장준수) → 더미 3그룹 × 2섹션 |
| 2 | 2025-06-15-dummy | dummy | held | 발표 "Introduction to UBE for beginners" |
| 3 | 2025-08-24-dummy | dummy | held | 프로그램 자료 없음 |
| 4 | 2025-10-12-dummy | dummy | held | 10-05에서 연기 |
| 5 | 2025-12-20-animal-pig | animal-pig | held | "1st Animal Lab Workshop for Beginners". n=8, pre/post 평가 |
| 6 | 2026-02-21-dummy | dummy | held | 프로그램 자료 없음 |
| 7 | 2026-06-13-dummy | dummy | held | 초청강의 Jae-Koo Lee "Hurdles and Lessons, from Trainee to Trainer" |
| 8 | 2026-08-08-animal-pig | animal-pig | held | 공식명 "The 7th ESS Animal Lab Workshop for Beginners". 수료식 |
| 9 | 2026-12-19-cadaver | cadaver | planned | 팀 프로그램 첫 사람 카데바 |

더미 회차는 한림대학교 동탄성심병원, 동물 회차는 인천 HLB바이오스텝 실습실. 2026 동물 회차 주최에 (재)인천테크노파크, (주)하얀메디칼, endovision.

### 팀

Spinoscopy Workshop Team. 구성원 8명: 여운탁, 최일, 고용산, 이수범, 이재구, 장준수, 유승찬, 노찬양.
팀 유니폼을 맞춰 더미·동물·카데바 워크샵을 함께 운영한다. 영문 표기는 자료에서 확인된 것(Jae-Koo Lee, Chan Yang Noh)만
쓰고 나머지는 구현 전에 확인한다.

### 팀 프로그램 밖의 활동 — 관계별로 구분

| 관계 | 행사 | 날짜 | 설명 |
|---|---|---|---|
| team-dispatch | 대만 花蓮 Tzu Chi 모의의학센터 카데바 (TSESS / TSMISS) | 2026-06-08 | Chien-Min Chen 교수 요청 → 팀이 공식 파견. 이후 요청 시 정기적으로 faculty를 보내는 상호 교류 합의 |
| team-support | WSC 2026 더미 워크샵 (Songdo ConvensiA, Room 4) | 2026-11-29 | KOMISS 주최 국제학회. 학술간사로서 더미 워크샵을 맡아 팀 faculty가 지원. 팀 행사가 아님 |
| individual | Spine Summit (Phoenix, AZ) | 2026-02-26 | 개인 faculty. 최일과 동행했으나 팀 행사가 아님. 사이트에 이미 presentations·TV 갤러리로 존재 |
| individual | CG Bio "Mastering the Endoscope Essentials" 카데바 (가톨릭 CIBEC) | 2026-09-12 | 개인 faculty |

KOMISS 정기 카데바(2025-05-23, 2025-11-28, 2026-05-30)는 관계가 미확인이라 목록에 넣지 않는다.

### 교육 효과 자료

2025-12-20 동물 워크샵. n=8. 6개 역량 도메인 × 3문항, 0–5점, pre/post. 응답자 구성은 Fellow 3, 임상조교수 1,
전공의 1, 군의관 2, 지역병원 정형외과 1. 자유 서술 답변은 익명으로 인용 가능하다. 예:

- "실제 수술 장비를 이용할 수 있었던 유일한 기회였습니다."
- "Live animal이어서 bleeding과 nerve 반응이 있어서 좋았다."
- "카데바의 경우 동물과 다르게 해부학적으로 동일해서 더 도움이 된 것 같습니다."

교육생이 막히는 단계(docking, caudal lamina 상연 찾기 등)를 답한 항목은 "왜 이 순서인가"의 근거로 쓴다.

### 아직 없는 것

- 회차별 교육생 수 (동물 1회 8명만 확인). 명단이 오면 `trainees`를 채운다.
- 2025-08-24, 2025-10-12, 2026-02-21 더미 회차의 프로그램 자료.
- 팀원 6명의 영문 표기.

## 3. 데이터 스키마 (`src/data/`)

기존 `workshops.ts`는 슬러그(`dummy` / `cadaver` / `animal-pig`)와 필드를 그대로 두고 **추가만** 한다.
슬러그는 3D 씬(`WorkshopObjects.tsx`)이 참조하므로 바꾸지 않는다.

```ts
// workshops.ts — 기존 3건 유지 + 추가 필드
stage: 3 | 4 | 5               // dummy=3, animal-pig=4, cadaver=5
titleKo: string                // '더미 워크샵'
defaultVenue?: { name: string; city: string }

// workshop-team.ts
export const workshopTeam = {
  name: 'Spinoscopy Workshop Team',
  summary: string,             // 한 문단. 유니폼, 함께 운영, 설립 배경
  members: { name: string; nameKo: string; affiliation: string }[]   // 8명
}

// workshop-curriculum.ts
curriculumStages: { n: 1|2|3|4|5; title; titleKo; slug?: WorkshopSlug }[]
  // Textbook & video → OR observation → Dummy → Live animal → Cadaver
competencyDomains: { key; label; labelKo }[]
  // anatomy/orientation · instrumentation · access/corridor · bony decompression · soft tissue/neural safety · physiology/safety

// workshop-sessions.ts — 팀 프로그램 9건
type WorkshopSession = {
  id: string                       // 'YYYY-MM-DD-<slug>', 사진 폴더명과 동일
  workshop: WorkshopSlug
  seriesNo: number                 // 통합 회차 1..9
  modalityNo: number               // 더미 1..6, 동물 1..2, 카데바 1
  date: string; endDate?: string
  status: 'held' | 'planned'
  title: string; titleKo?: string  // 공식 영문 제목 우선
  venue: { name: string; nameKo?: string; city: string }
  host?: string[]                  // 주관
  organizers?: string[]            // 주최
  audience: string
  role: 'director' | 'faculty' | 'lecturer'   // 여운탁의 역할
  lectures?: { title: string; titleKo?: string; speaker: string; affiliation: string }[]
  handsOn?: { format: string; groups?: number; sessions?: number; durationMin?: number }
  trainees?: { count: number; composition?: string[] }   // 집계만. 명단 전까지 undefined
  certification?: boolean
  sources: string[]                // 근거 메모. 렌더하지 않음
}

// workshop-outcomes.ts — 교육 효과 집계
type WorkshopOutcome = {
  sessionId: string
  n: number
  scale: { min: 0; max: 5; itemsPerDomain: 3; domainMax: 15 }
  domains: { key: CompetencyKey; pre: number; post: number }[]   // 전원 평균
  composition: string[]
  quotes: string[]                 // 익명 자유 서술 인용
  difficulties?: string[]          // 교육생이 막힌다고 답한 단계
}

// workshop-faculty-appearances.ts — 팀 프로그램 밖의 활동
type FacultyAppearance = {
  id: string
  date: string; endDate?: string
  status: 'held' | 'planned'
  event: string                    // 'Spine Summit'
  title?: string                   // 공식 세션/워크샵 제목
  modality: WorkshopSlug
  relation: 'team-dispatch' | 'team-support' | 'individual'
  venue: { name: string; city: string; country: string }
  requestedBy?: { name: string; affiliation: string }   // Chien-Min Chen
  teamMembers?: string[]           // 함께 간 팀원 (팀원만)
  note?: string                    // 상호 교류 합의 등 한 문장
  links?: { presentationId?: string; mediaCaption?: string }   // 기존 사이트 데이터로 연결
  sources: string[]
}
```

`sources`는 파일 경로가 아니라 "1st dummy agenda PDF", "GCal Conference" 같은 짧은 메모로 적는다. 리포가 공개이므로 개인 경로·ID·예산은 어디에도 넣지 않는다.

## 4. 사진 파이프라인

기존 `content/photo-frame` → `scripts/import-frame-photos.mjs` → `public/images/photo-frame` + `src/data/photo-frame.json` 관례를 회차 폴더로 확장한다.

**원본과 선별.**

1. 원본은 소유자의 사진 라이브러리(iCloud)와 Dropbox에서 날짜별로 뽑아 `content/workshops/_inbox/<sessionId>/`에 둔다. 컨택트시트(격자 미리보기)를 만들어 소유자 승인을 받는다.
2. 승인된 사진만 `content/workshops/<sessionId>/`로 옮긴다. 두 폴더 모두 `content/workshops/.gitignore`(`*`, `!.gitignore`, `!README.md`)로 무시한다.
3. 역할은 파일명 접두어로 정한다: `group-01.jpg`, `lecture-02.jpg`, `practice-03.jpg`, `venue-01.jpg`. 접두어가 `role`, 번호가 표시 순서. 별도 메타 파일은 없다.

**선별 기준.**

| role | 기준 | 회차당 |
|---|---|---|
| group | 단체사진, 수료식. 얼굴 노출 허용 | 1–2 |
| lecture | 강의 장면. 연자 뒷모습·화면 위주. 실명 슬라이드·명찰 판독 가능 컷 제외 | 2–3 |
| practice | 손·기구·더미·모니터 중심. 교육생 정면 얼굴 제외 | 4–6 |
| venue | 장소·세팅 | 0–1 |

회차당 6–12장, 전체 80장 안팎. 07–13시 촬영분을 1차 필터로 쓰고, 시간대로 안 걸러지는 사적인 사진은 컨택트시트에서 손으로 뺀다.
교육생 명단·설문 원본·개인 점수는 리포에 들어가지 않는다.

**임포터 `scripts/import-workshop-photos.mjs`.** `import-frame-photos.mjs`를 복제해 회차 하위폴더를 순회한다.

- 출력: `public/images/workshops/<sessionId>/<hash>.webp` (긴 변 1600px, q85), `<hash>-thumb.webp` (긴 변 480px)
- sharp 재인코딩으로 EXIF·GPS 제거, `rotate()`로 방향만 반영. 해시는 원본 바이트 sha256 앞 16자
- 매니페스트 `src/data/workshop-photos.json`: `{ sessionId, role, order, src, thumb, width, height }[]`
- 매니페스트에 없는 webp는 `public/images/workshops/` 아래에서 삭제
- 원본이 하나도 없으면 기존 매니페스트를 건드리지 않고 종료 (photo-frame과 동일)
- `package.json`에 `photos:workshops` 스크립트 추가

**검증 테스트 `src/data/workshop-photos.test.ts`.** 매니페스트의 모든 `sessionId`가 `workshopSessions`에 있고, `role`이 4종 중 하나이고, `src`·`thumb` 파일이 public에 실재하며, `order`가 회차·role 안에서 중복되지 않는다. 데이터 파일에도 같은 수준의 테스트를 둔다: `seriesNo`가 날짜순 1..9로 연속, `id`가 `date` + `workshop`과 일치, outcome의 `sessionId`와 appearance의 `links.presentationId`가 실재.

## 5. 페이지 스펙 (Astra 구현)

### `/workshops` — 팀 프로그램 인덱스 (신설)

`/education`의 "ESS Workshop for Beginners" 프로그램 카드에서 링크한다.

1. **히어로.** 팀 이름, 프로그램 이름 *ESS Workshop for Beginners*, 한 문장 주장(다섯 단계를 하나의 사슬로 설계해 운영). 주관·주최 표기.
2. **커리큘럼 스트립.** `curriculumStages` 5개를 가로로. 3·4·5단계는 상세 페이지로 링크.
3. **타임라인.** `workshopSessions` 날짜순 9개. 카드에는 seriesNo, 날짜, 모달리티, 장소, 공식 제목, 대표 사진 1장(group → practice 순으로 첫 장). 사진 없는 회차는 텍스트 카드, `planned`는 점선 카드.
4. **교육 효과.** `workshopOutcomes`의 6도메인 pre/post를 차트 하나로(레이더 또는 슬로프). n과 응답 구성만 표기. 아래에 `quotes` 3–4개.
5. **앞으로.** 12-19 카데바(팀 프로그램 첫 카데바)와 WSC 2026 더미 워크샵. WSC 카드는 `relation: team-support` 문구("KOMISS 주최 행사에 팀 faculty가 지원")를 그대로 보여준다.
6. **Faculty.** `workshopTeam.members` 8명, 소속. 팀 소개 한 문단. "Also teaching at" 한 줄로 `/workshops/cadaver`의 외부 활동 층으로 연결.

### `/workshops/dummy`, `/workshops/animal-pig`

`WorkshopPage.astro`의 "자료 준비 중" 카드를 회차 목록으로 교체. 회차마다 제목·날짜·장소·강의 목록·실습 형식·수료식 여부, 그 아래 `workshop-photos.json`의 해당 회차 사진을 role 순(group → lecture → practice → venue)으로 그리드. 사진 없는 회차는 축약 카드. 3D 씬 오브젝트 클릭 진입은 그대로.

### `/workshops/cadaver`

- 상단: 팀 프로그램의 카데바 단계. 왜 마지막 단계인가(설문 인용), 2026-12-19 예정 카드.
- 중단 **Team faculty exchange**: `relation: team-dispatch` 항목(대만). 요청자·상호 교류 합의 문구.
- 하단 **Faculty at other cadaver workshops**: `relation: individual` 항목(Spine Summit, CG Bio). Spine Summit은 `links`로 기존 presentations 항목과 TV 갤러리 사진에 연결.

### 공통 규칙

- 언어는 영어. `titleKo`가 있으면 병기.
- `trainees`가 있을 때만 인원 줄을 렌더. 없으면 줄 자체가 없다.
- 교육생 실명·개인 점수는 어디에도 없다. 사진은 매니페스트에 있는 것만.
- 새 페이지는 기존 `page-shell`·`eyebrow` 등 레이아웃 관례를 따른다.

## 6. 산출물 경계

**이 워크트리(데이터·사진).** `src/data/workshops.ts` 필드 추가, `workshop-team.ts`, `workshop-curriculum.ts`, `workshop-sessions.ts`, `workshop-outcomes.ts`, `workshop-faculty-appearances.ts`, `scripts/import-workshop-photos.mjs`, `content/workshops/`, `public/images/workshops/`, `src/data/workshop-photos.json`, 검증 테스트, 이 스펙.

**Astra(페이지).** `/workshops` 인덱스, `WorkshopPage.astro` 개편, 차트 컴포넌트, `/education` 링크.

**구현 순서.** 데이터 파일과 테스트 → 임포터와 사진 선별(회차별 승인) → 스펙을 Astra에게 인계. 명단이 오면 `trainees`만 채우는 후속 커밋.

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

Photo status: `2026-06-13-dummy` has 11 photos in the manifest. Six more held sessions are curated (49 photos chosen) and will be added to the manifest once full-resolution originals are pulled from the owner's library; `2026-02-21-dummy` has no photos in the owner's library and waits on the team. Pages must render a session with zero photos as a text card.
