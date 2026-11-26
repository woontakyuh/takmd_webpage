# Office asset transfer reduction, 10 September 2026

The four initial-load assets below transfer 3,616,443 fewer bytes. These are raw asset byte counts, not a browser timing claim. The full scene and throttled network measurements belong to the integrated performance pass.

| Asset | Before bytes | After bytes | Saved bytes |
| --- | ---: | ---: | ---: |
| Fender Stratocaster GLB | 7,272,452 | 6,576,992 | 695,460 |
| Physician coat GLB | 3,851,720 | 2,870,208 | 981,512 |
| Control gi GLB | 3,448,332 | 2,474,188 | 974,144 |
| Oak diffuse, JPEG to WebP | 2,052,525 | 1,087,198 | 965,327 |
| Total requested assets | 16,625,029 | 13,008,586 | 3,616,443 |

## Geometry and texture safeguards

- Both garments use lossless vertex/triangle reordering followed by Meshopt version 0 encoding. There is no mesh simplification, quantization, welding or remeshing. Every original attribute byte survives its vertex remap; every oriented triangle survives decoding. The gi retains its 89 unused vertices as well.
- Coat: 1 mesh, 1 primitive, 54,570 vertices, 94,752 triangles, 1 material and 3 embedded 4096 × 4096 textures, before and after. All three embedded images remain byte-identical.
- Gi: 1 mesh, 1 primitive, 62,008 vertices, 96,933 triangles, 1 material and 3 embedded 2048 × 2048 textures, before and after. All three embedded images remain byte-identical. This preserves the existing USA lettering geometry and its UVs.
- Guitar: all geometry bytes, nodes, 4 meshes/primitives, 14,345 vertices, 15,469 triangles, 2 materials and 6 embedded 2048 × 2048 textures remain. Its base-color images and normal maps are byte-identical. Only its two packed occlusion/roughness/metalness images use WebP near-lossless encoding; every decoded channel differs by at most 1 of 255 levels. Their RMSE values are 0.3894 and 0.3495. No image has an alpha channel.
- Every model keeps identical accessor bounds, scene transforms, material settings, texture bindings, metadata and extensions. The coat's sheen/specular settings and garment fitting anchors remain unchanged.
- Oak diffuse remains 2048 × 2048 RGB with its metadata retained. WebP quality 98 gives PSNR 45.53 dB, RMSE 1.3497 and maximum channel difference 8/255. A native-scale central 1024-pixel crop was inspected side by side: grain, scale and color remain consistent. Oak normal/roughness maps are unchanged. The existing JPEG is retained as the historical source; the runtime requests `diffuse.webp`.

The installed Drei loader enables the bundled `three-stdlib` Meshopt decoder by default. The assets keep `EXT_meshopt_compression` version 0, with `TRIANGLES` for garment indices and unfiltered `ATTRIBUTES` for vertex streams. Fender already required `EXT_texture_webp`; this change adds no new loader extension. Repacked models were decoded with that exact bundled decoder and compared with the original data before installation.

Ordinary lossy WebP was rejected for non-color material images after a trial produced channel errors up to 182/255. Texture conversions that increased size or gave insignificant savings were also rejected. All garment texture pixels and the guitar's visible finish remain unchanged.

## Reproduction and evidence

Run from the repository with its current Bun lockfile installed. The scripts use Sharp 0.34.5, Meshoptimizer 1.1.1 and the existing Three-stdlib 2.36.1 runtime decoder. Always use separate input and output paths.

```sh
bun scripts/optimize-office-glb.mjs source/physician-coat.glb output/physician-coat.glb garment
bun scripts/optimize-office-glb.mjs source/control-gi.glb output/control-gi.glb garment
bun scripts/optimize-office-glb.mjs source/stratocaster-sunburst.glb output/stratocaster-sunburst.glb guitar
bun scripts/optimize-oak-texture.mjs source/oak-diffuse.jpg output/diffuse.webp
```

Originals, exact SHA-256 values, per-primitive bounds, trial encodings, CLI checks and comparison imagery remain in the gitignored `.omo/evidence/office-performance-river-2026-09-10/assets/` directory. Primary receipts are `coat.json`, `gi.json`, `guitar.json` and `oak.json`. The scripts reject in-place writes, unsupported input layouts and output that violates the recorded fidelity constraints. Both `--help` paths and invalid-input paths were exercised; both scripts pass JavaScript syntax checks.

No build, commit or deployment was performed by the asset optimization worker. The coordinating performance task performs the integrated browser checks and release work.
