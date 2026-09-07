# Office refinement checkpoint — 2026-09-07

The office keeps its full geometry and materials while reducing repeated draw submissions and static shadow rendering. It also uses the owner's newly supplied garment-rack, plush-pig, rigid-endoscope and KOSESS award references.

## Rendering and controls

The desk mat's 268 stitch meshes now share one merged mesh. The keyboard's 166 keycap meshes now share four material groups. Geometry, rounded edges, placement, colors and key legends are preserved. Static shadow maps are reused while only the camera moves; moving/appearing/disappearing casters and lighting changes invalidate the cache after object animations.

Resolution starts at the existing DPR cap (1.75 desktop, 1.35 compact), decreases in 0.25 steps after sustained slow frames, and recovers more slowly. A controlled runtime load test observed 1.75 → 0.75 → 1.25 after removing the load. Warmup and hidden-tab pauses are excluded from the slow-frame decision.

Free orbit reaches 0.35 m and selected-object orbit 0.25 m from its target. Free-view wheel zoom follows the pointer; right-drag or two-finger drag pans. Selected-object orbit stays centered, and closing restores the exact saved free pose.

## Reference objects and destinations

- The white rack follows the supplied 99 × 152 × 46 cm dimensions, curved corners, U-shaped feet and lower brace. Original coat and gi meshes are preserved. Their hooks contact the rail, the clothes hang perpendicular to it, and hovering cannot lift them off the rail.
- The pale-pink pig is a textured 3D reconstruction from the supplied photograph, generated through Higgsfield/Meshy and finished as matte velour. One photograph cannot establish the unseen rear/underside; these are inferred. It is not a scan. Final asset: 1,432,972 bytes, 18,581 triangles, one material draw; 36 cm horizontal size. It opens `/workshops/animal-pig`.
- The scope and working sheath use real geometry for the thin shaft, black eyepiece, faceted coupling, illumination connector, paired stopcocks and knurled collar. Final asset: 412,072 bytes, 14,064 triangles, five material draws. It opens `/workshops/cadaver`.
- The KOSESS Best Shorts Award uses the owner's actual photographed lettering, date, signature and triangular emblem, on a modeled satin-gold body, polished inset and silver support. Dimensions are estimated from photos. Public textures total 429,380 bytes. Clicking opens `https://www.youtube.com/@tak_md`, verified as 운탁TV; dragging does not open a tab.
- The surfboard and its collection shortcut open `https://www.instagram.com/tak_md/`.

Raw reference images and their SHA-256 manifest are retained locally in `docs/reference-assets/2026-09-07/`. Raw award photos retain the office background and are intentionally excluded from the public build and this checkpoint commit. The pig's original generated GLB remains in the local reference work folder. Preparation scripts document the derived assets; regeneration requires those local source files. Public models contain no embedded source photographs of the room.

## Verification and limitations

Controlled profiling used macOS Chrome with Metal, 1440 × 900, device scale 2. Baseline orbit/zoom frame medians under 4× CPU throttling were 60 and 53 ms; final integrated measurements were 30 and 28 ms. Unthrottled final runs were 16 ms at DPR1.75. Final scene has 521 meshes and a median 519 draw calls during those runs. These are controlled Mac measurements, not direct Windows hardware measurements. The attempted baseline DPR1 diagnostic was overwritten by the Canvas prop and is excluded from conclusions.

Astro check: 137 files, zero errors, zero warnings (19 existing hints). Production build: 20 pages; public-boundary scan: 164 assets passed. Related paper-turn/time tests and collection/public-boundary checks passed. React Doctor found no issues in the final award component; its maintainability runner remains incomplete, and the broad repository scan reports pre-existing legacy/viewer errors. LSP refreshes timed out; Astro/TypeScript diagnostics are the compiler evidence.

Runtime evidence is retained under `.omo/evidence/office-performance-2026-09-07/`: baseline/final profiling, adaptive recovery, camera return and maximum zoom, actual object click destinations and drag guards, day/evening and date rollover, plus final viewport screenshots. All temporary production probes were removed before the final build.

The replacement dummy awaits the owner's reference. `workshop.takmd.com` remains a proposed separate project; the existing working dummy route is preserved. Logo redesign remains deferred.
