# Office model compression — 2026-09-09

Six GLBs requested during the measured office entry were compressed in place. The source models remain available from their prior Git versions; the working originals were also retained in a private temporary backup during this pass.

| Model | Original bytes | Compressed bytes | Saved bytes |
| --- | ---: | ---: | ---: |
| Fender Stratocaster | 10,783,264 | 7,272,452 | 3,510,812 |
| Beosound Theatre | 5,003,812 | 2,605,024 | 2,398,788 |
| Physician coat | 4,362,856 | 3,851,720 | 511,136 |
| Control gi | 4,056,288 | 3,448,332 | 607,956 |
| Eames lounge | 1,825,288 | 1,344,800 | 480,488 |
| Eames ottoman | 897,400 | 705,204 | 192,196 |
| **Total** | **26,928,908** | **19,227,532** | **7,701,376** |

## Preservation checks

- No geometry simplification, quantization, vertex reordering, index rotation, material edits, image resizing or lossy texture conversion.
- Every geometry buffer view was decoded with the app's installed `three-stdlib` Meshopt decoder and compared byte for byte with its original. Accessor metadata and scene/material JSON are identical, apart from the required storage/encoding declarations.
- The actual `GLTFLoader` parsed all six geometry candidates and produced the same 110 accessor arrays and scene trees. Texture I/O was stubbed for this Node-only check; Beosound contains no textures and parsed without texture I/O. Final browser rendering is verified separately in the office-entry QA.
- Four Fender PNG textures became lossless WebP at the same 2048 × 2048 dimensions. Decoded RGB bytes and channel counts match exactly; these four source textures have no alpha channel. Other embedded images retain their original encoded bytes. The gi lettering/emblem and coat textures retain their original bytes.

## Loader compatibility

The installed Drei `useGLTF` and `useGLTF.preload` enable Meshopt by default and call `setMeshoptDecoder`. All six scene components use this route, including `BeosoundTheatre`. The encoder writes Meshopt byte stream version 0 with `filter: NONE`; index streams use `INDICES` to preserve their exact ordering. `EXT_meshopt_compression` is required and its omitted fallback buffer is explicitly marked.

The guitar additionally requires `EXT_texture_webp`, which is implemented by the installed `three-stdlib` GLTFLoader. This uses the browser's native WebP decoder. No application dependency or model URL changed.

## Reproducing

Use an uncompressed source and a separate destination. The third argument is the absolute path to `meshopt_encoder.js` from `meshoptimizer@1.2.0`, installed outside the application dependency tree.

```sh
node scripts/compress-glb-lossless.mjs INPUT.glb OUTPUT.glb /absolute/path/to/meshopt_encoder.js
node scripts/compress-glb-lossless.mjs GUITAR_INPUT.glb GUITAR_OUTPUT.glb /absolute/path/to/meshopt_encoder.js --lossless-webp
```

The script refuses precompressed input, verifies the semantic data and runtime-decoded bytes before writing, and prints a JSON report. The adjacent JSON records source/output SHA-256 values, pixel hashes and per-model savings. Original model byte totals exclude HTTP response headers.
