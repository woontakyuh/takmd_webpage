# Hanging garments

Created for TakMD on 2026-09-06 with Higgsfield / Tripo H3.1. These are generated 3D interpretations, not photographic scans of the owner's clothing.

- `control-gi.glb`: white Control gi, blue trim, neck-draped blue belt with three white rank stripes, wooden hanger and metal hook. Garment identity follows the owner's supplied BJJ character sheets.
- `physician-coat.glb`: short white physician coat with lapels, buttons, pockets, wooden hanger and metal hook.

Both assets include a dimensional mesh and embedded base-color, normal and metallic-roughness textures. The gi textures were resized to 2048 pixels with glTF Transform 4.4.0. The coat retains its original 4096-pixel textures for fine fabric detail, with a 2.1 normal scale, restrained cloth sheen (`KHR_materials_sheen`, 0.22 color factor / 0.85 roughness), and reduced dielectric reflectance (`KHR_materials_specular`, 0.25 factor). Its source images and mesh topology are unchanged. Source orientation is +Y up, +X forward. Runtime fitting is owned by `src/components/studio/scene/Garment.tsx`.

These assets were generated for this project from authorized references; no third-party catalog model is redistributed here. Generated asset use is subject to the originating services' terms.

On 2026-09-07, the final `N` in the generated sleeve lettering was corrected directly to `A`. The small source relief region was remeshed and its UVs reassigned to the original navy embroidery and clean cloth texels. The model retains one mesh, one primitive and one material, with no added panel, decal or belt correction. The original embedded textures are byte-for-byte unchanged. Original triangles outside the local lettering repair region, including U/S, the belt, hanger and hook, retain their source attributes.

- Original gi SHA-256: `e66e1fa2fe2bccdc8387748bf05b8c1664c06f22e0c38afef5ae56e88b80bb52`
- Direct USA correction SHA-256: `44fd3c168b6233e1bfe04ef6d4011343447923fad95b5fdcda5252511e98b3a5`

The one-off authoring script and same-light before/after evidence are retained in the local reference archive at `docs/redesign/gi-lettering-direct-2026-09-07/`. The exported GLB is self-contained and adds 281,652 bytes to the source asset.
