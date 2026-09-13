# Office performance status — 13 September 2026

The mobile performance problem remains open. This is a source/evidence audit, not a new phone benchmark. No physical iPhone/Safari frame-time, thermal or battery measurements have been made.

Implemented: mobile/coarse-pointer DPR 1 (including book reading); 1024² mobile shadow maps; cached environment and dirty-only shadows; distant-glass refraction hysteresis at 90/120 projected pixels; hidden closed-cabinet interior; instanced Mac mini vents and shelf rods; 2K coat texture; pause for background/offscreen canvas. Cabinet archive content is deferred until approached/opened, and its photo-caption canvases are capped at 1024px on phones.

Evidence: `.omo/evidence/fin-river-performance-2026-09-11/performance-mobile-remedy-report.md` records a matched Chrome/Metal mobile simulation improvement from 83.0 to 29.7ms rendered interval, 1,648 to 843 calls/frame. The comparison sampled four seconds. `.omo/evidence/banpo-park-completeness-2026-09-12/runtime/release.json` records later combined-room day/night intervals of 36.4/29.1ms, about 791 main-scene calls and 996k triangles, from three 350ms samples. These are historical Mac Chrome/Metal measurements with CPU throttling, not GPU timings, display FPS or current physical-phone performance. Do not claim smooth iPhone performance from them.

Remaining costs and next work, in order:

1. Profile fixed room views and transitions on actual Safari/iPhone, then reduce static indoor draw submissions using shared materials and further batching. Existing simulations identify indoor render submission as a major cost.
2. Implement coordinated idle rendering. The visible canvas still uses continuous frames; camera motion, music, clock and water need distinct wake-up schedules. Merely changing the frame-loop mode previously froze the clock and did not reduce cost during music.
3. Reduce mobile window/reflection update frequency and resolution where visually safe. Frustum and cropped-target rendering already exist, but the visible river and 1024² water reflection are still rendered every frame.
4. Audit initial model/texture preloads and decoded GPU memory. Hidden content is not necessarily unloaded; use actual lazy loading and smaller close-up derivatives where supported by measurements.
5. Remove needless shadow invalidation caused by equal lighting objects recreated by the 30-second time update. Benefit has not been measured.

The restored magazine's original images are reused. Reconstruction uses a bounded fragment shader only on printed magazine faces; ink restoration samples local paper eight times per ink pixel and shares the result with emission. That avoids new full-resolution raster assets but is not a measured speed improvement. The magazine's closed cover uses one source sample. Any further optimization should compare the same reading scene before/after.
