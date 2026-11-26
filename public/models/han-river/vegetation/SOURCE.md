# Near-bank tree source

Tree Small 02 by Rico Cilliers / Poly Haven, CC0.
https://polyhaven.com/a/tree_small_02
https://polyhaven.com/license

Downloaded from the official Poly Haven model API on 2026-09-09. The published GLB is a 3,357-triangle derivative with three materials and 512px embedded WebP textures, including alpha-masked leaves. The source geometry was simplified, leaf clusters reduced, and source texture channels remapped for browser instancing. No photographic scene background is used.

Reproduction script: scripts/prepare-river-vegetation.mjs in the project source. Original downloads, verified API checksums and validation receipts are kept outside the public bundle.

## Mapped canopy clusters, 2026-09-10

The 72 tree instances form eight irregular inland groups. They replace the previous 18 isolated detailed trees placed directly along the promenade. This is a bounded visual interpretation of planted areas, not an individual-tree survey or a complete reconstruction of the park.

The current [Google Maps satellite view of Banpo and Jamwon](https://www.google.com/maps/@37.5159,126.9987,1764m/data=!3m1!1e3) was personally inspected on 2026-09-10, followed by a closer aerial view east of Banpo Bridge. It shows tree strips and clumps between open lawns, paved areas, cycleways and walking paths. These references guide grouping and clearances only; no map imagery is shipped. The current scene baseline was the September 10 landcover pass's `live-day-window.png`, not a capture before geographic landcover was installed.

Planting boundaries come from the existing [landcover database](../landcover.json), whose provenance is recorded in [LANDCOVER.md](../LANDCOVER.md). The shipped trees are contained in these original mapped features:

- [Woodland way 1486200782](https://www.openstreetmap.org/way/1486200782): 14 trees.
- [Woodland way 1486200783](https://www.openstreetmap.org/way/1486200783): 4 trees.
- [Woodland way 1486200784](https://www.openstreetmap.org/way/1486200784): 18 trees.
- [Banpo Hangang Park way 418249072](https://www.openstreetmap.org/way/418249072): 18 trees.
- [Jamwon Hangang Park way 981963451](https://www.openstreetmap.org/way/981963451): 18 trees.

The [supplementary circulation data](./canopy-paths.json) contains 71 OSM roads, service ways, footways and cycleways within 130 m of the cluster anchors. It was queried through `https://overpass-api.de/api/interpreter` using `way[highway](37.509,126.995,37.521,127.013); out tags geom;`, with OSM base timestamp `2026-09-10T09:53:05Z`. Coordinates retain every selected path vertex, projected using the existing origin 37.5101 / 126.9918 and rounded to 0.1 m. Segment distance, rather than endpoint distance, selects nearby paths. Tunnels and negative layers are excluded. OSM data and the derived [placement database](./canopy-placements.json) are © OpenStreetMap contributors, shared under [ODbL 1.0](https://www.openstreetmap.org/copyright).

## Exact placement and rendering rules

`src/components/studio/scene/BanpoCanopyPlacement.ts` is the deterministic preparation helper. It uses the existing geography and landcover databases plus the supplementary circulation data. `generateCanopyPlacements()` writes the array stored in `canopy-placements.json`; the browser imports only that 8.4 KB baked array and does not run geographic rejection sampling.

- Seed: `20260910`; unsigned 32-bit LCG multiplier `1664525`, increment `1013904223`. Eight cluster anchors in local east/north metres: `(720,72)`, `(845,145)`, `(995,207)`, `(1080,330)`, `(770,285)`, `(922,424)`, `(1165,652)`, `(1330,803)`.
- Each anchor proposes up to 1,200 uniformly sampled points within a 52 m × 26 m ellipse, rotated with cosine 0.8 / sine 0.6. Nine accepted trees per group give a hard maximum of 72. Position precision is 0.01 m and minimum trunk separation is 8.5 m. Anchors are compositional choices constrained by mapped features, not surveyed tree positions.
- Every accepted point lies inside one park or woodland feature under even-odd ring containment. A conservative 6.5 m crown radius must fit inside all of that feature's edges and holes. The current source asset's maximum horizontal radius is approximately 3.09 m; instance scales vary from 1.55 to 2.05 with deterministic rotation, so crown coverage stays below the clearance radius.
- The complete Han River polygon is excluded. Trunks remain at least 12.5 m from either bank, clearing the source model's 8 m promenade. Existing major-road centerlines require 13.5 m clearance. Building footprints and their edges require 16.5 m clearance.
- Supplementary paths require their half-width plus 6.5 m clearance. A positive OSM width tag supplies the width when present. Otherwise illustrative half-widths are: trunk 12 m; primary 7 m; trunk links/secondary 6 m; tertiary 5 m; residential/unclassified/pedestrian/tertiary links 4 m; service/living street 3 m; cycleway 2 m; footway 1.8 m; path 1.5 m. These are conservative exclusion widths, not claimed engineering measurements.
- Elevation uses the actual source grid's two triangles per 100 m cell, with the same diagonal as the Blender terrain exporter. Overlapping bank shoulders use their source 7–9 m rise across 100 m, taking the higher surface. Positions at or below 4 m are rejected. Exported roots occupy 6–15.43 m local elevation; no constant elevation or terrain-material override is applied.
- The same three source meshes/materials are instanced 72 times, with no additional draw calls compared with the previous 18-instance installation. Total detailed-tree geometry submitted is 241,704 triangles before visibility culling. No animated leaves, per-frame placement work, billboards, new shadow passes or far-forest geometry are added.
- The 18 former bank-edge crude crowns are removed only after the detailed asset loads. Their original exact centers are retained. A 16 m spatial grid bounds triangle-centroid queries; removal radius is 3.8 m, covering the original 3.6 m crown radius plus GLB quantization tolerance. Nearby untouched crowns remain intact. Asset failure retains source coverage; disposal restores original indices and releases shared geometry/material/texture resources.

`bun test src/components/studio/scene/BanpoCanopyPlacement.test.mjs` checks deterministic reproduction, the 72-instance budget, park/woodland containment, a polygon hole, river/promenade/path/road/building clearances, irregular separated groups, source terrain elevation, and CPU raycasts against the actual meshopt-compressed production GLB. The raycasts allow 0.25 m for geographic mesh quantization. The real installer is also exercised with the source tree geometry to verify three instanced draws, index restoration, asset-failure fallback and late-load disposal. These CPU checks do not replace the parent task's integrated day/night visual and frame-time QA.
