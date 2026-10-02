# Office entry loading measurements

One cold sample before and one after, measured in headless Chromium with Metal at 1440 × 900, disabled cache, 20 Mbps download and 40 ms latency. This is a controlled comparison, not a claim about every visitor or device.

| Metric | Before | After |
| --- | ---: | ---: |
| Initial transferred bytes | 56,557,678 | 41,897,881 |
| First WebGL frame | 21.99 s | 16.26 s |
| Banpo model requests | 4 | 1 |

The lightweight actual-office poster finished loading at 131 ms in the after sample, before the full interactive scene. The six lossless model reductions preserve decoded geometry/material values; four Fender images use lossless WebP with identical decoded pixels. The Banpo scene now initializes on a committed effect rather than during an abandoned Suspense render. Books initially request only the small spine atlas; inner pages remain interaction-driven.

The final after sample includes the Isidoro cabinet, complete 2025–2026 manifest, and regenerated office posters. The loading poster is gone and the scene is interactive by 18.47 s; the first WebGL frame is a separate earlier milestone, not full readiness. Raw resource lists, screenshots, runtime tests and the final release receipt are retained in `.omo/evidence/office-entry-2026-09-09/`.
