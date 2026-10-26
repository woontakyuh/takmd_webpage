import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import identities from '../public/models/han-river/building-identities.json';
import { replaceBanpoBuildingIndices } from '../src/components/studio/scene/BanpoBuildingReplacement';

type Building = { readonly id: number; readonly p: readonly (readonly number[])[]; readonly z: number; readonly heightM: number };

function geometryOnlyGlb(name: string): ArrayBuffer {
  const original = readFileSync(new URL(`../public/models/han-river/${name}`, import.meta.url));
  const length = original.readUInt32LE(12);
  const json = JSON.parse(original.toString('utf8', 20, 20 + length));
  json.materials = json.materials.map((material: { name: string }) => ({ name: material.name, doubleSided: true }));
  delete json.images; delete json.textures; delete json.samplers;
  const text = JSON.stringify(json);
  const bytes = Buffer.from(text + ' '.repeat((4 - Buffer.byteLength(text) % 4) % 4));
  const binary = original.subarray(20 + length);
  const header = Buffer.alloc(20);
  header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4); header.writeUInt32LE(20 + bytes.length + binary.length, 8);
  header.writeUInt32LE(bytes.length, 12); header.writeUInt32LE(0x4e4f534a, 16);
  return new Uint8Array(Buffer.concat([header, bytes, binary])).slice().buffer;
}

function inside(east: number, north: number, ring: readonly (readonly number[])[]): boolean {
  let result = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const a = ring[previous]; const b = ring[index];
    const dx = b[0] - a[0]; const dy = b[1] - a[1];
    const lengthSquared = dx * dx + dy * dy;
    const t = lengthSquared > 0 ? THREE.MathUtils.clamp(((east - a[0]) * dx + (north - a[1]) * dy) / lengthSquared, 0, 1) : 0;
    if ((east - a[0] - dx * t) ** 2 + (north - a[1] - dy * t) ** 2 < 0.75 ** 2) return true;
    if ((a[1] > north) !== (b[1] > north) && east < (b[0] - a[0]) * (north - a[1]) / (b[1] - a[1]) + a[0]) result = !result;
  }
  return result;
}

function mappedTriangleCount(model: THREE.Group, buildings: readonly Building[]): number {
  const point = new THREE.Vector3(); const centroid = new THREE.Vector3(); const inverse = model.matrixWorld.clone().invert();
  let total = 0;
  model.traverse(object => {
    if (!(object instanceof THREE.Mesh) || !['Mapped Seoul building facades', 'Mapped Seoul rooflines', 'Lift housings']
      .some(prefix => object.name.replace(/_/g, ' ').startsWith(prefix))) return;
    const position = object.geometry.getAttribute('position'); const index = object.geometry.index;
    const relative = new THREE.Matrix4().multiplyMatrices(inverse, object.matrixWorld);
    for (let offset = 0; offset < (index?.count ?? position.count); offset += 3) {
      centroid.set(0, 0, 0);
      for (let corner = 0; corner < 3; corner += 1) centroid.add(point.fromBufferAttribute(position, index ? index.getX(offset + corner) : offset + corner).applyMatrix4(relative));
      centroid.multiplyScalar(1 / 3);
      if (buildings.some(building => centroid.y >= building.z - 0.75 && centroid.y <= building.z + building.heightM + 4.5
        && inside(centroid.x, -centroid.z, building.p))) total += 1;
    }
  });
  return total;
}

test('source footprint removes its compressed walls and roof without touching adjacent buildings or terrain', () => {
  const model = new THREE.Group();
  model.rotation.y = Math.PI / 2;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([
    0.1, 10, -10, 20.1, 10, -10, 20.1, 49.6, -10,
    0, 49.6, -10, 20, 49.6, -10, 10, 49.6, -25,
    25, 10, -10, 45, 10, -10, 45, 49.6, -10,
  ], 3));
  geometry.setIndex([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  const original = geometry.index;
  const material = new THREE.MeshStandardMaterial();
  const walls = new THREE.Mesh(geometry, material);
  walls.name = 'Mapped_Seoul_building_facades';
  const terrain = new THREE.Mesh(geometry.clone(), material);
  terrain.name = 'SRTM north bank and Namsan';
  model.add(walls, terrain);
  const replacement = replaceBanpoBuildingIndices(model, [{
    p: [[0, 10], [20, 10], [20, 25], [0, 25]], z: 10, h: 39.65,
  }]);
  assert.equal(replacement.removedTriangles, 2);
  assert.equal(replacement.modifiedMeshes, 1);
  assert.deepEqual(Array.from(geometry.index?.array ?? []), [6, 7, 8]);
  assert.equal(terrain.geometry.index?.count, 9);
  replacement.restore();
  assert.equal(geometry.index, original);
  geometry.dispose(); terrain.geometry.dispose(); material.dispose();
});

test('retains an overlapping ground object and a building outside the selected height envelope', () => {
  const model = new THREE.Group();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([
    0, 100, -10, 20, 100, -10, 20, 140, -10,
  ], 3));
  const material = new THREE.MeshStandardMaterial();
  const mesh = new THREE.Mesh(geometry, material); mesh.name = 'Mapped Seoul rooflines';
  model.add(mesh);
  const replacement = replaceBanpoBuildingIndices(model, [{ p: [[0, 10], [20, 10], [20, 25], [0, 25]], z: 10, h: 39.65 }]);
  assert.equal(replacement.removedTriangles, 0);
  assert.equal(geometry.index, null);
  replacement.restore(); geometry.dispose(); material.dispose();
});

test('removes every selected footprint from the shipped rotated GLB while retaining named neighbours', async () => {
  const selected: readonly Building[] = identities.buildings.filter(building => building.complex === 'Seobinggo Shindonga' || building.complex === 'Raemian Caelitus')
    .map(building => ({ id: building.id, p: building.p, z: building.z, heightM: building.heightM }));
  const neighbours: readonly Building[] = identities.buildings.filter(building => building.id === 431589092 || building.id === 431589099)
    .map(building => ({ id: building.id, p: building.p, z: building.z, heightM: building.heightM }));
  const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(geometryOnlyGlb('banpo-pilot.glb'), '');
  const model = gltf.scene;
  model.rotation.y = Math.PI / 2; model.updateWorldMatrix(true, true);
  assert.equal(mappedTriangleCount(model, selected), 333);
  const neighbourCount = mappedTriangleCount(model, neighbours);
  assert.equal(neighbourCount, 67);
  const replacement = replaceBanpoBuildingIndices(model, selected.map(building => ({ p: building.p, z: building.z, h: building.heightM })));
  assert.equal(replacement.removedTriangles, 333);
  assert.equal(mappedTriangleCount(model, selected), 0);
  assert.equal(mappedTriangleCount(model, neighbours), neighbourCount);
  replacement.restore();
  const geometries = new Set<THREE.BufferGeometry>(); const materials = new Set<THREE.Material>();
  model.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
  });
  geometries.forEach(geometry => geometry.dispose()); materials.forEach(material => material.dispose()); model.clear();
});
