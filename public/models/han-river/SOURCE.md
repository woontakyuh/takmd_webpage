# Banpo Han River pilot

This geographic scene is the default office exterior, with Banpo Bridge retained in the overview composition.

## Geometry sources

- © OpenStreetMap contributors, ODbL 1.0: https://www.openstreetmap.org/copyright
- OSM data downloaded 2026-09-09 through Overpass. Banpo bridge footprint way 1085504592; Jamsu crossing way 1091571021; islands 305677067 (Gavit), 270550732 (Chavit), 305677071 (Solvit); Han River multipolygon 152336.
- The derived geometry input database is [geography.json](geography.json), shared under ODbL 1.0. It includes the selected footprints, terrain samples and origin.
- Terrain: Mapzen terrain tiles, global SRTM data courtesy of USGS. Tilezen format/attribution: https://github.com/tilezen/joerd/tree/master/docs . Terrarium tiles z12/3492/1586 and z12/3493/1586 from https://s3.amazonaws.com/elevation-tiles-prod/terrarium/ . Heights are decoded, interpolated, sampled at 100 m, and lowered by 5 m to set the visual water datum. River cells are flattened below the water. This is not a survey or navigation product.

## Visual interpretation

Real building footprints and tagged building heights are retained where available. Buildings lacking a height or level tag use explicitly estimated heights. Window patterns and rooftop equipment are original illustrative detail. The geographic input marks tagged versus estimated heights.

Banpo's paired piers, upper road, lower Jamsu crossing, railings, lamps and structural girders are original reference-based geometry, not engineering CAD. The Sebitseom envelopes and N Seoul Tower details are also reference models. The user's photographs guide proportions and composition; no reference photo is used as the window background or baked over the scene.

Location: source origin 37.5101 N / 126.9918 E. The web observer is 280 m south and 1,400 m east of that origin, with an exterior eye height of 300 m. This fixed translation follows the room camera without automatic camera motion. The scene includes the principal Banpo crossing and three adjacent bridge silhouettes. Named residential complexes are detailed below; other architecture remains generalized.

## Editable source

Higgsfield 3D Jutsu project: https://higgsfield.ai/3d-jutsu/0820a164-e029-4d9f-9344-3b4ca696dffd

Input preparation: `scripts/prepare-banpo-geography.py`; initial Blender scene: `scripts/build-banpo-scene.py.template`; shore refinement: `scripts/refine-banpo-shores.py.template`. Blender templates run inside the 3D Jutsu host, which supplies `bpy`, `mathutils`, and `artifacts`. Revision 3 exports, including the editable `.blend`, are preserved in local task evidence.

`scripts/optimize-banpo.mjs` uses glTF Transform 4.5.0 and meshoptimizer 1.0.1. Only tree crowns are simplified (50% target, maximum error 0.0001 of mesh radius); bridge, city and pavilion geometry are preserved. Meshopt compression uses 16-bit positions. Repeating texture coordinates outside 0–1 intentionally remain unquantized.

Water reflections and 56 moving cars remain native Three.js geometry/shading. Day and night use the same mesh. The overview is framed across the bridge. It does not claim a measured view from a particular apartment.

## Adjacent bridges and landscape detail, 2026-09-09

Dongjak, Hannam and Dongho bridge axes were derived from named OpenStreetMap bridge-area ways. [Bridge coordinate and source receipt](./bridges.json) includes the original query, endpoint methods, official Seoul references and ODbL attribution. Google Maps satellite views were inspected during an earlier placement pass. The current close aerial pass used Naver Map satellite mode because Google tiles did not finish loading; Google Earth was not inspected. Current aerial observations are recorded locally in `.omo/evidence/river-bridge-fidelity-2026-09-09/map-observations.md`. No map imagery is shipped.

The adjacent bridge axes, bearings and endpoint methods are geographic data. Their superstructures are reference-based visual approximations rather than measured engineering models. Dongjak uses the short blue tied arches seen in the Seoul Research Data Service photograph, repeated between the 14 existing modeled support stations and placed around the central railway. The resulting 13 modeled arch bays are not claimed as an official count. Dongho uses the central orange peaked truss seen in its Seoul Research Data Service photograph. The partial oblique view does not establish a complete crest or pier count, so eight modeled modules remain an explicit scene approximation; their crests align to alternating modeled support stations. Hannam uses the two parallel deck ribbons visible in the official aerial photograph. Its official 27-pier longitudinal rhythm is represented with paired visual columns under the two decks; this does not claim 54 official piers. Concrete piers and transverse caps use a separate nonemissive material. The 16 m road-rail cap width and 20 m Hannam cap width are visual proportions inferred from side and aerial photographs, not measured dimensions.

Primary silhouette references: [Dongjak close photograph](https://data.si.re.kr/photo/01l01911ba5000), [Dongho close photograph](https://data.si.re.kr/photo/04p01502ba5000), and [Hannam aerial photograph](https://data.si.re.kr/photo/05u03704ba4000). Hannam's official record supplies the 919 m length, 51.2 m width, 12 lanes, 27 piers and three-span continuous steel plate-girder classification: https://futureheritage.seoul.go.kr/futureHeritageMeet/futureHeritage/view.do?htNo=293 . Dongho's official Seoul culture record supplies the 1,220 m length, four road lanes and Taegeuk lighting description: https://culture.seoul.go.kr/night/sub/viewSpot/view.do?listType=list&pageIndex=5&viewId=32 .

The closest riverbank trees use a reduced CC0 Poly Haven Tree Small 02 asset, and ground uses CC0 Leafy Grass maps with mapped OSM road/building coverage. See [vegetation sources](./vegetation/SOURCE.md) and [ground sources](./ground/SOURCE.md). Far buildings and vegetation retain the coarse distant representation.

The 2026-09-10 ground pass uses 1,099 mapped developed, park and woodland features to distinguish neighborhoods from Namsan and riverside parks on the same elevation mesh. See [landcover provenance and downloadable ODbL data](./LANDCOVER.md). Bridge geometry, water, buildings and vegetation are unchanged by this pass; missing building density and distant canopy detail remain future work.

## Named buildings and local streets, 2026-09-12

The [building inventory](./building-identities.json) joins real OSM footprints to 15 Seobinggo Shindonga blocks and the three Raemian Caelitus towers. [Building sources and confidence](./BUILDINGS.md) separate confirmed identities and floor counts from estimated metric heights. The original geographic cutoff had omitted Shindonga block 5 and Caelitus blocks 101 and 102; those mapped footprints are now restored. Existing generic walls, roofs and lift housings for the other 15 selected buildings are removed before their replacements are drawn.

The new facades are original geometry informed by photographs of the completed buildings: Shindonga's thirteen-floor balcony bands and pale numbered gables, and Caelitus's curtain walls and two connections at the skybridge level. Fine facade dimensions, roof equipment and night window occupancy are visual interpretations. Conflicting published and OSM Caelitus heights are recorded in the inventory; none are presented as surveyed elevations.

The [local street network](./STREETS.md) uses mapped road centerlines and a single-channel coverage texture draped onto the same terrain. [Supplemental urban fabric](./URBAN-FABRIC.md) now contains 1,000 real building footprints. Untagged low-rise heights remain estimates. Mountain surface normals interpolate the existing elevation samples to soften lighting without changing the terrain or shoreline. No map or source photograph is used as a scene background.
