# Office performance status — 13 September 2026

Physical iPhone and MacBook thermal measurements remain open. The current follow-up reduces steady room work and uses native HLS where supported. Release and current measurements are recorded under `.omo/evidence/safari-camera-load-2026-09-13/` and `.omo/evidence/macbook-media-load-2026-09-13/`; only a matching release receipt establishes deployment.

## Steady scene and Safari follow-up

Desktop now uses the existing distance-based glass simplification, retaining physical refraction when a glass surface is large enough to inspect. A clean matched whole-room Chromium/Metal comparison removed the recurring transmission target and reduced approximately 1,719 draw submissions per frame to 958; observed cadence improved from 18.4 to 26.7 FPS. Shadows were already cached in this view; no shadow change was justified.

One scene scheduler now advances the entire scene, including the window and water passes: up to 30 FPS while settled and 60 during camera gestures/transitions; proposal viewing retains native display cadence. The old second frame-loop owner in CameraRig is removed. Hidden/offscreen/fullscreen-paused scenes stop scheduling. Both 30 and 60 FPS video trials increased dropped frames over sustained playback on the 75 Hz test display and were rejected. Proposal viewing retains the previous unrestricted display cadence; no video power saving is claimed from the scheduler.

Browsers with native HLS support assign the master playlist synchronously on the deliberate frame click. Other browsers retain the bounded hls.js path and MP4 fallback. A headed WebKit probe confirmed direct native playback without loading hls.js, and touch-sized room QA covered seek, pause/resume, orientation and close cleanup. The final three-minute 1080p Chromium video run reached 186.93 seconds with 5 dropped frames out of 5,612 (0.089%), stable geometry/texture/program counts and 74.92–74.96 display FPS. The three-minute whole-room CD run kept its resources stable at approximately 26.5 FPS. These observations do not establish a physical iPhone OS-crash or temperature result.

The scheduler is a ceiling, not a guaranteed frame rate: a denser orbited room view still measured 21.5 FPS. Automated target switching/minimization did not make Chromium report a hidden document, so those attempts do not verify actual hidden/resume behavior. The earlier stationary-reader probe timed out on an obsolete selector; the corrected entry/CV integration subsequently verified preserved reader scroll through loading, paused scene frame counts and normal restoration on Close. See `renderer-results.md` under the media-load evidence directory for the full measurement boundaries.

## Music inspection and playback regression

The guitar/amp and proposal-frame approach callbacks depended on the identity of the R3F viewport-size object. Repeated identical inspection updates kept camera controls disabled and triggered geometry allocation across unrelated children. The reproduced baseline grew by 1,020 geometries in 60 frames. Depending on numeric width/height stops the loop, restores orbit/pinch/wheel controls, and keeps settled resource counts stable. Closing now detaches the video from its material before disposing it; frame activation cancels a pending amplifier approach so rapid taps cannot bounce out of playback.

The 180-second normal-motion desktop Chromium profile at 1280×720 recorded 72.45–74.97 FPS over six 30-second windows. Geometry/texture/program counts stayed at 835/171/139; CDP JS heap moved from 102.4 to 103.4 MB with natural collection and no forced GC. Continuous 1080p playback dropped 15 of 5,445 decoded frames. These values describe the frame close-up, not the whole room or actual iPhone. Five video open/close cycles, mobile touch orbit/pinch and orientation changes passed with no retained video textures. A separate six-CD test kept 834 geometries through the sequence, including automatic CD1→CD2 and 30 seconds on CD2. Evidence: `.omo/evidence/interaction-stability-2026-09-13/media/`, `camera/after/` and `cd-profile.json`.

## Existing room optimization and remaining work

Implemented: mobile/coarse-pointer DPR 1 (including book reading); 1024² mobile shadow maps; cached environment and dirty-only shadows; distant-glass refraction hysteresis at 90/120 projected pixels; hidden closed-cabinet interior; instanced Mac mini vents and shelf rods; 2K coat texture; pause for background/offscreen canvas. Cabinet archive content is deferred until approached/opened, and its photo-caption canvases are capped at 1024px on phones.

Evidence: `.omo/evidence/fin-river-performance-2026-09-11/performance-mobile-remedy-report.md` records a matched Chrome/Metal mobile simulation improvement from 83.0 to 29.7ms rendered interval, 1,648 to 843 calls/frame. The comparison sampled four seconds. `.omo/evidence/banpo-park-completeness-2026-09-12/runtime/release.json` records later combined-room day/night intervals of 36.4/29.1ms, about 791 main-scene calls and 996k triangles, from three 350ms samples. These are historical Mac Chrome/Metal measurements with CPU throttling, not GPU timings, display FPS or current physical-phone performance. Do not claim smooth iPhone performance from them.

Remaining costs and next work, in order:

1. Profile fixed room views and transitions on actual Safari/iPhone, then reduce static indoor draw submissions using shared materials and further batching. Existing simulations identify indoor render submission as a major cost.
2. Measure further idle savings after the coordinated 30/60 FPS scheduler. Fully demand-driven rendering would need clock, animation and water wake-up ownership; it is not implemented in this pass.
3. Consider additional mobile reflection resolution reductions where visually safe. The visible river and reflection now share the coordinated scene cadence; they are not independently updated more often than the room.
4. Audit initial model/texture preloads and decoded GPU memory. Hidden content is not necessarily unloaded; use actual lazy loading and smaller close-up derivatives where supported by measurements.
5. Remove needless shadow invalidation caused by equal lighting objects recreated by the 30-second time update. Benefit has not been measured.

The restored magazine reuses its original images and samples each full page through a continuous coordinate projection. The rejected donor-block and multi-sample ink restoration shader is removed. No new full-resolution raster assets are added; this change has not been independently measured as a frame-rate improvement. The south-bank addition is eight static geometry batches, with 47,122 rendered triangles including instancing and no new shadows or animation loop. Any further optimization should compare the same room or reading scene before/after.
