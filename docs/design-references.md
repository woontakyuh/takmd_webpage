# 3D Interactive Homepage — Design References (2026-08-07)

takmd.com 데스크 씬 리디자인을 위한 레퍼런스 조사. 축: ① 3D 인터랙티브 ② 스크롤 드리븐 ③ 복셀(voxel) 감성.

## A. 책상/방 디오라마 + 모니터 허브 (지금 컨셉과 직결)

- **Henry Heffernan** — https://henryheffernan.com — 빈티지 PC가 놓인 책상, 클릭하면 카메라가 모니터로 줌인되고 화면 안에서 실제 동작하는 OS(게임 DOOM까지 구동)가 뜸. 모니터 = iframe/Html 텍스처. 우리 "모니터 터미널" 컨셉의 정점. Bruno Simon이 "역대 최애 포트폴리오"로 꼽음.
- **Bruno Simon — My Room in 3D** — https://github.com/brunosimon/my-room-in-3d (데모 https://my-room-in-3d.vercel.app) — 코지 룸 디오라마, 베이크드 라이팅 + 소수의 실시간 이펙트. Blender 파일까지 MIT 공개라 라이팅/구도 스터디용 최적.
- **Jesse's Ramen** — https://www.jesse-zhou.com — 라멘 가게 디오라마 안에 포트폴리오 콘텐츠 배치. 오브젝트 클릭 → 카메라 이동 → 콘텐츠. 케이스 스터디: https://jesse-zhou.medium.com/jesses-ramen-case-study-77bae77ab5f0
- **bokoko33 (かまぼこのへや)** — https://bokoko33.me — 스크롤로 방 안을 유영하는 코지 룸. 부드러운 파스텔 톤 + 스크롤 카메라. "감각적인" 쪽의 좋은 예.

## B. 게임형 탐험 / 물리 인터랙션

- **Bruno Simon** — https://bruno-simon.com — 자동차를 몰고 다니며 포트폴리오를 탐험하는 원조. 물리(cannon.js) + 낮은 채도 + 장난감 스케일.
- **Jay Ransijn** — https://jayransijn.com — 강아지와 공놀이, 자전거, 운전까지 되는 플레이어블 월드.
- **Thibault Introvigne** — https://thibault-introvigne.com — 우주인 캐릭터 조작 + 수집 요소 10개.
- **Worawat** — https://worawork.vercel.app — 젤다/동물의 숲 무드의 코지 하우스+정원 탐험.

## C. 스크롤 드리븐 시네마틱

- **Sébastien Lempens** — https://sebastien-lempens.com — 스쿠터·스카이다이빙까지 이어지는 스크롤 기반 3D 파리 투어. 스크롤=카메라 타임라인의 교과서.
- **bilal.show** — https://bilal.show — 뮤직박스 환경 속 캐릭터가 스크롤 스토리로 진행.
- **Shopify Editions Spring 2026** — https://www.shopify.com/editions/spring2026 — 체인지로그를 스크롤 시네마틱으로. 파티클 분산 + 안무된 전환.
- **Cartier Watches & Wonders** — https://www.cartier.com/watchesandwonders — 시계 하나당 3D 뮤지엄 알코브 6개, 스크롤로 방 이동. GLSL + GSAP + Web Audio.
- **Sleep Well Creative** — https://sleep-well-creatives.com — 손그림 아트디렉션의 스크롤 내러티브.
- **Oryzo** — https://oryzo.ai — 오브젝트 하나(코스터)를 z축 스크롤 + 관성으로 시네마틱하게. "적은 오브젝트, 높은 밀도" 접근.
- 기술 자료: Codrops "Cinematic 3D Scroll with GSAP" — https://tympanus.net/codrops/2025/11/19/how-to-build-cinematic-3d-scroll-experiences-with-gsap/ (마스터 타임라인 + ScrollTrigger scrub 패턴)

## D. 복셀 / 미니어처 감성 (VOx)

- **Igloo Inc** — https://igloo.inc — Awwwards **Site of the Year 2024**. 얼음 속 오브젝트 + 복셀 볼륨 데이터 + 유체 시뮬레이션. 복셀 감성의 하이엔드 끝판왕. 케이스 스터디: https://www.awwwards.com/igloo-inc-case-study.html
- **JReyes MC** — https://jreyes-mc-portfolio.com — 마인크래프트 스타일 월드를 스크롤 서킷으로 투어. Awwwards HM.
- **Aimee's Papercraft World** — https://aimees-papercraft-world.com — 페이퍼크래프트(복셀 아님, 미니어처 감성) 루프 경로 스크롤 내러티브.
- **Awwwards isometric/voxel 모음** — https://www.awwwards.com/websites/3d/ / https://designmd.app/library/voxel-gamified-isometric

## takmd.com 적용 시사점

1. **모니터 줌인 = 우리 씬의 킬러 인터랙션** (Henry Heffernan 패턴). 지금은 클릭 → 라우트 이동인데, 모니터 클릭 시 카메라가 화면으로 파고들어 터미널이 풀스크린 UI가 되는 중간 단계를 넣으면 임팩트가 크다.
2. **스크롤 챕터화** (Lempens/Cartier 패턴): 첫 진입 시 스크롤로 데스크 오브젝트들을 카메라가 순서대로 훑는 "투어 모드" → 마지막에 정면 모니터 뷰(현재 상태)로 안착. GSAP ScrollTrigger scrub + 카메라 스플라인.
3. **VOx 방향은 아트디렉션 결정 필요**: 현재 GLB는 사실적 미니어처 스타일. 복셀로 가려면 에셋 전체 재생성(Higgsfield 프롬프트를 "voxel art, blocky"로) 또는 사실적 유지 + 복셀은 포인트 요소(로딩 씬, 파티클)로만. Igloo처럼 "복셀은 연출 기법, 재질은 고급"인 절충도 가능.
4. **적은 오브젝트 고밀도** (Oryzo): 오브젝트 수를 늘리기보다 스파인 모형 하나에 시네마틱 카메라+조명을 몰아주는 히어로 샷 연출.
5. 물리/게임형(B군)은 재미는 크지만 "외과의사 아카데믹 무드"와는 거리 — 참고만.
