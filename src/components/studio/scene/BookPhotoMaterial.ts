import type { MeshStandardMaterial } from 'three';
import type { BookSurface } from '../personalBookSurfaces';

type Compile = MeshStandardMaterial['onBeforeCompile'];

/** Correct only photographic illumination and blank-margin occlusion, never printed content. */
export function bookPhotoMaterial(surface: BookSurface): Compile {
  return shader => {
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nattribute vec2 pageUv;\nvarying vec2 vBookPageUv;')
      .replace('#include <uv_vertex>', '#include <uv_vertex>\nvBookPageUv = pageUv;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vBookPageUv;');
    const photo = surface.photo;
    if (!photo) return;
    const [top, bottom] = photo.paper;
    shader.uniforms.bookPaperTop = { value: top };
    shader.uniforms.bookPaperBottom = { value: bottom };
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nuniform float bookPaperTop;\nuniform float bookPaperBottom;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += diffuseColor.rgb * .24;');
    const clear = photo.clearMargin;
    const margin = clear ? `
      float blank = (1.0 - smoothstep(${clear[0] - .002}, ${clear[0]}, vBookPageUv.x))
        * smoothstep(${clear[1] - .002}, ${clear[1]}, 1.0-vBookPageUv.y)
        * (1.0-smoothstep(${clear[2]}, ${clear[2] + .002}, 1.0-vBookPageUv.y));
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.94, .925, .895), blank);
    ` : '';
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
      float illumination = mix(bookPaperBottom, bookPaperTop, vBookPageUv.y);
      diffuseColor.rgb = min(diffuseColor.rgb / illumination * .92, vec3(1.0));
      ${margin}`);
  };
}
