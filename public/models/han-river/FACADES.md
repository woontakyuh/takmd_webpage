# Mapped facade increment · 2026-09-10

49 existing building faces receive restrained dimensional facade attachments. No building footprint, terrain base, massing height, bridge, water surface or GLB geometry is changed. The ten previously detailed OSM building IDs remain represented; 39 additional buildings extend treatment across six geographic sectors. This is an illustrative facade layer on an incomplete mapped city, not a surveyed or photorealistic Seoul reconstruction.

## Geographic source

The source remains [geography.json](./geography.json), downloaded 2026-09-09. © OpenStreetMap contributors, [ODbL 1.0](https://www.openstreetmap.org/copyright). The derived edge data use the same ODbL terms. [Original geographic and terrain provenance](./SOURCE.md) explains the Mapzen/USGS source, elevation datum and known approximations.

Every selected building has the input's `measured: true` flag, which means an OSM height or building-level tag was available, **not** that the dimensions were independently surveyed. Each facade repeats that building's exact `z` base and `h` height from the existing terrain-derived model input. No new height estimate is introduced. `BanpoFacadeSources.ts` records all 49 OSM IDs, input indices, polygon edge indices, exact edge endpoints, bases and heights. Its generating script and expanded geographic receipt are under `.omo/evidence/office-performance-river-2026-09-10/facades/`.

Selection considers existing wall length, height, direction toward the established observer and spatial coverage. Only a complete original polygon edge with landward inner samples is accepted. The renderer uses the wall's perpendicular outward normal, correcting the previous observer-vector offset. Attachments remain within 0.7 m of that edge; each sampled source edge has more than 1 m clearance from the mapped river corridor. The source set ranges from east -1,504.9 m to +2,552.0 m in the established frame. These are scene coordinates, not a claim about a particular residence.

## Inspected visual sources

- [Seoul Institute, Hannam Bridge aerial, April 2015](https://data.si.re.kr/photo/05u03704ba4000), source image `05U03704Ba4000.jpg`. The source page was verified on 2026-09-10 and its existing local photograph inspected. It shows pale residential slab rows, repeated balcony/window recesses interrupted by masonry, and varied urban heights. This older photograph supports facade vocabulary and muted material balance, not the present state of any individually selected building.
- User-supplied Banpo ground-view reference `docs/reference-assets/han-river-2026-09-09/reference-06.png` was inspected for the broad apartment/slab rhythm behind Banpo and Namsan. It does not establish exact window counts, equipment locations or surveyed heights.
- Existing latest landcover QA captures `after-day-window.png` and `after-day-window-left.png` from `.omo/evidence/river-landcover-2026-09-10/` were inspected to locate bare wall regions and retain the established river composition.

No photograph, aerial pixel, logo, building label or map tile is included in the facade layer. Surface patterns are original geometry. Wider existing wall proportions receive shallow balcony ledges and two separated window stacks; shorter/taller faces receive broader vertical piers. This proportion-driven choice is a visual approximation, not verified building-type metadata. The existing GLB rooftop equipment remains; the detail layer adds only a low 0.48 m edge parapet and removes its prior speculative lift/stepped housings.

## Rendering budget and verification

The three existing instance families remain: recessed glazing, masonry/ledges/parapets, occupied windows. They share one box geometry and three materials. The increment contains 4,083 instances / 48,996 triangles total, capped by regression tests at 5,000 / 60,000. The earlier ten-face layer contained 1,435 instances / 17,220 triangles. Actual frame time requires the integrated browser comparison.

A stable per-building/floor/bay hash varies occupancy and three subdued warm/cool light colors. Changing night mix changes one material multiplier and visibility; it does not loop through instances or upload their colors. Occupied-window geometry is hidden at zero night mix. Daytime materials retain muted mineral tones and moderate glazing contrast under the existing exterior lighting.

`bun test scripts/banpoFacades.test.ts` checks source/height/base matching, six-sector coverage, river clearance, every detail's wall alignment and height envelope, three shared-geometry batches, cost caps and daylight reset. Root integration owns day/night/oblique visual acceptance and complete build/runtime testing; this source receipt does not claim that gate has passed.
