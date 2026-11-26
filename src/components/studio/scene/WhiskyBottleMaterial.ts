import { Color, FrontSide, MeshPhysicalMaterial } from 'three';
import { createGlassSurfaceMaterial, GLASS_ENVIRONMENT_FRAGMENT, GLASS_REFLECTION_FRAGMENT } from './GlassMaterial';
import type { BottleSpec } from './WhiskyBottleSpecs';

export function createWhiskyBottleMaterial(bottle: BottleSpec) {
  const material = createGlassSurfaceMaterial();
  material.name = 'Bottle glass wall and weighted base';
  material.roughness = 0.045;
  material.onBeforeCompile = shader => {
    shader.uniforms.glassColor = { value: new Color(bottle.glass) };
    shader.vertexShader = shader.vertexShader.replace('#include <common>', `#include <common>
      varying float vBottleHeight;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vBottleHeight = position.y;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <envmap_physical_pars_fragment>', GLASS_ENVIRONMENT_FRAGMENT)
      .replace('#include <common>', `#include <common>
      varying float vBottleHeight;
      uniform vec3 glassColor;`)
      .replace('#include <opaque_fragment>', `
        float bottleFacing = abs(dot(normalize(normal), normalize(vViewPosition)));
        float weightedBase = 1.0 - smoothstep(0.008, 0.015, vBottleHeight);
        float glassPath = 0.004 / max(bottleFacing, 0.18) + weightedBase * 0.014;
        vec3 glassTransmission = pow(max(glassColor, vec3(0.008)), vec3(glassPath / 0.028));
        float absorption = 1.0 - dot(glassTransmission, vec3(0.2126, 0.7152, 0.0722));
        totalDiffuse *= glassTransmission;
        float fresnel = 0.04 + 0.96 * pow(1.0 - bottleFacing, 5.0);
        diffuseColor.a = clamp(0.025 + absorption * 0.76 + fresnel * 0.62 + weightedBase * 0.24, 0.0, 0.92);
        float glassDiffuseWeight = 0.025;
        ${GLASS_REFLECTION_FRAGMENT}`);
  };
  material.customProgramCacheKey = () => 'whisky-glass-wall-v9';
  return material;
}

export function createWhiskyLiquidMaterial(bottle: BottleSpec) {
  const material = new MeshPhysicalMaterial({
    name: 'Closed whisky volume with environment refraction and Beer absorption',
    color: '#ffffff', roughness: 0.055, metalness: 0,
    transmission: 0, opacity: 1, transparent: false, depthWrite: true,
    side: FrontSide, ior: 1.36,
  });
  // The existing room probe approximates transmitted light without replaying the opaque scene.
  material.onBeforeCompile = shader => {
    shader.uniforms.liquidBottom = { value: 0.012 };
    shader.uniforms.liquidTop = { value: bottle.fillHeight * bottle.height };
    shader.uniforms.liquidRadius = { value: bottle.radius - 0.002 };
    shader.uniforms.whiskyAttenuation = { value: new Color(bottle.liquid) };
    shader.uniforms.bottleTint = { value: new Color(bottle.glass) };
    shader.vertexShader = shader.vertexShader.replace('#include <common>', `#include <common>
      varying vec3 vLiquidPosition;
      varying vec3 vLiquidNormal;
      varying vec3 vLiquidView;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vLiquidPosition = position;
        vLiquidNormal = normal;`)
      .replace('#include <project_vertex>', `#include <project_vertex>
        vLiquidView = inverseTransformDirection(-mvPosition.xyz, modelViewMatrix);`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
      varying vec3 vLiquidPosition;
      varying vec3 vLiquidNormal;
      varying vec3 vLiquidView;
      uniform float liquidBottom;
      uniform float liquidTop;
      uniform float liquidRadius;
      uniform vec3 whiskyAttenuation;
      uniform vec3 bottleTint;
      uniform mat4 modelMatrix;`)
      .replace('#include <transmission_fragment>', `
        vec3 liquidRay = refract(-normalize(vLiquidView), normalize(vLiquidNormal), 1.0 / ior);
        float radius = mix(length(vLiquidPosition.xz), liquidRadius,
          smoothstep(0.65, 0.95, abs(normalize(vLiquidNormal).y)));
        float a = max(dot(liquidRay.xz, liquidRay.xz), 0.00001);
        float b = dot(vLiquidPosition.xz, liquidRay.xz);
        float c = dot(vLiquidPosition.xz, vLiquidPosition.xz) - radius * radius;
        float rayLength = max(0.0001, (-b + sqrt(max(0.0, b * b - a * c))) / a);
        if (liquidRay.y < -0.0001) rayLength = min(rayLength, (liquidBottom - vLiquidPosition.y) / liquidRay.y);
        if (liquidRay.y > 0.0001) rayLength = min(rayLength, (liquidTop - vLiquidPosition.y) / liquidRay.y);
        float liquidDistance = clamp(rayLength, 0.0001, 0.5);
        vec3 exitPosition = vLiquidPosition + liquidRay * liquidDistance;
        vec3 exitNormal = normalize(vec3(exitPosition.x, 0.0, exitPosition.z));
        if (exitPosition.y <= liquidBottom + 0.0002) exitNormal = vec3(0.0, -1.0, 0.0);
        if (exitPosition.y >= liquidTop - 0.0002) exitNormal = vec3(0.0, 1.0, 0.0);
        vec3 exitRay = refract(liquidRay, -exitNormal, ior);
        float internalReflection = step(dot(exitRay, exitRay), 0.001);
        if (internalReflection > 0.5) exitRay = reflect(liquidRay, -exitNormal);
        vec3 throughLight = totalDiffuse;
        #ifdef ENVMAP_TYPE_CUBE_UV
          vec3 worldExitRay = normalize(mat3(modelMatrix) * exitRay);
          vec3 probeLight = textureCubeUV(envMap, envMapRotation * worldExitRay, material.roughness).rgb;
          float probeLuminance = max(dot(probeLight, vec3(0.2126, 0.7152, 0.0722)), 0.001);
          float cabinetRadiance = probeLuminance * 0.32 + max(probeLuminance - 0.62, 0.0) * 2.0;
          throughLight = probeLight * (cabinetRadiance / probeLuminance) * envMapIntensity;
        #endif
        vec3 beerTransmission = pow(max(whiskyAttenuation, vec3(0.001)), vec3(liquidDistance / 0.085));
        float wallPath = 0.004 / max(abs(dot(normalize(vLiquidNormal), normalize(vLiquidView))), 0.18);
        beerTransmission *= pow(max(bottleTint, vec3(0.001)), vec3(wallPath / 0.028));
        vec3 liquidFresnel = EnvironmentBRDF(normal, normalize(vViewPosition),
          material.specularColorBlended, material.specularF90, material.roughness);
        totalDiffuse = throughLight * beerTransmission * (1.0 - liquidFresnel) * mix(1.0, 0.2, internalReflection);
      `);
  };
  material.customProgramCacheKey = () => 'whisky-closed-probe-refraction-v2';
  return material;
}
