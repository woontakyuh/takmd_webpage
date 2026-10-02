# Simple office verification — 3 October 2026

## Scope and isolation

Independent `codex/simple-office` branch and Cloudflare Pages project `takmd-simple`. The detailed `takmdwebpage` project and its apex/www domains are not deployment targets. `simple.takmd.com` has its own active domain mapping and D1 visitor database. The build-time profile defaults to detailed, with miniature geometry/materials enabled only by `PUBLIC_OFFICE_STYLE=simple`.

The approved direction is an architectural miniature, not a raster replacement for the room. All existing application state machines and content remain shared: guided navigation, object approach/inspection, CV and research readers, TV presentations, artwork/photos, workshops, CD playback/replacement, cabinet/bottles, arrangement, local time, sunlight, room lamps, blinds and night skyline.

## Checks

- Type check: zero errors and zero warnings; 111 pre-existing advisory hints. Public boundary checks: 23 CLI scenarios passed; security/MIME/cache header tests passed.
- 418 unit tests passed (70 files, 302,166 assertions).
- Full release browser suite passed: loading/recovery, desk entry, mobile CV, reader scrolling, content, artwork navigation, response policies/media permissions, music/CD/cabinet, object visibility/cutaway walls, touch, physical family-photo picking and idle/active rendering cadence.
- WebKit mobile CV reader return, idle material warmup and cabinet opening passed without JavaScript errors, WebGL errors or context loss. During validation, recompiling already-rendered shared matte programs produced WebKit sampler errors; the miniature profile now warms only unseen material programs.
- All three viewport families are captured in seven states each: overview day/night, research, talks, UBE, music and life (21 images). Research heading contrast, night control contrast and mobile gi atlas integrity were corrected from actual captures.
- Public build scan excludes private dashboard/clinical dataset/auth/dev-tool/authoring-viewer markers. Header tests retain cross-origin script/frame rejection and real local audio/HLS playback checks.

Two independent final reviews passed with no blockers on the current complete capture set: `final-code-review.md` and `final-visual-review.md`. Both inspected all 21 captures; the code review also traced batching, tokens, profile isolation and the Safari fix.

Evidence: `.omo/evidence/simple-office-20261003/`, including `release/browser-results.json`, `safari-final/results.json`, `visual/results.json`, screenshots and `performance.json`.

## Performance boundaries

Measured in fresh Chrome contexts on the same machine at 1440×900, identical camera and DPR 1. The rendered triangle count decreased from 1,065,460 to 552,264 (48.2%); textures decreased from 214 to 184 (14%). Static miniature pieces are merged by finish, preserving parent interactions and transforms. Requested GLB files totalled 22,606,464 bytes in the detailed profile and 7,426,020 bytes in the miniature (67.2% smaller). This is the sum of actual requested model files, not all-page transfer bytes. The implementation does not lower canvas DPR.

This is not a claim that every device is faster: the final run measured 59.38 FPS detailed and 59.75 FPS miniature (95th-percentile frame intervals 29 ms and 18 ms), while earlier repeated runs had variable frame-time tails. Both profiles ran near 60 FPS on this host. Physical iPhone hardware was not available; mobile Chromium and WebKit emulation are the validation boundary. Content media remain faithful, so opening large documents or streaming video still depends on network speed.
