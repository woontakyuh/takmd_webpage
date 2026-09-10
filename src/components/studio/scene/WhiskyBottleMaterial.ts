import { Color } from 'three';
import { createGlassSurfaceMaterial, GLASS_ENVIRONMENT_FRAGMENT, GLASS_REFLECTION_FRAGMENT } from './GlassMaterial';
import type { BottleSpec } from './WhiskyBottleSpecs';

export function createWhiskyBottleMaterial(bottle: BottleSpec) {
  const material = createGlassSurfaceMaterial();
  material.color.set(bottle.darkGlass ? bottle.glass : '#ffffff');
  material.name = 'Reflective bottle glass with analytic whisky depth';
  material.roughness = 0.045;
  material.onBeforeCompile = shader => {
    shader.uniforms.bottleFill = { value: bottle.fillHeight * bottle.height };
    shader.uniforms.whiskyColor = { value: new Color(bottle.liquid) };
    shader.uniforms.glassColor = { value: new Color(bottle.glass) };
    shader.vertexShader = shader.vertexShader.replace('#include <common>', `#include <common>
      varying vec3 vBottlePosition;
      varying vec3 vBottleNormal;
      varying vec3 vBottleView;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vBottlePosition = position;
        vBottleNormal = normal;`)
      .replace('#include <project_vertex>', `#include <project_vertex>
        vBottleView = inverseTransformDirection(-mvPosition.xyz, modelViewMatrix);`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <envmap_physical_pars_fragment>', GLASS_ENVIRONMENT_FRAGMENT)
      .replace('#include <common>', `#include <common>
      varying vec3 vBottlePosition;
      varying vec3 vBottleNormal;
      varying vec3 vBottleView;
      uniform float bottleFill;
      uniform vec3 whiskyColor;
      uniform vec3 glassColor;`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        vec3 insideRay = refract(-normalize(vBottleView), normalize(vBottleNormal), 1.0 / 1.36);
        float chord = clamp(-2.0 * dot(vBottlePosition.xz, insideRay.xz)
          / max(dot(insideRay.xz, insideRay.xz), 0.0001), 0.002, 0.18);
        float liquidPath = vBottlePosition.y < bottleFill ? chord : 0.0;
        if (abs(insideRay.y) > 0.0001) {
          float bottom = (0.012 - vBottlePosition.y) / insideRay.y;
          float surface = (bottleFill - vBottlePosition.y) / insideRay.y;
          float entry = max(0.0, min(bottom, surface));
          float exitPoint = min(chord, max(bottom, surface));
          liquidPath = max(0.0, exitPoint - entry);
        }
        float bottleFacing = abs(dot(normalize(vBottleNormal), normalize(vBottleView)));
        float weightedBase = 1.0 - smoothstep(0.01, 0.016, vBottlePosition.y);
        float glassPath = 0.006 / max(bottleFacing, 0.18) + weightedBase * 0.022;
        vec3 liquidTransmission = pow(max(whiskyColor, vec3(0.008)), vec3(liquidPath / 0.095));
        vec3 glassTransmission = pow(max(glassColor, vec3(0.008)), vec3(glassPath / 0.028));
        vec3 bottleTransmission = liquidTransmission * glassTransmission;
        float absorption = 1.0 - dot(bottleTransmission, vec3(0.2126, 0.7152, 0.0722));
        diffuseColor.rgb *= bottleTransmission / max(max(bottleTransmission.r,
          bottleTransmission.g), max(bottleTransmission.b, 0.02));`)
      .replace('#include <opaque_fragment>', `
        float fresnel = 0.04 + 0.96 * pow(1.0 - bottleFacing, 5.0);
        diffuseColor.a = clamp(0.08 + absorption * 0.84 + fresnel * 0.62 + weightedBase * 0.18, 0.0, 0.96);
        float glassDiffuseWeight = mix(0.025, 0.16, absorption);
        ${GLASS_REFLECTION_FRAGMENT}`);
  };
  material.customProgramCacheKey = () => 'whisky-analytic-alpha-absorption-v8';
  return material;
}
