# Office performance diagnosis — 10 September 2026

Measured source: `369ac8bb7b8b9865e0e8a1185d539595cdd2b507`. The subsequent folio change only adjusts camera framing. These measurements are a local controlled comparison, not a physical-phone benchmark.

## What costs time

Chrome with Metal, cold HTTP cache, 20 Mbps / 40 ms network latency. Desktop: 1440 × 900, DPR 1, normal CPU. Mobile simulation: 390 × 844, DPR 2, 4× CPU slowdown. Profiling adds overhead.

| Measurement | Desktop | Mobile simulation |
| --- | ---: | ---: |
| Initial transferred data | 39.26 MB | 39.15 MB |
| First 3D frame | 14.86 s | 16.66 s |
| Ready state | 16.74 s | 21.16 s |
| Median steady frame interval | 50 ms | 83.3 ms |
| Main room draw calls per frame | about 1,466 | about 1,476 |

The room contains about 801 meshes, 1.54 million vertices and 165 GPU textures. The largest actual initial requests include the Fender guitar (6.58 MB), coat (2.87 MB), plant geometry (2.73 MB; geometry and textures together about 4.79 MB), soundbar (2.61 MB), gi (2.47 MB), mapped river model (1.67 MB) and office chair (1.57 MB). The unused Beolab 8 package is **not requested** and is not a saving opportunity.

## Isolated runtime comparisons

These diagnostic changes ran only inside a disposable browser. Every override was restored and the browser closed. No glass, river or occlusion reduction is shipped.

| Diagnostic override | Desktop median frame interval | Mobile simulation median |
| --- | ---: | ---: |
| Baseline | 50 ms | 83.3 ms |
| Freeze exterior render buffers | 50 ms | 83.3 ms |
| Skip HTML occlusion raycasts | 50 ms | 66.7 ms |
| Disable the room's transmission prepass | 33.4 ms | 33.3 ms |
| All three together | 33.4 ms | 16.7 ms |
| Restore baseline | 50 ms | 83.3 ms |

The refraction prepass nearly doubles the main-room draw count: disabling it reduced about 1,476 calls to 749 in the mobile simulation. The current whisky bottle and barware shaders already use zero transmission; the remaining transmitting materials include award crystal and certificate glazing. The river is not the dominant bottleneck in these measurements. CPU profiles also show repeated WebGL command submission and HTML occlusion raycasts; the latter consumed about 16% of sampled mobile-simulation time.

## Recommended order

1. **Reduce repeated rendering, preserving close-up materials.** Start with a distance-aware cheaper representation for tiny, distant award/glazing surfaces, retaining full refraction during approach and inspection. Consider a shared or cached refraction pass only if it preserves moving backgrounds and lighting correctly. Batch compatible static geometry by material and shadow behavior. Verify labels, award edges, glass appearance, hover and raycast targets before shipping.
2. **Narrow occlusion and per-frame work.** Give HTML screen/control occlusion a small, explicit set of real blockers instead of intersecting the whole scene. Re-evaluate only when camera, object transforms or visibility changes. Keep depth-correct controls and eliminate any return of floating monitor overlays. Similarly avoid unnecessary full-scene traversal where current dirty-state signals suffice.
3. **Reduce bytes and decoded texture memory.** Derive optimized geometry/textures from the actual guitar, garments, plant and other large models. Keep the same recognizable silhouettes and finishes. Mount deferred high-detail models only when needed, with near-focus preloading and seamless swaps. Removing a `preload()` call alone is ineffective if the same model's consumer mounts immediately. Compress GPU textures where supported and use appropriately sized derivatives for distant objects; keep sharp PDFs and inspected media.
4. **Then tune the exterior.** Reuse stable exterior/reflection buffers when camera and lighting permit, and batch mapped buildings/vegetation. Keep geographic bridges, traffic and water behavior. Do not expect river-only changes to fix the main-room cost observed here.

For each candidate, repeat the same cold-load and steady-frame measurements, plus visual desktop/mobile day/night tests. A quality reduction that improves a benchmark but makes glass disappear, shows generic substitute furniture, degrades slides or breaks object interaction is a failed change. The current poster, hidden/offscreen pause and responsive resolution limits already exist; do not count them as new improvements.

The official [R3F performance guide](https://r3f.docs.pmnd.rs/advanced/scaling-performance) documents instancing and rendering on demand. Three.js explains why [smaller JPEG/PNG files do not directly reduce decoded texture memory](https://threejs.org/manual/en/textures.html). This diagnosis does not promise an unmeasured percentage reduction.

## Evidence

Local artifacts: `.omo/evidence/office-performance-plan-2026-09-10/` contains `current/results.json`, desktop/mobile CPU profiles and screenshots, `cpu-analysis.json`, `cost-probe.json`, measurement scripts and logs. All profiler browser processes are closed after measurement.
