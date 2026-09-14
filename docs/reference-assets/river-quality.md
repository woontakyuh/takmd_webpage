# Han River exterior material pass — 2026-09-08

This is a rendering-quality improvement to the existing editable Han River approximation. River extent, both bridge spans, building positions, hills and tower placement are preserved. It is not a downloaded Seoul/Han River model, surveyed reconstruction, or a photographic backdrop.

## Used sources

| Source | Use | License |
| --- | --- | --- |
| [Three Sky, r185](https://github.com/mrdoob/three.js/blob/2431a09f46f34c560bc8e44b33be0e567723d5b9/examples/jsm/objects/Sky.js) | Installed Sky implementation: atmospheric scattering and restrained clouds, with the existing day/night control mapped to a night tint | MIT |
| [Three Water, r185](https://github.com/mrdoob/three.js/blob/2431a09f46f34c560bc8e44b33be0e567723d5b9/examples/jsm/objects/Water.js) | Adapted four-scale normal sampling and Fresnel reflection equations. Existing Reflector is retained for its explicit render-target disposal | MIT |
| [Three waternormals.jpg, r185](https://github.com/mrdoob/three.js/blob/2431a09f46f34c560bc8e44b33be0e567723d5b9/examples/textures/waternormals.jpg) | Locally vendored, unmodified `/textures/river-water-normals.jpg` | Three repository MIT license |
| [Grass Path 2](https://polyhaven.com/a/grass_path_2), Rob Tuytel / Poly Haven | Locally vendored 1K diffuse map, `/textures/river-bank-diffuse.jpg`, applied as a repeating surface material to the narrow riverside green strip | [CC0](https://polyhaven.com/license) |

The water normal image is 248,813 bytes; the ground diffuse map is 716,010 bytes. Both are served locally; there are no runtime third-party texture requests. The diffuse image is a material tile, not an exterior photograph. Mipmaps and 4× anisotropic filtering reduce texture shimmer. Water keeps the existing 1024² reflection target, no MSAA and one reflection pass. Time is supplied by the existing reduced-motion-aware caller. Both textures and the reflection target are disposed on teardown.

SHA-256:

```text
add9912b158a4fe9c12421745babe68c44c8af75631ac4837236cb2a03bc373f  river-water-normals.jpg
7f30b163739435c11f500f3818c7bb4922bab5f2734cc9ba6dd36817f0c9a8ab  river-bank-diffuse.jpg
```

Source download for the ground map: [Poly Haven 1K diffuse JPG](https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/grass_path_2/grass_path_2_diff_1k.jpg). The Three tag r185 resolves to commit `2431a09f46f34c560bc8e44b33be0e567723d5b9`.

## Remaining approximation

The bank, roadway, piers, buildings and distant landforms remain locally generated geometry. The shore now has a sloping embankment and path; bridge decks have separate asphalt, antialiased lane markings and tapered elliptical piers. These are generic construction details rather than claims about a particular named bridge. The bank texture supplies surface variation, not site-specific landscaping. The water is flat reflective water with animated normals, not fluid simulation. Sky appearance is an artistic day/night transition, not current Seoul weather or exact astronomical positioning.

The whole-scene candidate [“river han” by DonikXD](https://sketchfab.com/3d-models/river-han-8e454ca416af4b5cbbe5c774dfc49ddd) was found during research, but its downloadable package/access was not verified. None of its model, textures or protected viewer content is included.

## Three.js license

The same notice is shipped at `/textures/river-LICENSE.txt` so redistribution of the material assets and adapted shader retains the license.

The MIT License

Copyright © 2010-2026 three.js authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

Final close-view correction: restrict textured grass to a 100 m riverside strip instead of the whole landmass; use 2–4.8 km atmospheric depth to avoid a visibly tiled distant plain. Final root build and Astro check passed, 0 errors and 0 warnings.
