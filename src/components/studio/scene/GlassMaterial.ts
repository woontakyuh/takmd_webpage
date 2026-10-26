import { FrontSide, MeshPhysicalMaterial, ShaderChunk } from 'three';

// Cabinet walls occlude the broad plaster fill, while window reflections stay directional.
export const GLASS_ENVIRONMENT_FRAGMENT = ShaderChunk.envmap_physical_pars_fragment.replace(
  'return envMapColor.rgb * envMapIntensity;',
  `float reflectionLuminance = max(dot(envMapColor.rgb, vec3(0.2126, 0.7152, 0.0722)), 0.001);
  float cabinetLuminance = reflectionLuminance * 0.16
    + max(reflectionLuminance - 0.62, 0.0) * 4.0;
  return envMapColor.rgb * (cabinetLuminance / reflectionLuminance) * envMapIntensity;`,
);

// Small empty glasses need the window highlights retained at the full-cabinet view.
const BARWARE_ENVIRONMENT_FRAGMENT = ShaderChunk.envmap_physical_pars_fragment.replace(
  'return envMapColor.rgb * envMapIntensity;',
  `float reflectionLuminance = max(dot(envMapColor.rgb, vec3(0.2126, 0.7152, 0.0722)), 0.001);
  float cabinetLuminance = reflectionLuminance * 0.20
    + max(reflectionLuminance - 0.62, 0.0) * 40.0;
  return envMapColor.rgb * (cabinetLuminance / reflectionLuminance) * envMapIntensity;`,
);

export const GLASS_REFLECTION_FRAGMENT = `
  outgoingLight = totalDiffuse * glassDiffuseWeight
    + totalSpecular / max(diffuseColor.a, 0.08);
  #include <opaque_fragment>
`;

export function createGlassSurfaceMaterial() {
  return new MeshPhysicalMaterial({
    color: '#ffffff',
    transmission: 0,
    transparent: true,
    opacity: 0.2,
    ior: 1.52,
    depthWrite: false,
    side: FrontSide,
    roughness: 0.035,
    metalness: 0,
  });
}

type GlassProfile = {
  readonly height: number;
  readonly solidHeight: number;
  readonly faceted?: boolean;
  readonly barware?: boolean;
};

export function createHollowGlassMaterial(profile: GlassProfile) {
  const material = createGlassSurfaceMaterial();
  material.roughness = profile.faceted ? 0.075 : 0.035;
  material.flatShading = profile.faceted ?? false;
  // The existing hollow profile supplies both surfaces; no transmission framebuffer is sampled.
  material.onBeforeCompile = shader => {
    shader.uniforms.glassHeight = { value: profile.height };
    shader.uniforms.glassSolidHeight = { value: profile.solidHeight };
    shader.vertexShader = shader.vertexShader.replace('#include <common>',
      '#include <common>\nvarying float vGlassHeight;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGlassHeight = position.y;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <envmap_physical_pars_fragment>',
        profile.barware ? BARWARE_ENVIRONMENT_FRAGMENT : GLASS_ENVIRONMENT_FRAGMENT)
      .replace('#include <common>', `#include <common>
      varying float vGlassHeight;
      uniform float glassHeight;
      uniform float glassSolidHeight;`)
      .replace('#include <opaque_fragment>', `
        float facing = abs(dot(normalize(normal), normalize(vViewPosition)));
        float fresnel = 0.04 + 0.96 * pow(1.0 - facing, ${profile.barware ? '3.0' : '5.0'});
        float solidGlass = 1.0 - smoothstep(glassSolidHeight - 0.0015,
          glassSolidHeight + 0.0025, vGlassHeight);
        float lip = smoothstep(glassHeight - 0.002, glassHeight - 0.0005, vGlassHeight);
        diffuseColor.a = clamp(${profile.barware ? '0.16 + fresnel * 0.72' : '0.085 + fresnel * 0.8'}
          + solidGlass * 0.44 + lip * 0.28, 0.0, 0.9);
        float glassDiffuseWeight = mix(0.025, 0.065, solidGlass);
        ${profile.barware ? `
          outgoingLight = totalDiffuse * glassDiffuseWeight
            + totalSpecular * mix(0.16, 1.0, max(fresnel, solidGlass)) / max(diffuseColor.a, 0.08);
          #include <opaque_fragment>
        ` : GLASS_REFLECTION_FRAGMENT}`);
  };
  material.customProgramCacheKey = () => profile.barware
    ? 'isidoro-barware-reflections-v8'
    : 'isidoro-weighted-reflective-glass-v6';
  return material;
}
