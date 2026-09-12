import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as THREE from 'three';
import { caelitusBridgeSpans, createBanpoCaelitus, type CaelitusBuilding } from '../src/components/studio/scene/BanpoCaelitus';

const TOWERS = [
  { id: 522785017, blockNumber: 101, floors: 56, heightM: 196, z: 16,
    p: [[-1088.3, 743.7], [-1060.7, 755.3], [-1049.1, 727.9], [-1076.8, 716.2]] },
  { id: 610247142, blockNumber: 102, floors: 42, heightM: 147.3, z: 23.3,
    p: [[-1036, 804.7], [-1009.2, 816.8], [-996.3, 788.3], [-1023.1, 776.2]] },
  { id: 610247143, blockNumber: 103, floors: 36, heightM: 129.3, z: 23.6,
    p: [[-1083.6, 822.1], [-1056.9, 834.2], [-1044, 805.7], [-1070.7, 793.6]] },
] as const satisfies readonly CaelitusBuilding[];

test('three named footprints retain their geographic corners, roof heights and outward facing walls', () => {
  const model = createBanpoCaelitus(TOWERS);
  const walls = model.group.getObjectByName('Caelitus OSM footprint curtain walls');
  assert.ok(walls instanceof THREE.Mesh);
  const position = walls.geometry.getAttribute('position');
  const normals = walls.geometry.getAttribute('normal');
  let offset = 0;
  for (const tower of TOWERS) {
    const center = new THREE.Vector3(
      tower.p.reduce((sum, point) => sum + point[0], 0) / tower.p.length,
      tower.z,
      -tower.p.reduce((sum, point) => sum + point[1], 0) / tower.p.length,
    );
    const towerVertices: THREE.Vector3[] = [];
    for (let i = 0; i < tower.p.length * 6; i += 1) towerVertices.push(new THREE.Vector3().fromBufferAttribute(position, offset + i));
    for (const point of tower.p) {
      for (const y of [tower.z, tower.z + tower.heightM]) {
        assert.ok(towerVertices.some(vertex => vertex.distanceTo(new THREE.Vector3(point[0], y, -point[1])) < 0.001));
      }
    }
    for (let edge = 0; edge < tower.p.length; edge += 1) {
      const vertex = towerVertices[edge * 6];
      const normal = new THREE.Vector3().fromBufferAttribute(normals, offset + edge * 6);
      assert.ok(normal.dot(vertex.clone().sub(center).setY(0)) > 0);
    }
    offset += tower.p.length * 6;
  }
  model.dispose();
});

test('two horizontal skybridges terminate at mapped facades and preserve the human-shaped tower101 junction', () => {
  const bridges = caelitusBridgeSpans(TOWERS);
  assert.equal(bridges.length, 2);
  assert.deepEqual(bridges.map(bridge => [bridge.from, bridge.to]), [[522785017, 610247142], [522785017, 610247143]]);
  const elevations = new Set(bridges.map(bridge => bridge.start.y));
  assert.equal(elevations.size, 1);
  for (const bridge of bridges) {
    assert.equal(bridge.start.y, bridge.end.y);
    assert.ok(bridge.clearSpanM > 38 && bridge.clearSpanM < 45);
    const target = TOWERS.find(tower => tower.id === bridge.to);
    assert.ok(target);
    const onEdge = target.p.some((point, index) => {
      const next = target.p[(index + 1) % target.p.length];
      const segment = new THREE.Line3(new THREE.Vector3(point[0], bridge.end.y, -point[1]), new THREE.Vector3(next[0], bridge.end.y, -next[1]));
      return segment.closestPointToPoint(bridge.end, true, new THREE.Vector3()).distanceTo(bridge.end) < 0.001;
    });
    assert.ok(onEdge);
    assert.ok(bridge.start.y > 70 && bridge.start.y < 85);
  }
});

test('building details remain below four draw batches and fifteen thousand triangles without texture or transmission allocation', () => {
  const model = createBanpoCaelitus(TOWERS);
  let draws = 0; let triangles = 0;
  model.group.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    draws += 1;
    const triangleCount = (object.geometry.index?.count ?? object.geometry.getAttribute('position').count) / 3;
    triangles += triangleCount * (object instanceof THREE.InstancedMesh ? object.count : 1);
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      assert.ok(material instanceof THREE.MeshStandardMaterial);
      assert.equal(material.map, null);
      assert.equal(material.transparent, false);
      assert.ok(!(material instanceof THREE.MeshPhysicalMaterial));
    }
  });
  assert.equal(draws, 4);
  assert.ok(triangles < 15000);
  const nightGeometry = model.group.children.map(child => child instanceof THREE.Mesh ? child.geometry.id : -1);
  model.setNightMix(1); model.setNightMix(0); model.setNightMix(1);
  assert.deepEqual(model.group.children.map(child => child instanceof THREE.Mesh ? child.geometry.id : -1), nightGeometry);
  model.dispose();
  assert.equal(model.group.children.length, 0);
});

test('absent tower101 never leaves floating bridges', () => {
  assert.equal(caelitusBridgeSpans(TOWERS.slice(1)).length, 0);
});
