# Simple office verification — 3 October 2026, revision 2

## Scope

This revision targets the independent `codex/simple-office` branch and Cloudflare Pages project `takmd-simple`. The detailed `takmdwebpage` deployment is checked before and after publication. Its apex/www domains are not deployment targets. Both profiles continue sharing navigation, readers, TV, artwork, workshops, CD operations, arrangement and time-dependent lighting.

The revised simplification preserves designer geometry instead of replacing furniture with generic shapes. Ten restored models have byte-identical decoded positions, normals, UVs, indices and node transforms: sofa, desk chair, lounge chair, ottoman, coffee table, guitar, coat, gi, palm and pig. Surface microtextures are removed where appropriate; printed/color maps use 1024px WebP. The palm retains leaf transparency. Guitar geometry, sunburst coloring and original material treatment remain in place. Printed content assets remain unchanged. No canvas DPR reduction is used for this conversion.

## Asset budget

The ten validated models total 17,217,480 original GLB bytes versus 9,218,492 derivative GLB bytes. Texture data associated with those models, including the palm's external image, total 11,592,495 versus 1,644,280 bytes (85.8% smaller). Their image dimensions total 57,933,824 versus 15,728,640 pixels (72.9% fewer). These are model-specific figures, not total website transfer sizes or measured GPU memory. The palm's external texture is not included in the GLB byte total. Furniture without texture maps retains its original file size and geometry cost.

The previous miniature's triangle-reduction figures no longer describe this revision. Geometry retention deliberately restores the original furniture detail; decorative texture reductions and material preparation provide the savings here.

## Entry and cabinet recovery

The simple profile uses a consistent neutral loading backdrop. Wheel, double-tap and keyboard camera interruption cannot cancel the seated loading or peeking transition. An early CV scroll is restored synchronously when layout exists, preventing deferred initialization from overwriting the visitor's first input. Desktop and phone tests delay room assets, issue early camera input, read CV/publications and verify that room reveal preserves reading position.

Simple cabinet labels and magazine covers load while preparing the room. Texture upload, asynchronous program linking and uniform discovery occur before first opening. A stable bottle-label shader cache callback avoids recompiling its material on each opening/selection. Warmup restores interior visibility synchronously and excludes already-rendered materials to preserve WebKit shadow samplers. Preloading and rendering use identical versioned model URLs to avoid duplicate fetches.

A controlled Chrome phone-viewport run reduced the first-open frame gap from approximately 125ms to 16.7ms, with the door opening in approximately 491ms. This is one local measurement, not an iPhone performance guarantee. The bottle view fits the selected bottle and the remaining collection; real projected canvas clicks/taps verify that all six other bottles remain reachable and that selection changes directly.

## Validation

- Type check: 516 files, zero errors/warnings, 114 existing advisory hints.
- Unit checks: 422 passing tests in 70 files, 303,062 assertions.
- Public boundary: 23 CLI scenarios passed; security, MIME, range and cache-header checks passed.
- Full production-build browser suite passed across 12 groups: loading/recovery, desk entry, mobile CV, reader, content, artwork, headers, media/CD/cabinet, visibility/cutaway walls, touch, physical family-photo picking and rendering cadence.
- WebKit phone CV return, idle shader warmup and cabinet opening passed without JavaScript/WebGL errors or context loss.
- Ten-model decoded geometry and texture validation passed. Browser captures confirm original furniture/guitar proportions and legible bottle presentation.

Evidence is under `.omo/evidence/faithful-models-20261003/`, `.omo/evidence/entry-recovery-20261003/` and `.omo/evidence/whisky-recovery-20261003/`. Browser checks use desktop Chrome and mobile Chrome/WebKit emulation; physical iPhone hardware was unavailable. Network speed and large document/video content remain independent limits. The original release's review files and performance figures are historical evidence, not approval or measurements of this revision.
