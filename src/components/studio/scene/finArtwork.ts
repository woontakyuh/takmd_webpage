import { MeshStandardMaterial } from 'three';
import type { Material } from 'three';

/** The reverse face shows the same ink through translucent fiberglass. */
export function applyFinArtwork(material: Material): void {
  if (!(material instanceof MeshStandardMaterial)) return;
  material.onBeforeCompile = shader => {
    shader.vertexShader = 'varying float vFinSide;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvFinSide = position.x;');
    shader.fragmentShader = 'varying float vFinSide;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
#ifdef USE_MAP
  vec4 printSample = texture2D(map, vMapUv);
  vec2 photo = vMapUv * vec2(1080.0, 1440.0) - vec2(439.0, 1282.0);
  float along = dot(photo, vec2(.8659, -.5003));
  float height = dot(photo, vec2(-.5003, -.8659));
  float region = smoothstep(25.0, 45.0, height) * (1.0 - smoothstep(400.0, 430.0, height))
    * smoothstep(100.0 + .55 * height, 120.0 + .55 * height, along) * (1.0 - smoothstep(570.0, 590.0, along));
  float ink = 1.0 - smoothstep(.12, .3, max(printSample.r, max(printSample.g, printSample.b)));
  vec2 fiberUv = vec2(.69, .30) + fract(vMapUv * vec2(12.0, 16.0)) * vec2(.065, .05);
  vec3 fiber = texture2D(map, fiberUv).rgb;
  vec3 surface = mix(fiber, printSample.rgb, region);
  diffuseColor *= vec4(mix(surface, fiber, step(0.0, vFinSide) * region * ink * .28), 1.0);
#endif
`);
  };
  material.customProgramCacheKey = () => 'bing-planar-ink-v1';
}
