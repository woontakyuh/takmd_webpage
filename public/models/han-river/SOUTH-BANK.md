# South Han River skyline, 13 September 2026

The office exterior now includes the missing south-bank Banpo and Jamwon city. The earlier source query covered only 37.512 N and above, the base generator rejected northings below 800 m, and supplemental urban fabric selected only the north bank. The new data is additive; original indexed buildings, north-bank detail, bridge axes, Jamsu, water and camera translation are retained.

## Downloadable data and reproducibility

- [south-bank.json](./south-bank.json): 950 mapped building footprints/parts, 50 simplified construction envelopes, 215 tree placements, and the southward SRTM ground extension. OSM-derived geometry is © OpenStreetMap contributors under [ODbL 1.0](https://www.openstreetmap.org/copyright).
- `scripts/prepare-banpo-south-bank.ts` prepares the layer deterministically from `scripts/fixtures/banpo-south-osm-2026-09-13.json.gz`, the two Terrarium fixtures, the retained geography, park data and `banpo-clast-plan-trace.json`.
- OSM source timestamp: **2026-09-13T08:04:04Z**. Gzipped fixture SHA-256: `95e7e0a0cba0a125fefa82b8a3f7c71693345f274706a06f67ce3bdd6d959ba3`.
- The bounded Overpass extract covers 37.489–37.523 N and 126.971–127.032 E. The construction parcel's full members are supplemented from [OSM relation 6041512](https://www.openstreetmap.org/relation/6041512). Raw responses, query and the downloaded official plan are retained in local task evidence.
- Projection is the existing origin **37.5101 N, 126.9918 E**, metres east/north. Southern land is selected against the actual mapped bank polyline, not a constant-latitude guess. No new building is moved to improve a window composition.

## Completed buildings

Metric OSM height tags are used first; `building:levels × 3.05 m` is next. These are map tags and estimates, not survey measurements. 843 of 950 retained objects have one of these tags. Untagged apartments use 44 m, ordinary buildings use 11 or 19 m, and the six untagged OnePentas towers use a **100 m visual estimate** consistent with the published 35-floor envelope. This does not claim the exact floor count or metric height of each OnePentas block.

Named residential parcels supply complex identity. Recognizable groups include [Raemian One Bailey](https://www.raemian.co.kr/sales/sub/s/onebailey?menuSeq=8426), [Acro River Park](https://www.acro.co.kr/MPosm_main.action?commonMap.CD_BIZ_LND=010366), [Raemian OnePentas](https://raemian.co.kr/community/times/style/view.do?seq=101), Firstige, Banpo Xi, Central Xi, Banpo Le El and the Jamwon apartments. The official One Bailey description specifies 23 residential blocks and up to 35 floors; the official Acro page specifies 15 buildings, 10–38 floors; OnePentas specifies six buildings and up to 35 floors. Data object counts include commercial/support buildings and separate height-bearing `building:part` polygons, so they are not apartment-block counts.

Acro's upper tower and lower wing geometries are primarily mapped as `building:part`. They are retained down to a 10 m² footprint, and enclosing shells are omitted when mapped parts already describe the structure. The render stays a simplified geographic massing: repeated windows and roof surfaces are illustrative, not a photo-textured or architecturally surveyed reconstruction.

## Current construction west of Acro River Park

[Seoul's municipal redevelopment portal](https://cleanup.seoul.go.kr/assc/scrin-bbs/execute.do?cafeId=650900000161f71) identifies the Banpo Jugong 1 complex, sectors 1/2/4, at the construction stage. [Hyundai's Clast project page](https://www1.hdec.kr/kr/tech/project.aspx?bizCate=SUPERLAGE&bizIntro=317&searchType=HOUSE) also describes ongoing construction.

The [municipal site plan](https://cleanup.seoul.go.kr/cafe/mastr-cleanup-bsnsSumry/execute.do?cafeId=650900000161f71&div=posImage&stepSeCode=103), dated by its source file **29 November 2024**, labels 50 building blocks. `banpo-clast-plan-trace.json` records their manually traced rectangular envelopes and the published maximum floors shown beside each block. An affine transform matches three plan parcel corners to the corresponding OSM parcel coordinates. All 50 envelope centers lie inside the mapped construction parcel. These are **simplified plan envelopes**, with approximate footprint widths/angles, not surveyed as-built footprints.

The owner's 13 September 2026 southbound Banpo Bridge photos show unfinished concrete towers, multiple tower cranes and a continuous green foreground. Each plan block is rendered at **65% of its planned floor-height envelope** as a transparent visual assumption about current progress. Exact current per-block progress is unavailable. Fourteen static crane silhouettes are attached to the taller traced blocks; crane mast/boom dimensions and exact positions are illustrative. They do not imply an official crane count. No random building scatter is used.

## Ground, planting and limitations

South terrain extends the original grid from northing −200 m to −2,200 m. It uses [Mapzen Terrarium tiles](https://s3.amazonaws.com/elevation-tiles-prod/terrarium/) z12/3492/1587 and z12/3493/1587, SRTM data courtesy USGS, decoded at the same −5 m visual water datum and sampled every 100 m. The old northern grid is sampled at the shared boundary. The retained data is not altered. Park/woodland polygons classify green terrain; elsewhere the existing mineral palette is used with the shared fine gravel texture.

124 tree positions follow the green frontage band in the municipal site plan; 91 additional trees occupy the retained mapped Banpo park boundary belt, excluding paths, hardscape, amenities and the river. Spacing, crowns and trunks are approximations at geographic viewing distance. They use opaque instancing and no additional downloaded texture.

The mapped extract still lacks complete footprints for some recently redeveloped parcels, including Maple Xi and Trinione. This pass does not invent towers to fill those parcels. Further official plan tracing can improve their coverage later. Construction state, estimated heights and simplified facades remain visible-model limitations.

## Runtime and verification

Completed walls/roofs and unfinished walls/roofs are merged. Ground is one batch; tree crowns, trunks and cranes use instancing. The whole addition uses **8 draw calls**, no shadows and no per-frame generation. Materials use `BanpoAppearance` and the existing facade/night shader. All owned geometries/materials/instances are disposed on scene cleanup; the shared gravel texture remains owned by the atmosphere.

`bun test --timeout 45000 scripts/banpoSouthBank.test.ts scripts/banpoUrbanFabric.test.ts scripts/banpoJamsu.test.mjs` verifies source identities, actual runtime budgets/disposal, the retained north-bank fabric and Jamsu. Actual office-window captures at desktop and phone widths, matched layer-hidden/layer-visible camera comparisons, and bridge-facing/plan diagnostic images are in `.omo/evidence/interaction-stability-2026-09-13/south-han/`. Diagnostic aerial views are separate from the user's unchanged office camera. This is local work; no commit or deployment is part of this pass.
