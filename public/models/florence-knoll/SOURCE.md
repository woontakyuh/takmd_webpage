# Florence Knoll Relaxed two-seater, ivory

`relaxed-two-seater-ivory.glb` is an independently authored reference model made for TakMD on 2026-09-07. It is not an official Knoll asset or an extracted/remeshed manufacturer CAD file.

## References and source decision

- [Knoll retail two-seater specification](https://www.knoll.com/shop/en_us/living-sofas-sectionals/florence-knoll-relaxed-sofa-two-seater/100763052.html): 63 × 35 × 31.25 inches; seat 17.5 inches; arm 23.5 inches.
- [Knoll Relaxed Sofa and Settee](https://www.knoll.com/product/florence-knoll--relaxed-sofa-and-settee): 1206S2 is the two-seat relaxed settee, with deeper proportions, four legs, tufted cushions, polished chrome and no cushion welting. Leather versions have matching buttons; fabric versions do not.
- Four user-supplied product photos are stored privately under `docs/reference-assets/florence-knoll/`, outside the published assets. The ivory buttoned appearance follows the second reference; the back/arm construction follows the first and fourth references.
- An official [1206S2 SketchUp planning symbol](https://cadpack-aws.hermanmiller.com/CAD%20Pack%20Web%20App/KNOLL/US/S/T1206S2.skp) was inspected privately for proportions. [MillerKnoll's planning resources](https://www.millerknoll.com/resources/symbol-libraries) describe space-planning use; no explicit public raw-GLB redistribution permission was established. It is not included in this public model.

## Authorship and rights

The public mesh, geometric quilting, seam paths, material definitions and analytic vertex cavity shading were created independently for this project. It contains no downloaded third-party geometry, photographs or textures. No third-party mesh or texture license is claimed. Rights in the product design, Florence Knoll name and Knoll marks remain with their respective owners; this visual reference does not imply affiliation, endorsement or an official product model.

## Geometry and materials

- Exported envelope: width 1.600200 m × depth .889000 m × height .793750 m.
- Front local +Z; +Y up; floor at Y=0. App placement is on the rug at [2, .035, 1.14], yaw −π/2.
- Two seat cushions, two reclined back cushions, three columns × two rows of covered tuft buttons on each cushion, shaped quilt panels, narrow flat boxing seams, upholstered arms and full rear back.
- Slim square polished-chrome perimeter, four square chrome legs, dark flush protective glides.
- Ivory matte upholstery; all materials are procedural solid PBR definitions. Analytic low-contrast vertex cavity shading supports the tuft depressions. No image textures or external fetches.
- 28,464 triangles; 17,960 vertices; four material draws; 885,896 bytes.
- SHA-256: `74988d60178b44add0529cdafd849705e8b62c6001f85236dd3390e137255176`.

## Verification

The exported file was reloaded by Three.js GLTFLoader in Chromium and checked at front, three-quarter, rear and close-up views. Dimensions and triangle counts were measured on the loaded GLB, not inferred from the authoring script. Browser error list was empty. Evidence and reproducible generation scripts live under `.omo/evidence/florence-knoll-2026-09-07/`.
