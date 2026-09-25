# takmd.com 인터랙티브 데스크 씬 홈페이지 — 구현 지시서

너는 이 레포(takmd.com, Astro 5 + React 19 + Tailwind 4, Cloudflare Pages 배포)의 홈페이지를
**인터랙티브 3D 데스크 씬**으로 교체하는 작업을 맡는다. 작업 시작 전에 레포 구조와 기존
홈페이지 컴포넌트를 먼저 읽고 파악한 뒤 진행하라.

## 절대 건드리지 말 것

- Notion DB 연동 로직 (live CV 백엔드) — 데이터 fetching 코드, API 라우트, 환경변수 전부 유지
- 기존 하위 페이지들(publications, talks 등)의 라우트와 콘텐츠
- Cloudflare Pages 빌드/배포 설정
- 홈(`/`) 씬만 교체한다. 씬은 Astro island(client:only)로 올린다.

## 최종 목표 (한 문장)

방문자가 내 서재/오피스 책상을 마주보는 3D 씬에서, 책상 위 상징적 오브젝트들을
호버/클릭하며 나를 탐색하는 홈페이지. 창문으로는 **방문자의 현지 시각에 맞는 빛**이
들어오고, 시계달력 오브젝트는 **방문자 로컬 시간이 실시간**으로 흐른다.

## 씬 구성

정면 데스크 뷰. 카메라는 책상을 약간 위에서 내려다보는 고정 시점(미세한 마우스 패럴럭스만 허용).

- **중앙: 큰 모니터** — 화면은 터미널. 씬의 정보 허브 역할 (아래 "모니터 터미널" 절 참조)
- **측면: 창문** — 실시간 태양광이 들어오는 광원
- **책상 위/주변: 인터랙티브 오브젝트들** (아래 매핑 표)
- 데스크테리어 소품(비인터랙티브): 키보드, 머그, 스탠드 조명, 화분 등 — 씬의 밀도용

### 오브젝트 → 섹션 매핑

| id | 오브젝트 | 라우트 | 호버 시 터미널 출력 (요지) |
|---|---|---|---|
| spine | 척추 모형 + 내시경 기구 | /clinical | UBE/Spinoscopy, Center for Endoscopic Spine Surgery |
| journals | 저널 스택 | /publications | 논문 목록 (Notion 연구DB live) |
| globe | 지구본 | /talks | 국제 학회 발표, 워크숍 faculty |
| brain | 뇌 모형 + 철학서 | /research | AI research, cognitive neuroscience, philosophy of mind |
| keyboard | 키보드/서브 터미널 | /projects | Dashboard, AI agents, vibe coding |
| belt | 주짓수 벨트 | /about | personal |
| card | 명함 (Blinq) | 외부 Blinq 링크 | contact |
| clock | 시계달력 | (라우트 없음 — 기능 오브젝트) | 현재 로컬 날짜/시간 |

라우트명은 레포의 실제 기존 라우트를 확인해서 맞춰라. 없는 섹션은 기존 페이지 구조를 따라
생성하지 말고 매핑만 비워두고 TODO 주석으로 남겨라. 터미널 출력 문구는 기존 사이트의
실제 텍스트/Notion 데이터를 우선 활용하고, 없으면 위 요지로 초안을 쓰되 과장 없이 담백하게.

## 인터랙션 스펙

### 1. 호버

- 오브젝트 아웃라인 글로우: `@react-three/postprocessing`의 `Outline` 이펙트 (selection 기반)
- 오브젝트가 살짝 반응: ~3–5° 회전 또는 2–4mm 부유. spring 애니메이션(`@react-spring/three`),
  스냅백 자연스럽게. 과하면 장난감 같아지니 절제할 것
- 동시에 **모니터 터미널에 해당 항목 설명이 타이핑**됨 (typewriter, 커서 깜빡임 포함).
  hover-out 시 타이핑 중단 후 idle 화면으로 복귀 (즉시 clear 말고 짧은 유예)
- 커서는 pointer로 변경

### 2. 클릭

- 카메라가 해당 오브젝트로 dolly-in (0.6–0.9s ease) → 화면 페이드 → 해당 라우트로 네비게이션
- Astro 페이지 전환이므로 View Transitions API 사용 가능하면 활용, 아니면 오버레이 페이드로 처리
- 외부 링크(Blinq)는 줌인 후 새 탭

### 3. 창문 빛 — 방문자 현지 시간 연동 (핵심 기능)

- `suncalc` 사용. 위치는 ① Geolocation API 허용 시 실좌표, ② 거부/미지원 시
  `Intl.DateTimeFormat().resolvedOptions().timeZone` → 타임존 대표 좌표 근사 테이블로 폴백
- `SunCalc.getPosition(now, lat, lng)`의 altitude/azimuth를 창문 방향 DirectionalLight에 매핑:
  - altitude → 광선 입사각 + 강도 (고도 낮을수록 길고 붉은 빛)
  - 색온도: 새벽 청색 → 정오 백색 → 석양 주황 → 일몰 후 소멸
  - 밤: 창밖은 어두운 남색, 미약한 문라이트 + **책상 스탠드 조명이 주광원으로 켜짐**
- 하드코딩된 4단계 스위치가 아니라 **연속 보간**. 1분 간격으로 갱신
- ambient/환경광도 함께 보간해서 씬 전체 무드가 일관되게 변할 것
- 창밖은 단순 그라디언트 스카이(시간 연동 색상)로 시작. 텍스처는 나중에 교체 가능하게

### 4. 시계달력 오브젝트

- 방문자 로컬 `Date()` 기준 실시간 날짜 + 시각. 초 단위 갱신
- 구현: canvas texture를 오브젝트 표면에 입히거나 drei `Html transform`. 씬 스타일과 이질감 없게

## 모니터 터미널

- 구현: drei `RenderTexture`(모니터 메쉬 화면에 렌더) 또는 `Html transform` 중
  성능/선명도 좋은 쪽 선택. 텍스트 가독성이 우선
- **idle 상태**: neofetch 스타일 프로필 카드 — 이름, 타이틀(spine neurosurgeon / AI researcher),
  현재 로컬 시간, 그리고 Notion에서 오는 라이브 지표 1–2개(논문 수 등)가 가능하면 표시.
  Notion 호출이 무거우면 빌드타임 데이터로 시작하고 TODO로 남겨라
- **hover 상태**: `> open spine.md` 식의 커맨드 라인 + 해당 항목 설명 타이핑
- 폰트는 모노스페이스, 터미널 배경은 씬 조명을 살짝 받는 느낌(완전 순수 검정 X)

## 에셋 전략 — 반드시 이 순서로

**Phase 1: 프리미티브 플레이스홀더로 전체 완성.**
모든 오브젝트를 박스/실린더/구 조합 + 단색 머티리얼로 만들고, 위의 모든 인터랙션
(호버 글로우, 터미널 타이핑, 클릭 줌, 조명, 시계)을 이 상태에서 100% 동작시켜라.

**Phase 2: GLB 교체 시스템.**
오브젝트는 전부 설정 기반으로:

```ts
type DeskObject = {
  id: string
  glb?: string          // '/models/spine.glb' — 있으면 로드, 없으면 fallback
  fallback: PrimitiveSpec
  position: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
  route?: string        // 없으면 기능 오브젝트
  external?: boolean
  terminalLines: string[]
}
```

- GLB는 `/public/models/`에서 로드. 내가 Higgsfield로 생성한 GLB를 하나씩 떨어뜨리면
  코드 수정 없이 교체되는 구조여야 한다
- GLB 로드 실패 시 자동으로 fallback 프리미티브
- 각 오브젝트의 hit area는 메쉬보다 살짝 넓은 invisible collider로 (호버 안정성)

**Phase 3: 폴리시.** 그림자(soft shadow), 미세 필름 그레인/비네트(취향껏, 절제),
페이지 로드 시퀀스(씬 페이드인 + 조명 점등 + 터미널 부팅 텍스트).

## 비주얼 방향

- 스타일라이즈드 코지 렌더 (사실주의 X, 로우폴리 장난감 느낌도 X — 그 사이. Blender 아트웍/코지 게임 무드)
- 팔레트와 재질은 씬 조명이 주인공이 되도록 채도 억제. 글로우 아웃라인 색 하나만 시그니처 악센트로
- 타이포는 터미널(모노스페이스)이 담당. 씬 위에 떠 있는 HTML 텍스트 오버레이는 최소화
- 이 씬 자체가 페이지의 시그니처다. 그 외 UI(로딩, 힌트)는 조용하고 규율 있게

## 성능 / 폴백 / 접근성

- three.js 번들은 홈에서만 로드 (dynamic import, Astro island `client:only="react"`)
- DPR clamp (max 2), `<Suspense>` + 진행률 로더
- **모바일**: 씬은 유지하되 패럴럭스 끄고 DPR 1, 텍스처/그림자 다운그레이드.
  WebGL 미지원/저사양 감지 시 정적 이미지 + 섹션 링크 리스트 폴백
- 키보드 내비게이션: Tab으로 오브젝트 순회(포커스 시 호버와 동일한 글로우+터미널), Enter로 이동
- `prefers-reduced-motion`: 부유/회전/줌 애니메이션 제거, 즉시 전환
- 오브젝트마다 aria-label, 씬 전체에 스크린리더용 대체 내비게이션 제공

## 진행 방식

1. 레포 파악 → 기존 홈 컴포넌트와 라우트 구조 요약 보고
2. 의존성 추가: `three @react-three/fiber @react-three/drei @react-three/postprocessing @react-spring/three suncalc`
   (버전 호환성 — 특히 React 19와 R3F 버전 — 먼저 확인)
3. Phase 1 구현 → dev 서버 스크린샷 또는 확인 방법 안내
4. 내 피드백 반영 → Phase 2 → Phase 3

각 Phase 완료 시 커밋을 분리하고, 무엇이 동작하는지/남은 TODO를 요약하라.

## 완료 기준 체크리스트

- [ ] 8개 오브젝트 호버 시: 글로우 + 미세 모션 + 터미널 타이핑 동작
- [ ] 클릭 시 카메라 줌인 → 라우트 전환 (Blinq는 새 탭)
- [ ] 창문 빛이 suncalc 기반으로 방문자 로컬 시간에 연속적으로 변함 (밤엔 스탠드 점등)
- [ ] 시계달력이 방문자 로컬 날짜/시간을 초 단위로 표시
- [ ] 모니터 idle 화면에 프로필 + (가능하면) Notion 라이브 지표
- [ ] GLB 드롭인 교체 시스템 동작 (파일 없으면 프리미티브 폴백)
- [ ] 모바일 동작 + 저사양 정적 폴백 + 키보드/reduced-motion 대응
- [ ] Notion 연동, 기존 하위 페이지, 배포 설정 무손상
