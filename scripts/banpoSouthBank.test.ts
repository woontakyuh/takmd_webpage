import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { test } from 'node:test';
import * as THREE from 'three';
import geography from '../public/models/han-river/geography.json';
import { generateSouthBank, parseSouthSource } from './prepare-banpo-south-bank';
import { createBanpoSouthBank } from '../src/components/studio/scene/BanpoSouthBank';

test('restores the mapped south-bank skyline and building parts without changing the retained city', async () => {
  // Given: a dated OSM extract and the retained north-bank geometry.
  const source = parseSouthSource(gunzipSync(readFileSync(new URL('./fixtures/banpo-south-osm-2026-09-13.json.gz', import.meta.url))).toString());
  const retained = JSON.stringify(geography.buildings);
  // When: the south-bank layer is prepared from its source data.
  const data = await generateSouthBank(source);
  // Then: recognizable real complexes and height-tagged building parts survive.
  assert.ok(data.buildings.length > 350);
  for (const name of ['래미안원베일리아파트', '아크로리버파크 아파트', '래미안원펜타스 아파트', '래미안 퍼스티지 아파트', '반포자이아파트']) {
    assert.ok(data.buildings.filter(building => building.complex === name).length >= 6, name);
  }
  assert.ok(data.buildings.some(building => building.id === 543646516 && building.h > 100));
  assert.equal(JSON.stringify(geography.buildings), retained);
  const retainedIds = new Set(geography.buildings.map(building => building.id));
  assert.equal(data.buildings.some(building => retainedIds.has(building.id)), false);
  assert.equal(new Set(data.buildings.map(building => building.id)).size, data.buildings.length);
  assert.ok(data.construction.length >= 40);
  assert.ok(data.trees.length >= 60);
});

test('keeps the entire south-bank addition within static geometry and disposal budgets', async () => {
  // Given: the actual sourced skyline data.
  const source = parseSouthSource(gunzipSync(readFileSync(new URL('./fixtures/banpo-south-osm-2026-09-13.json.gz', import.meta.url))).toString());
  const data = await generateSouthBank(source);
  // When: runtime geometry is constructed once.
  const gravel = new THREE.Texture();
  let sharedTextureDisposals = 0;
  gravel.addEventListener('dispose', () => sharedTextureDisposals++);
  const layer = createBanpoSouthBank(data, gravel);
  let draws = 0; let triangles = 0; let geometries = 0; let disposals = 0;
  const materials = new Set<THREE.Material>(); let materialDisposals = 0;
  layer.group.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    draws++;
    triangles += (object.geometry.index?.count ?? object.geometry.getAttribute('position').count) / 3
      * (object instanceof THREE.InstancedMesh ? object.count : 1);
    geometries++;
    object.geometry.addEventListener('dispose', () => disposals++);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
    assert.equal(object.castShadow, false);
  });
  materials.forEach(material => material.addEventListener('dispose', () => materialDisposals++));
  // Then: the whole layer is bounded and releases its owned geometry.
  assert.ok(draws <= 9, `${draws} draw calls`);
  assert.ok(triangles < 65000, `${triangles} triangles`);
  layer.dispose();
  assert.equal(disposals, geometries);
  assert.equal(materialDisposals, materials.size);
  assert.equal(sharedTextureDisposals, 0);
  assert.equal(layer.group.children.length, 0);
  gravel.dispose();
});
