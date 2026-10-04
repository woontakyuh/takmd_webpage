import { Mesh, MeshPhysicalMaterial, MeshStandardMaterial, ShaderChunk } from 'three';
import { RENDERED_OFFICE } from './OfficeStyle';
import type { Material, Object3D } from 'three';

const marker = 'vec3 normal = geometryNormal;';
// LTC_Evaluate already rejects this light-plane side, but only after its caller samples both lookup textures.
// Rejecting it here also avoids the lookup and clearcoat work. Keep the strict boundary used by Three.
const guard = `if ( all( equal( rectAreaLight.color, vec3( 0.0 ) ) ) ||
    dot( cross( rectAreaLight.halfWidth, rectAreaLight.halfHeight ), geometryPosition - rectAreaLight.position ) > 0.0 ) return;
    ${marker}`;
// Integrate a broad emitter around its nearest point instead of the two LTC texture
// lookups and polygon integrals per light. Preserve the emitter's side, area and color.
const renderedAreaLight = `
  void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
    vec3 w = rectAreaLight.halfWidth;
    vec3 h = rectAreaLight.halfHeight;
    vec3 face = cross(w, h);
    vec3 fromLight = geometryPosition - rectAreaLight.position;
    if (all(equal(rectAreaLight.color, vec3(0.0))) || dot(face, fromLight) > 0.0) return;
    float ww = max(dot(w, w), 0.000001);
    float hh = max(dot(h, h), 0.000001);
    vec3 nearest = rectAreaLight.position
      + w * clamp(dot(fromLight, w) / ww, -1.0, 1.0)
      + h * clamp(dot(fromLight, h) / hh, -1.0, 1.0);
    vec3 delta = nearest - geometryPosition;
    float distanceSquared = max(dot(delta, delta), 0.000001);
    vec3 direction = delta * inversesqrt(distanceSquared);
    float area = 4.0 * sqrt(ww * hh);
    float emission = saturate(dot(normalize(face), direction));
    float coverage = area / (area + 3.14159265 * distanceSquared);
    float diffuse = saturate(dot(geometryNormal, direction));
    vec3 irradiance = rectAreaLight.color * coverage * emission;
    reflectedLight.directDiffuse += irradiance * diffuse * material.diffuseContribution;
    vec3 halfway = normalize(direction + geometryViewDir);
    float highlight = pow(saturate(dot(geometryNormal, halfway)), 12.0);
    reflectedLight.directSpecular += irradiance * diffuse * highlight * material.specularColorBlended * 0.24;
  }
`;
function replaceShaderFunction(chunk: string, name: string, replacement: string): string {
  const start = chunk.indexOf(`void ${name}(`);
  const body = chunk.indexOf('{', start);
  if (start < 0 || body < 0) throw new Error(`Missing Three shader function: ${name}`);
  let depth = 1;
  let end = body + 1;
  for (; end < chunk.length && depth > 0; end++) {
    if (chunk[end] === '{') depth++;
    if (chunk[end] === '}') depth--;
  }
  if (depth !== 0) throw new Error(`Unbalanced Three shader function: ${name}`);
  return chunk.slice(0, start) + replacement + chunk.slice(end);
}

const renderedDirectLight = `
  void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
    float facing = saturate(dot(geometryNormal, directLight.direction));
    float shade = 0.45 * smoothstep(0.0, 0.36, facing) + 0.55 * smoothstep(0.48, 0.9, facing);
    reflectedLight.directDiffuse += directLight.color * shade * material.diffuseContribution;
    float highlight = pow(saturate(dot(geometryNormal, normalize(directLight.direction + geometryViewDir))), 16.0);
    reflectedLight.directSpecular += directLight.color * facing * highlight * material.specularColorBlended * 0.3;
  }
`;
const renderedIndirectLight = `
  void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
    reflectedLight.indirectDiffuse += irradiance * RECIPROCAL_PI * material.diffuseContribution;
    reflectedLight.indirectSpecular += radiance * material.specularColorBlended * 0.28;
  }
`;
const physicalChunk = ShaderChunk.lights_physical_pars_fragment;
const renderedChunk = RENDERED_OFFICE
  ? replaceShaderFunction(replaceShaderFunction(physicalChunk, 'RE_Direct_RectArea_Physical', renderedAreaLight), 'RE_Direct_Physical', renderedDirectLight)
  : physicalChunk;
const optimizedChunk = physicalChunk.replace(marker, guard);
const matteChunk = RENDERED_OFFICE
  ? replaceShaderFunction(renderedChunk, 'RE_IndirectSpecular_Physical', renderedIndirectLight)
  : optimizedChunk;
const prepared = new WeakSet<Material>();
const hooks = new WeakSet<Material['onBeforeCompile']>();

export function prepareAreaLightMaterial(material: Material): void {
  if (!(material instanceof MeshStandardMaterial) || prepared.has(material)) return;
  prepared.add(material);
  const matte = RENDERED_OFFICE && !material.transparent && !material.userData.preserveOpticalFinish
    && !(material instanceof MeshPhysicalMaterial && material.transmission > 0);
  if (matte && !material.userData.renderedFinish) {
    material.userData.renderedFinish = true;
    if (material instanceof MeshPhysicalMaterial) {
      material.clearcoat = 0;
      material.sheen = 0;
      material.anisotropy = 0;
    }
    const metal = material.metalness > 0.2;
    material.metalness = Math.min(material.metalness, 0.3);
    material.normalMap = null;
    // Relief is part of the original artwork; custom award shaders also sample their bump texture.
    if (!material.displacementMap && !material.onBeforeCompile.toString().includes('bumpMap')) material.bumpMap = null;
    material.roughnessMap = null;
    material.metalnessMap = null;
    material.roughness = Math.max(material.roughness, metal ? 0.48 : 0.82);
    material.envMapIntensity = Math.min(material.envMapIntensity, 0.28);
  }
  // Hover accents copy the source hook and cache key, so their clones are already prepared.
  if (hooks.has(material.onBeforeCompile)) return;
  const compile = material.onBeforeCompile;
  const cacheKey = material.customProgramCacheKey;
  material.onBeforeCompile = function (shader, renderer) {
    compile.call(this, shader, renderer);
    shader.fragmentShader = shader.fragmentShader.replace('#include <lights_physical_pars_fragment>', matte ? matteChunk : optimizedChunk);
    if (matte) shader.fragmentShader = '#undef USE_ENVMAP\n' + shader.fragmentShader;
  };
  hooks.add(material.onBeforeCompile);
  material.customProgramCacheKey = () => `${cacheKey.call(material)}|${compile.toString()}|area-light-${RENDERED_OFFICE ? `illustrated-v4-${matte ? 'matte' : 'glass'}` : 'culling-v1'}`;
  material.needsUpdate = true;
}

export function prepareAreaLightMaterials(root: Object3D): void {
  root.traverse(object => {
    if (!(object instanceof Mesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach(prepareAreaLightMaterial);
  });
}
