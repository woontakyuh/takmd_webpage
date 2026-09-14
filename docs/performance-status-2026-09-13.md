# Office performance status — 13 September 2026

Physical iPhone performance remains open. The later interaction-stability pass includes new desktop and mobile-browser simulation measurements, summarized below; no physical iPhone/Safari frame-time, thermal or battery measurements have been made.

## Music inspection and playback regression

The guitar/amp and proposal-frame approach callbacks depended on the identity of the R3F viewport-size object. Repeated identical inspection updates kept camera controls disabled and triggered geometry allocation across unrelated children. The reproduced baseline grew by 1,020 geometries in 60 frames. Depending on numeric width/height stops the loop, restores orbit/pinch/wheel controls, and keeps settled resource counts stable. Closing now detaches the video from its material before disposing it; frame activation cancels a pending amplifier approach so rapid taps cannot bounce out of playback.

The 180-second normal-motion desktop Chromium profile at 1280×720 recorded 72.45–74.97 FPS over six 30-second windows. Geometry/texture/program counts stayed at 835/171/139; CDP JS heap moved from 102.4 to 103.4 MB with natural collection and no forced GC. Continuous 1080p playback dropped 15 of 5,445 decoded frames. These values describe the frame close-up, not the whole room or actual iPhone. Five video open/close cycles, mobile touch orbit/pinch and orientation changes passed with no retained video textures. A separate six-CD test kept 834 geometries through the sequence, including automatic CD1→CD2 and 30 seconds on CD2. Evidence: `.omo/evidence/interaction-stability-2026-09-13/media/`, `camera/after/` and `cd-profile.json`.

## Existing room optimization and remaining work

Implemented: mobile/coarse-pointer DPR 1 (including book reading); 1024² mobile shadow maps; cached environment and dirty-only shadows; distant-glass refraction hysteresis at 90/120 projected pixels; hidden closed-cabinet interior; instanced Mac mini vents and shelf rods; 2K coat texture; pause for background/offscreen canvas. Cabinet archive content is deferred until approached/opened, and its photo-caption canvases are capped at 1024px on phones.

Evidence: `.omo/evidence/fin-river-performance-2026-09-11/performance-mobile-remedy-report.md` records a matched Chrome/Metal mobile simulation improvement from 83.0 to 29.7ms rendered interval, 1,648 to 843 calls/frame. The comparison sampled four seconds. `.omo/evidence/banpo-park-completeness-2026-09-12/runtime/release.json` records later combined-room day/night intervals of 36.4/29.1ms, about 791 main-scene calls and 996k triangles, from three 350ms samples. These are historical Mac Chrome/Metal measurements with CPU throttling, not GPU timings, display FPS or current physical-phone performance. Do not claim smooth iPhone performance from them.

Remaining costs and next work, in order:

1. Profile fixed room views and transitions on actual Safari/iPhone, then reduce static indoor draw submissions using shared materials and further batching. Existing simulations identify indoor render submission as a major cost.
2. Implement coordinated idle rendering. The visible canvas still uses continuous frames; camera motion, music, clock and water need distinct wake-up schedules. Merely changing the frame-loop mode previously froze the clock and did not reduce cost during music.
3. Reduce mobile window/reflection update frequency and resolution where visually safe. Frustum and cropped-target rendering already exist, but the visible river and 1024² water reflection are still rendered every frame.
4. Audit initial model/texture preloads and decoded GPU memory. Hidden content is not necessarily unloaded; use actual lazy loading and smaller close-up derivatives where supported by measurements.
5. Remove needless shadow invalidation caused by equal lighting objects recreated by the 30-second time update. Benefit has not been measured.

The restored magazine reuses its original images and samples each full page through a continuous coordinate projection. The rejected donor-block and multi-sample ink restoration shader is removed. No new full-resolution raster assets are added; this change has not been independently measured as a frame-rate improvement. The south-bank addition is eight static geometry batches, with 47,122 rendered triangles including instancing and no new shadows or animation loop. Any further optimization should compare the same room or reading scene before/after.
