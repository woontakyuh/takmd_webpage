import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { test } from 'node:test';
import * as THREE from 'three';
import geography from '../public/models/han-river/geography.json';
import landcover from '../public/models/han-river/landcover.json';
import preparedBuildings from '../public/models/han-river/urban-fabric.json';
import { generateUrbanFabric, intersectsProtectedFeature, parseUrbanSource } from './prepare-banpo-urban-fabric';
import { createBanpoUrbanFabric } from '../src/components/studio/scene/BanpoUrbanFabric';
import { insideFeature } from '../src/components/studio/scene/BanpoCanopyPlacement';

const source = parseUrbanSource(gunzipSync(readFileSync(new URL('./fixtures/banpo-buildings-osm-2026-07-15.json.gz', import.meta.url))).toString());
const before = JSON.stringify(geography.buildings);
const buildings = generateUrbanFabric(source);

test('fills omitted low-rise footprints deterministically without changing indexed buildings', () => {
  // Given: the saved raw OSM input and indexed 850-building city.
  // When: the exact same source is prepared again.
  const repeated = generateUrbanFabric(source);
  // Then: enough genuine omitted footprints survive, and original indices remain unchanged.
  assert.deepEqual(repeated, buildings);
  assert.deepEqual(preparedBuildings, buildings);
  assert.ok(buildings.length >= 250 && buildings.length <= 380);
  assert.equal(JSON.stringify(geography.buildings), before);
  const existing = new Set(geography.buildings.map(building => building.id));
  const rawIds = new Set(source.map(element => element.id));
  for (const building of buildings) {
    assert.equal(existing.has(building.id), false);
    assert.equal(rawIds.has(building.id), true);
    assert.ok(building.h > 0 && building.h <= 28);
    assert.ok(building.p.length >= 3);
  }
});

test('preserves park and woodland interiors and permits a protected polygon hole', () => {
  // Given: a mapped protected area with an inner exclusion.
  const feature = { rings: [[[0, 0], [100, 0], [100, 100], [0, 100]], [[30, 30], [70, 30], [70, 70], [30, 70]]] };
  // When/Then: footprints in the hole are allowed, while crossing or occupying green land is rejected.
  assert.equal(intersectsProtectedFeature([[40, 40], [60, 40], [60, 60], [40, 60]], feature), false);
  assert.equal(intersectsProtectedFeature([[20, 40], [60, 40], [60, 60], [20, 60]], feature), true);
  assert.equal(intersectsProtectedFeature([[5, 5], [15, 5], [15, 15], [5, 15]], feature), true);
  for (const building of buildings) for (const cover of [...landcover.park, ...landcover.woodland]) {
    assert.equal(intersectsProtectedFeature(building.p, cover), false, String(building.id));
    assert.equal(insideFeature(building.p[0], cover), false);
  }
});

test('renders complete footprint walls and roofs in at most two batches and 20000 triangles', () => {
  // Given: generated source-aligned footprints.
  // When: actual runtime geometry is built.
  const fabric = createBanpoUrbanFabric(buildings);
  // Then: real geometry stays within budget, has complete surfaces and releases resources.
  let triangles = 0; let disposals = 0;
  assert.equal(fabric.group.children.length, 2);
  for (const mesh of fabric.group.children) {
    assert.ok(mesh instanceof THREE.Mesh);
    triangles += (mesh.geometry.index?.count ?? mesh.geometry.getAttribute('position').count) / 3;
    assert.ok(mesh.geometry.getAttribute('position').count > 0);
    assert.equal(mesh.castShadow, false);
    mesh.geometry.addEventListener('dispose', () => disposals++);
  }
  assert.ok(triangles > 1000 && triangles <= 20000);
  fabric.dispose();
  assert.equal(disposals, 2);
});
