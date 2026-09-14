import * as THREE from 'three';
import { BANPO_APPEARANCE, banpoGlslColor } from './BanpoAppearance';

const FACADE_SHADER = `
  vec2 facadeGrid = vFacadeUv * 4.0;
  vec2 facadeCell = floor(facadeGrid);
  vec2 facadeLocal = fract(facadeGrid);
  vec2 facadeBlock = floor(vFacadeWorld.xz / 70.0);
  float facadeSeed = facadeHash(vec3(facadeBlock, 19.0));
  float facadeRoom = facadeHash(vec3(facadeCell, facadeSeed * 831.0));
  float facadeFloor = facadeHash(vec3(facadeCell.y, facadeSeed * 277.0, 53.0));
  vec2 facadeAa = max(fwidth(facadeGrid), vec2(0.006));
  vec2 facadeWindow = smoothstep(vec2(0.18, 0.22) - facadeAa, vec2(0.18, 0.22) + facadeAa, facadeLocal)
    * (1.0 - smoothstep(vec2(0.79, 0.81) - facadeAa, vec2(0.79, 0.81) + facadeAa, facadeLocal));
  float facadeMask = facadeWindow.x * facadeWindow.y;
  vec3 facadeMasonry = mix(${banpoGlslColor(BANPO_APPEARANCE.genericFacade.linear.masonryDark)}, ${banpoGlslColor(BANPO_APPEARANCE.genericFacade.linear.masonryLight)}, facadeSeed);
  vec3 facadeGlass = mix(${banpoGlslColor(BANPO_APPEARANCE.genericFacade.linear.glassDark)}, ${banpoGlslColor(BANPO_APPEARANCE.genericFacade.linear.glassLight)}, facadeSeed);
  diffuseColor.rgb = mix(facadeMasonry, facadeGlass, facadeMask);
  diffuseColor.rgb *= 0.96 + 0.04 * smoothstep(0.04, 0.1, facadeLocal.y);
  float facadeOccupied = step(facadeRoom, 0.17 + facadeSeed * 0.27) * step(0.18, facadeFloor);
  vec3 facadeLamp = mix(${banpoGlslColor(BANPO_APPEARANCE.genericFacade.linear.lampWarm)}, ${banpoGlslColor(BANPO_APPEARANCE.genericFacade.linear.lampCool)}, step(0.78, facadeRoom * 2.9));
  totalEmissiveRadiance = facadeLamp * facadeMask * facadeOccupied * (0.23 + facadeRoom * 0.55) * uFacadeNight;
`;

export function applyBanpoFacadeMaterial(material: THREE.MeshStandardMaterial) {
  const night = { value: 0 };
  material.roughness = BANPO_APPEARANCE.genericFacade.roughness;
  material.metalness = BANPO_APPEARANCE.genericFacade.metalness;
  material.onBeforeCompile = shader => {
    shader.uniforms.uFacadeNight = night;
    shader.vertexShader = shader.vertexShader.replace('#include <common>',
      '#include <common>\nvarying vec2 vFacadeUv;varying vec3 vFacadeWorld;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFacadeUv=uv;vFacadeWorld=(modelMatrix*vec4(transformed,1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>
      uniform float uFacadeNight;varying vec2 vFacadeUv;varying vec3 vFacadeWorld;
      float facadeHash(vec3 p) { return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453); }`)
      .replace('#include <map_fragment>', FACADE_SHADER)
      .replace('#include <emissivemap_fragment>', '');
  };
  material.customProgramCacheKey = () => 'banpo-stable-occupied-facades-v1';
  material.needsUpdate = true;
  return { setNightMix: (value: number): void => { night.value = THREE.MathUtils.clamp(value, 0, 1); } };
}
