import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import * as THREE from 'three';
import inventory from '../public/models/han-river/building-identities.json';
import { createBanpoApartmentComplex } from '../src/components/studio/scene/BanpoApartmentComplex';

const buildings = inventory.buildings.flatMap(building => {
  if (building.complex !== 'Seobinggo Shindonga' || building.blockNumber === null || building.floors === null) return [];
  return [{ id: building.id, blockNumber: building.blockNumber, p: building.p, z: building.z, heightM: building.heightM, floors: building.floors }];
});

function meshes(group: THREE.Group): THREE.Mesh[] {
  const result: THREE.Mesh[] = [];
  group.traverse(child => { if (child instanceof THREE.Mesh) result.push(child); });
  return result;
}

describe('mapped Shindonga apartment complex', () => {
  test('retains all 15 mapped block footprints and the north/south coordinate convention', () => {
    const complex = createBanpoApartmentComplex(buildings);
    assert.equal(buildings.length, 15);
    assert.deepEqual(new Set(complex.group.userData.buildingIds), new Set(buildings.map(building => building.id)));
    const structure = meshes(complex.group)[0];
    const position = structure.geometry.getAttribute('position');
    const vertices = new Set<string>();
    for (let index = 0; index < position.count; index++) {
      vertices.add([position.getX(index), position.getY(index), position.getZ(index)].map(value => String(Math.round(value * 1000))).join(','));
    }
    for (const building of buildings) for (const point of building.p) {
      assert.ok(vertices.has([point[0], building.z, -point[1]].map(value => String(Math.round(value * 1000))).join(',')));
      assert.ok(vertices.has([point[0], building.z + building.heightM, -point[1]].map(value => String(Math.round(value * 1000))).join(',')));
    }
    complex.dispose();
  });

  test('uses outward-facing solid triangles and finite complete geometry', () => {
    const complex = createBanpoApartmentComplex(buildings);
    for (const mesh of meshes(complex.group)) {
      const p = mesh.geometry.getAttribute('position'); const n = mesh.geometry.getAttribute('normal');
      assert.equal(p.count % 3, 0);
      for (let index = 0; index < p.count; index += 3) {
        const a = new THREE.Vector3().fromBufferAttribute(p, index);
        const b = new THREE.Vector3().fromBufferAttribute(p, index + 1);
        const c = new THREE.Vector3().fromBufferAttribute(p, index + 2);
        assert.ok(a.toArray().every(Number.isFinite));
        const cross = b.sub(a).cross(c.sub(a));
        assert.ok(cross.dot(new THREE.Vector3().fromBufferAttribute(n, index)) > 0);
      }
    }
    complex.dispose();
  });

  test('has stable occupied windows and a bounded merged mesh budget', () => {
    const first = createBanpoApartmentComplex(buildings); const second = createBanpoApartmentComplex(buildings);
    const firstMeshes = meshes(first.group); const secondMeshes = meshes(second.group);
    assert.ok(firstMeshes.length <= 4);
    const triangleCount = firstMeshes.reduce((total, mesh) => total + mesh.geometry.getAttribute('position').count / 3, 0);
    assert.ok(triangleCount < 30000);
    const firstLights = firstMeshes[1].geometry.getAttribute('apartmentLight');
    const secondLights = secondMeshes[1].geometry.getAttribute('apartmentLight');
    assert.deepEqual(Array.from(firstLights.array), Array.from(secondLights.array));
    assert.ok(Array.from(firstLights.array).some(value => value > 0.1));
    assert.ok(Array.from(firstLights.array).some(value => value === 0));
    first.dispose(); second.dispose();
  });

  test('releases every owned geometry and material once and detaches its scene group', () => {
    const complex = createBanpoApartmentComplex(buildings); const scene = new THREE.Scene();
    scene.add(complex.group);
    let disposedGeometry = 0; let disposedMaterial = 0;
    const objects = meshes(complex.group);
    for (const mesh of objects) {
      mesh.geometry.addEventListener('dispose', () => { disposedGeometry++; });
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const material of materials) material.addEventListener('dispose', () => { disposedMaterial++; });
    }
    complex.dispose();
    assert.equal(disposedGeometry, objects.length); assert.equal(disposedMaterial, objects.length);
    assert.equal(complex.group.parent, null); assert.equal(complex.group.children.length, 0);
  });

  test('distant LOD preserves mapped walls and thirteen floors in one surface instead of unresolved layered panes', () => {
    const complex = createBanpoApartmentComplex(buildings);
    const lod = complex.group.getObjectByName('Shindonga distance detail');
    assert.ok(lod instanceof THREE.LOD);
    complex.group.updateMatrixWorld(true);
    const camera = new THREE.PerspectiveCamera(42, 1, 100, 12000);
    camera.position.copy(lod.position).add(new THREE.Vector3(0, 0, 2000));
    camera.updateMatrixWorld(true); lod.update(camera);
    assert.equal(lod.getCurrentLevel(), 1);
    let visibleMeshes = 0;
    complex.group.traverseVisible(object => { if (object instanceof THREE.Mesh) visibleMeshes++; });
    assert.equal(visibleMeshes, 1);
    const distant = complex.group.getObjectByName('Antialiased distant Shindonga thirteen-floor facades');
    assert.ok(distant instanceof THREE.Mesh);
    assert.ok(distant.geometry.getAttribute('position').count / 3 < 1500);
    const uv = distant.geometry.getAttribute('uv'); const face = distant.geometry.getAttribute('apartmentFace');
    const floors = new Set<number>();
    for (let vertex = 0; vertex < uv.count; vertex++) if (face.getX(vertex) > 0.5) floors.add(uv.getY(vertex));
    assert.deepEqual([...floors].sort((a, b) => a - b), [0, 13]);
    const corners = new Set<string>(); const position = distant.geometry.getAttribute('position');
    for (let vertex = 0; vertex < position.count; vertex++) {
      const world = new THREE.Vector3().fromBufferAttribute(position, vertex).applyMatrix4(distant.matrixWorld);
      corners.add(world.toArray().map(value => String(Math.round(value * 1000))).join(','));
    }
    for (const building of buildings) for (const point of building.p) {
      assert.ok(corners.has([point[0], building.z, -point[1]].map(value => String(Math.round(value * 1000))).join(',')));
    }
    camera.position.copy(lod.position).add(new THREE.Vector3(0, 0, 200));
    camera.updateMatrixWorld(true); lod.update(camera);
    assert.equal(lod.getCurrentLevel(), 0);
    visibleMeshes = 0;
    complex.group.traverseVisible(object => { if (object instanceof THREE.Mesh) visibleMeshes++; });
    assert.ok(visibleMeshes >= 2 && visibleMeshes <= 3);
    complex.dispose();
  });
});
