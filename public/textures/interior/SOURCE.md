# Interior material provenance

The locally served maps in this directory are authored PBR texture maps, not image planes. Each set is used with `meshStandardMaterial` through `useInteriorMaterial`.

| Local set | Source asset | Original URL | License | Local delivery |
| --- | --- | --- | --- | --- |
| `oak/` | Poly Haven, Oak Veneer 04 by Jenelle van Heerden | https://polyhaven.com/a/oak_veneer_04 | CC0 1.0 Universal | 2048 px diffuse; 1024 px normal and roughness |
| `linen/` | Poly Haven, Rough Linen by Rico Cilliers / colormass | https://polyhaven.com/a/rough_linen | CC0 1.0 Universal | 1024 px diffuse, normal, and roughness |
| `stone/` | ambientCG, Travertine 009 | https://ambientcg.com/a/Travertine009 | CC0 1.0 Universal | 2048 px diffuse; 1024 px normal and roughness |
| `forest-slope-1k.hdr` | Poly Haven, Forest Slope HDRI by Andreas Mischok | https://polyhaven.com/a/forest_slope | CC0 1.0 Universal | 1024 px HDR, 1.8 MB |

## Map origins

- Oak: [diffuse](https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/oak_veneer_04/oak_veneer_04_diff_2k.jpg), [normal GL](https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/oak_veneer_04/oak_veneer_04_nor_gl_2k.jpg), [roughness](https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/oak_veneer_04/oak_veneer_04_rough_2k.jpg).
- Linen: [diffuse](https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/rough_linen/rough_linen_diff_2k.jpg), [normal GL](https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/rough_linen/rough_linen_nor_gl_2k.jpg), [roughness](https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/rough_linen/rough_linen_rough_2k.jpg). The locally delivered diffuse map is a resized, low-saturation cream color grade of that CC0 source; its weave, normal, and roughness remain sourced from the same set.
- Stone: [2K JPG archive](https://ambientcg.com/get?file=Travertine009_2K-JPG.zip), containing the local `Color`, `NormalGL`, and `Roughness` maps.
- Forest atmosphere: [1K HDR](https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/forest_slope_1k.hdr).

The Poly Haven source pages identify their assets as CC0. ambientCG's Travertine 009 page states that its assets are released under the Creative Commons CC0 license. The stone is a pale, fine-grained travertine selected to read as honed limestone in the reference office; it has no grout pattern, dark dots, or high-contrast grunge.
