# North-bank low-rise fabric

[urban-fabric.json](./urban-fabric.json) is derived from © OpenStreetMap contributors and is shared under [ODbL 1.0](https://www.openstreetmap.org/copyright). It restores 380 small, mapped building footprints omitted by the original 850-building area-ranked selection. It does not alter that original database or its indices.

The source is the saved Overpass building response downloaded on 2026-09-09, whose response metadata reports the OSM base timestamp **2026-07-15T15:22:01Z**. It is recorded at `.omo/evidence/han-river-banpo-2026-09-09/osm-raw.json`. Its SHA-256 is `30e4c48866220d1170825f1812becdb2eeba9f7247f6065acb0091df13ef8687`. Original `geography.json` remains byte-identical, SHA-256 `cafdeced83e1435b791ab3621b01406fbf88e19b8052699342b760acdeddaffc`.

Generate deterministically with `bun scripts/prepare-banpo-urban-fabric.ts` from the repository root, with the saved source response available. No network request runs during generation or scene rendering. Each output retains its OSM ID, polygon, terrain base, height, area and tagged-height flag.

The preparation uses the existing origin, 37.5101 N / 126.9918 E, and rounds projected coordinates to 0.1 m. Selection is confined to east −1,800…2,550 m and north 950…3,000 m, footprint areas 50…500 m², and heights at most 28 m. It excludes existing buildings, river cells, and every intersecting park or woodland feature in [landcover.json](./landcover.json). Even-odd inner rings remain exclusions from protected cover, so a mapped building inside a park polygon's hole is permitted. These are the existing simplified landcover boundaries, not a survey.

`measured: true` means an OSM `height` or `building:levels` tag exists; it does not mean independently surveyed. Four selected buildings have tagged heights; 376 use an explicit 11 m estimate. Levels convert at 3.05 m per floor. Untagged apartment buildings are excluded because their existing 44 m estimate exceeds this layer's height limit. Terrain bases use the existing terrain surface, with a 0.2 m foundation overlap.

The layer ranks candidates by proximity to the central north-bank neighborhood and stops at 380 buildings or 20,000 triangles. Its initial output contains 6,512 triangles in two merged wall/roof meshes, with no added shadows, image textures or per-frame geometry work. The 62.7 kB JSON is bundled into the existing scene chunk; it adds no separate runtime request. Ground forecourts reuse the existing 1024² material mask, with protected park/woodland cover painted last.

Base facade windows are illustrative, stable shader detail: a world-position seed varies occupancy by block, room and floor, with warm and occasional cooler lights. Day/night changes a single uniform per material; occupancy has no clock or CPU animation. The existing 49 dimensional facade attachments remain unchanged.

Visual direction comes from the supplied Banpo view in `docs/reference-assets/han-river-2026-09-09/reference-06.png` and daytime panorama `reference-02.png`: low-rise neighborhoods behind a thin green riverbank, with Namsan retained. The photos establish visual density and material hierarchy, not exact individual heights or windows. The [official Banpo Hangang Park description](https://hangang.seoul.go.kr/www/contents/663.do?mid=463) supports retaining the riverside park and separated paths. No photograph or map image is shipped in the window view.

This remains a selective geographic interpretation. The original 100 m terrain, existing building count and bridge axes are preserved; untagged heights, window occupancy, roof materials and facade colors are visual estimates.
