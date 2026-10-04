# Simple rendered office — 4 October 2026

## Release boundary

Only simple.takmd.com uses `PUBLIC_OFFICE_RENDER=illustrated`. `build:main` explicitly selects `faithful`; the main deployment helper rejects illustrated output. The simple helper requires its own canonical URL and the illustrated marker. Both builds share the latest interaction and content implementation.

## What changes

- Original model files, geometry, object placement, labels, photos, and artwork remain unchanged. Runtime hashes compare furniture/guitar indices, every vertex attribute and world transforms against the faithful build.
- Opaque surfaces use broad diffuse shading and restrained highlights instead of physical environment reflections and micro-surface maps. Artwork relief, custom award textures, transparent glass, and optical whisky liquid are preserved.
- Time-dependent ambient/hemisphere fill, directional sun and all controllable light sources remain. Sun shadows use a crisp single sample at the existing map resolution.
- The river uses an animated analytic surface, avoiding a second mirrored city render. City geometry, bridge, traffic, parallax and night state remain.
- The illustrated desktop uses existing 1024px scene-image variants. HTML readers/gallery originals and the screen framebuffer resolution are unchanged.
- Eight entry posters are regenerated from the illustrated room; the fingerprint includes the render profile.

## Measured rendering cost

Chrome with Metal on this Mac, identical viewport/camera path and fixed daytime, approximately 420 frames per case. GPU timestamps cover the entire R3F frame, including the exterior render. These are local browser measurements, not physical iPhone/Safari timing or end-to-end network speed.

| View | Faithful mean GPU ms | Illustrated mean GPU ms | Reduction |
|---|---:|---:|---:|
| Desktop overview | 7.043 | 5.729 | 18.7% |
| Mobile viewport overview | 5.402 | 3.839 | 28.9% |
| Desktop window | 6.296 | 4.943 | 21.5% |
| Mobile viewport window | 3.391 | 2.398 | 29.3% |

The first idle-FPS comparison was discarded: the shared frame scheduler intentionally idles at 6 FPS, so idle frame count does not measure rendering capacity.

## Evidence

Local evidence: `.omo/evidence/render-office-20261004/`. `gpu.json` and `window-gpu.json` contain measured GPU samples summarized per run and console errors. `comparison.json` contains exact geometry/transform comparisons, material counts and day/night captures. `regression.json` records browser interaction checks. `deployment-before.json` pins the unchanged main deployment.

Type checking: 0 errors / 0 warnings. Unit suite: 447 passed. Public-build check passed for 2451 assets. React Doctor changed-line scan reported 0 errors and three existing/component-complexity warnings; it did not certify the whole application.

Self-review: changes remain build-scoped, preserve original asset geometry, preserve custom optical/artwork shader contracts, retain all interaction state, and make the loading posters profile-specific. No new dependency or network service. Lighthouse 100 and physical-iPhone performance were not established by these GPU/interaction checks.

## Final browser review

All eight regression groups passed on the final production build: whisky switching (mobile/desktop), arrangement camera, artwork zoom/orbit/gallery, CD/media controls, startup object visibility and cutaway walls, cold entry (Chrome and WebKit), responsive CV, and workshop readers/photos (Chrome and WebKit). Browser shader/console checks in the paired visual and GPU runs were empty. Day/night desktop captures were reviewed together with mobile bottle and entry captures. Geometry hashes matched the faithful baseline. Poster freshness and the main-deployment rejection guard passed. Review outcome: approved for the independent simple-domain release.

Release build ID: `office-20261004-rendered-r1`. The main domain remained `office-20261004-tsess-r13` before publishing.
