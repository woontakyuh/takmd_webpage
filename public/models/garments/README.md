# Hanging garments

Created for TakMD on 2026-09-06 with Higgsfield / Tripo H3.1. These are generated 3D interpretations, not photographic scans of the owner's clothing.

- `control-gi.glb`: white Control gi, blue trim, neck-draped blue belt with three white rank stripes, wooden hanger and metal hook. Garment identity follows the owner's supplied BJJ character sheets.
- `physician-coat.glb`: short white physician coat with lapels, buttons, pockets, wooden hanger and metal hook.

Both assets include a dimensional mesh and embedded base-color, normal and metallic-roughness textures. The gi textures were resized to 2048 pixels with glTF Transform 4.4.0. The coat retains its original 4096-pixel textures for fine fabric detail, with a 2.1 normal scale, restrained cloth sheen (`KHR_materials_sheen`, 0.22 color factor / 0.85 roughness), and reduced dielectric reflectance (`KHR_materials_specular`, 0.25 factor). Its source images and mesh topology are unchanged. Source orientation is +Y up, +X forward. Runtime fitting is owned by `src/components/studio/scene/Garment.tsx`.

These assets were generated for this project from authorized references; no third-party catalog model is redistributed here. Generated asset use is subject to the originating services' terms.

On 2026-09-07, the gi's generated `USN` sleeve relief was repaired to read `USA` on the wearer's left sleeve (-Z in source coordinates). A fitted cotton panel replaces 776 malformed local triangles; 373 clipped boundary triangles retain the original cloth UVs, while 891 panel triangles use newly authored lettering and woven normals. A 177-triangle repair on the inside of the belt samples neighboring original blue weave to cover a stray white texture speck. The neck drape, three white rank stripes, hanger, hook, garment bounds, original vertex attributes, and all three original embedded textures are preserved. The corrected GLB adds 195,196 bytes and three mesh primitives.

- Original gi SHA-256: `e66e1fa2fe2bccdc8387748bf05b8c1664c06f22e0c38afef5ae56e88b80bb52`
- Corrected gi SHA-256: `600dd038b56550371178ccca6cfd17a2e996dc54a0fe2d48fe6bb6eb86f10fbd`

The authoring script and before/after browser evidence are retained in the local reference archive at `docs/redesign/gi-detail-repair-2026-09-07/`; they are not production tooling or required to load these self-contained GLBs.
