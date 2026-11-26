import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as THREE from 'three';
import { applyBanpoFacadeMaterial } from '../src/components/studio/scene/BanpoFacadeMaterial.ts';

test('night occupancy switches off exactly without replacing texture or geometry resources', () => {
  const map = new THREE.Texture();
  const material = new THREE.MeshStandardMaterial({ map });
  const originalGeometry = new THREE.BoxGeometry();
  const mesh = new THREE.Mesh(originalGeometry, material);
  const facade = applyBanpoFacadeMaterial(material);
  const shader = { uniforms: {}, vertexShader: THREE.ShaderLib.standard.vertexShader, fragmentShader: THREE.ShaderLib.standard.fragmentShader };
  material.onBeforeCompile(shader);
  assert.equal(shader.uniforms.uFacadeNight.value, 0);
  facade.setNightMix(1);
  assert.equal(shader.uniforms.uFacadeNight.value, 1);
  facade.setNightMix(0);
  assert.equal(shader.uniforms.uFacadeNight.value, 0);
  assert.equal(material.map, map);
  assert.equal(mesh.geometry, originalGeometry);
  material.dispose(); originalGeometry.dispose(); map.dispose();
});
