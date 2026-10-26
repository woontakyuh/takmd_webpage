# Han River building fixture

`banpo-buildings-osm-2026-07-15.json.gz` is the complete saved Overpass response used to prepare the north-bank fabric. It keeps the tests independent of local, ignored evidence directories. It is test-only and is not copied into the public website.

© OpenStreetMap contributors, [ODbL 1.0](https://www.openstreetmap.org/copyright). The response's OSM base timestamp is 2026-07-15T15:22:01Z; the response was downloaded on 2026-09-09. Decompressed SHA-256: `30e4c48866220d1170825f1812becdb2eeba9f7247f6065acb0091df13ef8687`. The gzip timestamp is zero for reproducibility.

Selection, estimates and runtime data provenance are documented in [URBAN-FABRIC.md](../../public/models/han-river/URBAN-FABRIC.md). The fixture is the original response, not regenerated from the expected test output.

## Banpo park, 2026-09-12

`banpo-park-osm-2026-09-12.json.gz` is a normalized public OSM Map API extract from https://api.openstreetmap.org/api/0.6/map?bbox=126.973,37.501,127.009,37.517 (ODbL, © OpenStreetMap contributors). The original XML SHA-256 is `d6f0870aee84a006dcf791448a7f735be9b17b9783719772befce29872fdd87f`. Geometry retains way-node order and source tags. Run `bun scripts/prepare-banpo-park.ts` to reproduce `public/models/han-river/park.json`; output includes the normalized-source SHA-256.

Ground: ways 418249072 (Banpo), 25979109 (Seoraeseom). Bridges: 320797964/320797974/320797973. Courts: 1497710478/1497710479. Yebit: 305692221 and bandstand1354859718. Official Moonlight-stage point: facility9955, https://hangang.seoul.go.kr/www/facility/map.tab?srchCd=9955 . Ground geometry, paths and these footprints are mapped. Widths without OSM tags, park elevations outside the source grid, buildings' height, parking markings, rail details and screen height are estimates. Seven mapped parking polygons do not imply seven official parking facilities.

Google Earth north-up aerial views, imagery date 2026-05-24, inspected 2026-09-12, informed authored Moonlight curved-tier shapes and canal-side tree distribution. `BanpoParkLandmarks.ts` records the reference URL and precision. Do not describe this layer as a survey or as containing all of the park's small facilities.
