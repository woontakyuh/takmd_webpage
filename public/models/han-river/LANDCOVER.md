# Banpo ground landcover

The derived [landcover database](./landcover.json) is © OpenStreetMap contributors, shared under [ODbL 1.0](https://www.openstreetmap.org/copyright). It was prepared on 2026-09-10 from the Overpass OSM base timestamp **2026-09-09T22:46:48Z**. No aerial photograph or map image is included in the website material.

## Geographic inputs

The source queries select ways and relations carrying `landuse`, `natural=wood`, or `leisure=park` within south/west/north/east bounds `37.507,126.951,37.573,127.033`. They ran separately against `https://overpass-api.de/api/interpreter`: ways with `out tags geom`, relations with `out body geom`. An earlier mirror response had an older July timestamp and was superseded by the current response before preparation.

Recognizable boundaries retained in the data include:

- [Namsan woodland, way 244397333](https://www.openstreetmap.org/way/244397333)
- [Ichon Hangang Park, way 416763235](https://www.openstreetmap.org/way/416763235)
- [Banpo Hangang Park, way 418249072](https://www.openstreetmap.org/way/418249072)
- [Jamwon Hangang Park, way 981963451](https://www.openstreetmap.org/way/981963451)
- [Yongsan Children's Garden, relation 17862382](https://www.openstreetmap.org/relation/17862382)
- [Hannam The Hill residential block, way 228802387](https://www.openstreetmap.org/way/228802387)

The existing Google Maps satellite overview and Naver bridge aerial references were inspected locally. The Google overview establishes the broad contrast between dense urban fabric, Namsan woodland and narrow riverside parks; the Naver close views establish bridge context. They supply qualitative reference only, without tracing or shipping their pixels. Capture receipts remain in the local September 9 river-bridge evidence folders.

## Preparation and rendering

Coordinates use the existing `geography.json` origin, latitude 37.5101 / longitude 126.9918. East metres are longitude difference × `111320 × cos(origin latitude)`; north metres are latitude difference × `111320`. The atlas covers east −3500 to 3500 m and north −200 to 6800 m, matching the complete existing terrain grid.

Source boundaries intersecting that extent and having an outer area of at least 225 m² are retained. Douglas–Peucker simplification uses a 4 m tolerance; output coordinates round to 0.1 m. Relation members are joined by shared endpoints, retaining outer rings and inner exclusions. The database contains 473 developed/disturbed polygons, 399 park/grass polygons and 227 woodland polygons, with 12,048 vertices. Feature OSM IDs remain attached for inspection.

Developed/disturbed includes residential, commercial, retail, industrial, railway, office, construction and brownfield tags. Park/grass includes parks, grass, meadow, village green, greenery, flowerbeds, recreation grounds and greenfields. Woodland includes `natural=wood` and `landuse=forest`. Military and religious landuse are not treated as evidence of paved land.

A single 1024² linear-data canvas holds developed land in red, woodland in green and parks in blue. Broad developed polygons draw first, then parks and woodland. Existing selected building forecourts and major roads remain mineral detail. Even-odd filling retains relation holes. The mapped river corridor from the existing two bank arrays is cleared last, and only existing `Terrain ` materials use this mask. Bridges, water, geometry, buildings and traffic are unchanged.

The two bank arrays run in opposite directions and share their eastern endpoint. Their western endpoints are joined across the river at the source boundary; their concatenated 288-vertex ring has no proper segment crossings. The mask respects this existing cropped geography rather than claiming new shoreline survey accuracy.

Color ramps are illustrative scene materials, not remotely sensed surface measurements. Low-contrast material variation uses existing gravel at 5 m and 80 m scales. OSM landuse is incomplete, building coverage remains selective, and the 100 m terrain/low-detail skyline remain unchanged. Unclassified ground retains the previous grass material; the result does not claim complete urban density or individual tree reconstruction.

## Verification

Local evidence in `.omo/evidence/river-landcover-2026-09-10/` includes the source responses, reproducible preparation script, per-feature tags/vertex receipt and a CPU driver of the real material installer. The driver rasterizes its actual canvas operations, checks named urban/park/woodland locations, two relation holes, 514 river samples, zero river-ring self-crossings, coordinate extent, untouched mesh positions/bridge material, linear data texture and mask disposal. The material module passes the project's installed TypeScript 5.9 strict check. Actual day/night scene verification is recorded by the parent task separately.
