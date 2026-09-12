# Named north-bank buildings

`building-identities.json` joins existing scene geometry to named, source-traceable buildings. Its 20 records comprise the 15 existing Seobinggo Shindonga apartment blocks, three Raemian Caelitus towers and two nearby buildings whose full names are explicit OSM tags. This inventory does not itself change the GLB or add scene geometry.

Run `uv run scripts/prepare-banpo-building-identities.py` from the repository root. `--check` regenerates in memory and fails if the checked-in bytes differ. The default source is the committed **1,968-byte** fixture `scripts/fixtures/banpo-named-buildings-osm-2026-07-15.json.gz`; the ignored evidence directory is not needed in a clean checkout or release archive. No map request is made during generation or rendering. The source response reports OSM base timestamp **2026-07-15T15:22:01Z** and was saved on 2026-09-09.

The fixture preserves all original fields for exactly the 20 selected OSM elements, plus the original OSM response metadata. Its `provenance.parentRawSha256` identifies the full source response: `30e4c48866220d1170825f1812becdb2eeba9f7247f6065acb0091df13ef8687`. The compressed fixture SHA-256 is `547f24c2687e3c16694195db2b19eb6bec38825eb6f5f151e4f6b2a31d5f2a46`; the generator verifies both hashes before using the data. Compression uses gzip level 9, empty filename and zero modification time for deterministic bytes. The full-source and fixture hashes are retained separately as `osmSourceSha256` and `osmFixtureSha256` in the output, alongside geography and supplementary-fabric hashes.

Regenerate this inventory after any change to `geography.json` or `urban-fabric.json`, then run `--check` against the final assets. Input geometry and building attributes come from the compact fixture; no ignored source file is required.

## Seobinggo Shindonga identification

The [Seoul Metropolitan Council record](https://ms.smc.seoul.kr/attach/record/SEOUL/appendix/a10/A0050703.pdf) identifies the existing complex as 15 apartment buildings, 1,326 households, 13 above-ground floors, one basement and 1984 completion. This refers to the existing slabs, not the much taller proposed redevelopment.

The saved OSM ways **416550341–416550355** form one contiguous cluster at latitude 37.517077–37.519134, longitude 126.9857897–126.9916566. They are all explicitly tagged apartments, 13 floors and start date 1984. Ten have 78 flats and five have 104, summing exactly to the council's 1,326 households. Their block names are **1, 2, 3, 5–16**. There is no block 4 in this identified set; creating one would incorrectly turn the complex into 16 buildings. [OSM cluster context](https://www.openstreetmap.org/?mlat=37.5181&mlon=126.9887#map=17/37.5181/126.9887).

Identity confidence is high because location, count, floor count, year and household total all agree. The individual block-number-to-footprint correspondence remains OSM attribution: no official site plan labeling every polygon was obtained. No facade photo, map tile or street imagery is redistributed here.

| Block | OSM way | Original base index | Original status |
|---|---:|---:|---|
| 1 | 416550344 | 275 | Retained |
| 2 | 416550343 | 288 | Retained |
| 3 | 416550341 | 307 | Retained |
| 5 | 416550342 | — | Missing |
| 6 | 416550349 | 152 | Retained |
| 7 | 416550348 | 149 | Retained |
| 8 | 416550347 | 151 | Retained |
| 9 | 416550346 | 407 | Retained |
| 10 | 416550345 | 266 | Retained |
| 11 | 416550352 | 154 | Retained |
| 12 | 416550351 | 150 | Retained |
| 13 | 416550350 | 153 | Retained |
| 14 | 416550355 | 135 | Retained |
| 15 | 416550353 | 267 | Retained |
| 16 | 416550354 | 269 | Retained |

Block 5 has a projected centroid 783.2 m north of the origin. The original preparation excluded all building centroids below 800 m, and the supplementary fabric starts at 950 m, so this real riverfront block was omitted from both layers. It must be restored once, while the other 14 must replace their indexed base meshes rather than being added over them. None of these 15 occur in `urban-fabric.json`.

## Geometry and honest height provenance

- The projection retains the established origin **37.5101 N, 126.9918 E**. Coordinate pairs are **east, north in metres**, rounded to 0.1 m. Their second component is geographic north, not renderer vertical height. The scene's existing geographic-to-Three transform remains responsible for orientation.
- `sourceFootprint` is the complete raw OSM polygon after projection, without its repeated closing point. `sourceFootprintLatLon` preserves source latitude/longitude. `p` matches the current base polygon exactly for retained buildings, so replacements use the same outline and position. Missing block 5 uses its actual source polygon.
- `heightM` is **39.65 m for Shindonga**, calculated as 13 × 3.05 m. The 13 floors are supported by both OSM and the council; **3.05 m per storey and the resulting height are estimates**, not surveyed dimensions. The old base rounded this to 39.6 m. No official metre-height override was invented, and no floor-count override was necessary because all 15 OSM tags already agree.
- `z` preserves the current foundation elevation for retained buildings. Missing block 5 receives 20.4 m by bilinear interpolation of the existing 100 m terrain grid. Terrain elevations are not building surveys or verified foundation levels; they remain an explicit fidelity limitation.
- `rawHeightTag`, `rawLevelsTag`, `heightSource`, `floorsSource`, `heightIsSurveyed`, `baseIndex` and `currentMembership` distinguish tagged attributes, derived dimensions, estimates and omitted geometry. `heightIsSurveyed` remains false even when an OSM metre-height tag exists, because its measurement method was not established.

## Raemian Caelitus

[Samsung C&T's project portfolio](https://www.secc.co.kr/ko/business/portfolio/all/123) documents three buildings, 460 households and 2015 completion. [Samsung's skybridge feature](https://news.samsungcnt.com/en/features/engineering-construction/2017-05-bridging-the-sky-samsung-ct-pioneering-the-future-of-the-skybridge/) identifies towers 101/102/103 as 56/42/36 floors. The three saved OSM ways agree on floor counts, 2015 completion and household total (205 + 142 + 113 = 460), at the actual Ichon riverfront cluster west of Shindonga.

| Tower | OSM way | Floors | OSM height | Samsung published height | Original status |
|---|---:|---:|---:|---:|---|
| 101 | 522785017 | 56 | 196 m | 201 m | Missing |
| 102 | 610247142 | 42 | 147.3 m | 166 m | Missing |
| 103 | 610247143 | 36 | 129.3 m | 150 m | Base index 318 |

Towers 101 and 102 were also excluded by the original 800 m north cutoff. The inventory retains their actual source footprints and the existing terrain interpolation for foundations. Their floors and identities are corroborated; the per-footprint OSM numbering remains an OSM attribution.

The differing metre-height values are recorded as an unresolved source conflict in `publishedHeightM`, `publishedHeightSourceURL` and `heightConflict`. **OSM values remain the inventory's selected `heightM`**, without inventing a roof/crown height difference. [RMJM's architectural project page](https://rmjm.com/portfolio/raemian-caelitus-tower-a/) also gives approximately 196 m for Tower A, supporting the need to distinguish published definitions rather than silently substituting a single figure. Exact height datums are not established by these pages.

## Nearby names with weaker evidence

**Daewon Seobinggo** (대원서빙고아파트, way 431589092) and **Seobinggo Green Park** (서빙고그린파크아파트, way 431589099) retain full explicit OSM names. They are not covered by the Shindonga council record. The former has no height or floor tag and retains the existing 44 m estimate; the latter has OSM tags of 18 floors and 56 m. These are naming/attribute records, not permission to apply Shindonga's facade or to claim their elevations are independently verified.

## Attribution and limits

The source geometry is © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), available under **ODbL 1.0**. This derived geographic inventory retains that attribution and license. The council record supports facts about the existing complex but does not supply geometry, window counts, roof plans, material measurements or a certified current as-built survey. Facade appearance and rooftop details require separate visual evidence. Current physical redevelopment status after the OSM snapshot is not certified by this inventory.
