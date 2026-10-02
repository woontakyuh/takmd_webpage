import { expect, test } from 'bun:test';
import { MeshStandardMaterial, MeshPhysicalMaterial, ShaderChunk, Vector3 } from 'three';
import { prepareAreaLightMaterial } from '../src/components/studio/scene/AreaLightCulling';

test('area lights reject zero contributions before lookup textures without changing global shaders', () => {
  const source = ShaderChunk.lights_physical_pars_fragment;
  for (const material of [new MeshStandardMaterial(), new MeshPhysicalMaterial()]) {
    const shader = { fragmentShader: '#include <lights_physical_pars_fragment>' };
    prepareAreaLightMaterial(material);
    material.onBeforeCompile(shader, {});
    const start = shader.fragmentShader.indexOf('void RE_Direct_RectArea_Physical');
    const direct = shader.fragmentShader.slice(start);
    expect(direct.indexOf('all( equal( rectAreaLight.color')).toBeGreaterThan(0);
    expect(direct.indexOf('all( equal( rectAreaLight.color')).toBeLessThan(direct.indexOf('texture2D( ltc_1'));
    expect(direct).toContain('> 0.0 ) return;');
  }
  expect(ShaderChunk.lights_physical_pars_fragment).toBe(source);
});

test('the early plane predicate matches the existing LTC rejection including coplanar points', () => {
  for (let i = 0; i < 100; i++) {
    const width = new Vector3(1 + i / 20, .2, -.3);
    const height = new Vector3(-.1, .8 + i / 30, .2);
    const origin = new Vector3(3, -2, 7);
    const point = new Vector3(i / 10 - 5, 2 - i / 20, -1);
    const rect0 = origin.clone().add(width).sub(height);
    const normal = width.clone().multiplyScalar(-2).cross(height.clone().multiplyScalar(2));
    const old = normal.dot(point.clone().sub(rect0)) < 0;
    const next = width.clone().cross(height).dot(point.clone().sub(origin)) > 0;
    expect(next).toBe(old);
  }
  expect(new Vector3(1, 0, 0).cross(new Vector3(0, 1, 0)).dot(new Vector3(1, 2, 0)) > 0).toBe(false);
});

test('material hooks, dynamic cache keys and copied hover hooks survive idempotent preparation', () => {
  const material = new MeshStandardMaterial();
  let version = 1;
  material.onBeforeCompile = shader => { shader.fragmentShader += '\n// original hook'; };
  material.customProgramCacheKey = () => `custom-${version}`;
  prepareAreaLightMaterial(material);
  const firstHook = material.onBeforeCompile;
  prepareAreaLightMaterial(material);
  expect(material.onBeforeCompile).toBe(firstHook);
  version = 2;
  expect(material.customProgramCacheKey()).toContain('custom-2');
  const clone = material.clone();
  clone.onBeforeCompile = material.onBeforeCompile;
  clone.customProgramCacheKey = material.customProgramCacheKey.bind(material);
  prepareAreaLightMaterial(clone);
  expect(clone.onBeforeCompile).toBe(firstHook);
  const shader = { fragmentShader: '#include <lights_physical_pars_fragment>' };
  clone.onBeforeCompile(shader, {});
  expect(shader.fragmentShader).toContain('// original hook');
  expect(shader.fragmentShader.match(/all\( equal\( rectAreaLight.color/g)).toHaveLength(1);
});
