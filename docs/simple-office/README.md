# Simple office: independent miniature edition

The detailed site remains on **takmd.com**, Cloudflare Pages project `takmdwebpage`. This branch publishes only to **simple.takmd.com**, project `takmd-simple`. Do not run the original `deploy` command from this branch.

## Run and publish

- Local: `PUBLIC_OFFICE_STYLE=simple bun run dev`
- Production build: `BUILD_ID=simple-office-20261003 bun run build:simple`
- Publish after validation: `node scripts/deploy-simple.mjs`
- `bun run deploy:simple` builds and publishes the same independent project. The deployment helper stages its config and Pages function in a temporary directory because Pages does not accept custom configuration filenames. It verifies the simple canonical URL before publishing.

`PUBLIC_OFFICE_STYLE` is a build-time selection. The detailed profile is the default when absent. The existing interaction state, content sources, routes, camera controls, local sunlight, room lamps, blinds, night skyline, TV, readers, music and CD operations are shared, not reimplemented. Neither profile lowers the canvas pixel ratio for the miniature conversion.

## Visual/asset changes

The sofa, lounge chair, ottoman, desk chair, coffee table, plant, guitar and pig use the original geometry, proportions, UVs and transforms. Furniture microtexture maps are replaced by their average surface colors and matte finishes. The guitar, garments and pig keep their color/printed maps as 1024px WebP images; the palm retains its leaf color and alpha map with the other surface maps removed. Shared interior and cabinet leather hooks skip decorative surface maps. Static model pieces sharing a finish are merged for rendering, while their parent groups retain rotation, hover and arrangement controls. Printed photos, books, certificates, screens and album content are retained.

The coat and gi retain their validated phone geometry/UVs because physical hook fitting, sleeve decals and printed marks depend on the original coordinates. Their atlases are prepared at the existing 1024px phone upload size before rendering; every geometry buffer and UV accessor is verified byte-identical. Spine and endoscope retain the earlier topology derivatives. Reproduce these with `node scripts/build-simple-models.mjs /path/to/gltf-transform/node_modules`, furniture/guitar with `node scripts/build-faithful-simple-models.mjs`, foliage with `node scripts/build-simple-foliage.mjs`, and pig with `node scripts/build-simple-garment.mjs public/models/workshop/plush-pig-packed.glb public/models/simple/pig.glb`. Validate all ten restored models with `node scripts/verify-faithful-simple-models.mjs /path/to/gltf-transform/node_modules`.

The simple entry uses a neutral backdrop until its desk is ready, avoiding a detailed-room snapshot that changes abruptly to the miniature background. Camera interruption is ignored while the desk loads and the room reveals; CV reading preserves early scroll input. The generated poster fingerprint still includes the profile. Stage new model/source files before rebuilding so the existing tracked-input fingerprint sees them.

## Deployment isolation

- CNAME `simple` points to `takmd-simple.pages.dev`; apex and www continue using the existing project.
- `wrangler.simple.toml` uses its own D1 visit counter, `takmd-simple-visitors`; migration 0001 is applied. Preview counting is disabled, production counting enabled. No existing visitor records are altered.
- This branch does not modify existing content, Notion sources, music files or the original models. Changes are gated by the build-time profile.

Verification artifacts live under `.omo/evidence/simple-office-20261003/`. Release results and measured limitations are recorded in `verification.md`.
