import { Mesh, MeshStandardMaterial, ShaderChunk } from 'three';
import type { Material, Object3D } from 'three';

const marker = 'vec3 normal = geometryNormal;';
// LTC_Evaluate already rejects this light-plane side, but only after its caller samples both lookup textures.
// Rejecting it here also avoids the lookup and clearcoat work. Keep the strict boundary used by Three.
const guard = `if ( all( equal( rectAreaLight.color, vec3( 0.0 ) ) ) ||
    dot( cross( rectAreaLight.halfWidth, rectAreaLight.halfHeight ), geometryPosition - rectAreaLight.position ) > 0.0 ) return;
    ${marker}`;
const optimizedChunk = ShaderChunk.lights_physical_pars_fragment.replace(marker, guard);
const prepared = new WeakSet<Material>();
const hooks = new WeakSet<Material['onBeforeCompile']>();

export function prepareAreaLightMaterial(material: Material): void {
  if (!(material instanceof MeshStandardMaterial) || prepared.has(material)) return;
  prepared.add(material);
  // Hover accents copy the source hook and cache key, so their clones are already prepared.
  if (hooks.has(material.onBeforeCompile)) return;
  const compile = material.onBeforeCompile;
  const cacheKey = material.customProgramCacheKey;
  material.onBeforeCompile = function (shader, renderer) {
    compile.call(this, shader, renderer);
    shader.fragmentShader = shader.fragmentShader.replace('#include <lights_physical_pars_fragment>', optimizedChunk);
  };
  hooks.add(material.onBeforeCompile);
  material.customProgramCacheKey = () => `${cacheKey.call(material)}|${compile.toString()}|area-light-culling-v1`;
  material.needsUpdate = true;
}

export function prepareAreaLightMaterials(root: Object3D): void {
  root.traverse(object => {
    if (!(object instanceof Mesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach(prepareAreaLightMaterial);
  });
}
