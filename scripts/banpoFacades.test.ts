import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import * as THREE from 'three';
import geography from '../public/models/han-river/geography.json';
import { BANPO_FACADE_SOURCES, createBanpoFacadeDetails } from '../src/components/studio/scene/BanpoFacadeDetails';

function inside(point: readonly number[], polygon: readonly (readonly number[])[]): boolean {
  let result = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j];
    if ((a[1] > point[1]) !== (b[1] > point[1]) && point[0] < (b[0] - a[0]) * (point[1] - a[1]) / (b[1] - a[1]) + a[0]) result = !result;
  }
  return result;
}

describe('mapped Banpo facade placement', () => {
  test('broadens detailed facades across the visible skyline with a bounded source set', () => {
    assert.ok(BANPO_FACADE_SOURCES.length >= 40);
    assert.ok(BANPO_FACADE_SOURCES.length <= 60);
    assert.equal(new Set(BANPO_FACADE_SOURCES.map(s => s.osmId)).size, BANPO_FACADE_SOURCES.length);
    for (const [west, east] of [[-2000, -900], [-900, 0], [0, 900], [900, 1600], [1600, 2200], [2200, 3000]]) {
      assert.ok(BANPO_FACADE_SOURCES.filter(s => s.edge[0][0] >= west && s.edge[0][0] < east).length >= 5);
    }
  });

  test('each face is a real footprint edge at the exact existing terrain base and tagged height', () => {
    for (const spec of BANPO_FACADE_SOURCES) {
      const b = geography.buildings[spec.osmIndex];
      assert.equal(b.id, spec.osmId);
      assert.equal(b.measured, true);
      assert.equal(spec.base, b.z);
      assert.equal(spec.height, b.h);
      assert.equal(b.p.some((a, i) => JSON.stringify([a, b.p[(i + 1) % b.p.length]]) === JSON.stringify(spec.edge)), true);
      const [a, c] = spec.edge, dx = c[0] - a[0], dn = c[1] - a[1], length = Math.hypot(dx, dn);
      const mid = [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2];
      const sign = ((1400 - mid[0]) * dn + (-280 - mid[1]) * -dx) >= 0 ? 1 : -1;
      assert.equal(inside([mid[0] + sign * dn / length, mid[1] - sign * dx / length], b.p), false);
      assert.equal(inside([mid[0] - sign * dn / length, mid[1] + sign * dx / length], b.p), true);
    }
  });

  test('sampled wall attachments stay outside the mapped river corridor', () => {
    for (const spec of BANPO_FACADE_SOURCES) for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      const [a, b] = spec.edge, x = a[0] + (b[0] - a[0]) * t, north = a[1] + (b[1] - a[1]) * t;
      const crossings = geography.banks.map(bank => bank.flatMap((p, i) => {
        const q = bank[i + 1];
        if (!q || p[0] === q[0] || x < Math.min(p[0], q[0]) || x > Math.max(p[0], q[0])) return [];
        return [p[1] + (q[1] - p[1]) * (x - p[0]) / (q[0] - p[0])];
      })).filter(values => values.length).map(values => values.reduce((s, v) => s + v, 0) / values.length);
      assert.equal(crossings.length, 2);
      assert.equal(north < Math.min(...crossings) - 1 || north > Math.max(...crossings) + 1, true);
    }
  });

  test('all rendered details remain aligned with an originating wall and its height', () => {
    const detail = createBanpoFacadeDetails();
    const matrix = new THREE.Matrix4(), position = new THREE.Vector3(), scale = new THREE.Vector3(), rotation = new THREE.Quaternion();
    for (const mesh of detail.group.children) {
      if (!(mesh instanceof THREE.InstancedMesh)) throw new TypeError('Facade batches must be instanced');
      for (let i = 0; i < mesh.count; i += 1) {
        mesh.getMatrixAt(i, matrix); matrix.decompose(position, rotation, scale);
        const axis = new THREE.Vector3(1, 0, 0).applyQuaternion(rotation);
        const supported = BANPO_FACADE_SOURCES.some(spec => {
          const [a, b] = spec.edge, dx = b[0] - a[0], dz = a[1] - b[1], length = Math.hypot(dx, dz);
          const relX = position.x - (a[0] + b[0]) / 2, relZ = position.z + (a[1] + b[1]) / 2;
          const facingSign = ((1400 - (a[0] + b[0]) / 2) * -dz + (280 + (a[1] + b[1]) / 2) * dx) >= 0 ? 1 : -1;
          const outwardOffset = (relX * -dz + relZ * dx) / length * facingSign;
          return outwardOffset >= 0.07 && outwardOffset <= 0.7 &&
            Math.abs((relX * dx + relZ * dz) / length) + scale.x / 2 <= length / 2 + 0.02 &&
            Math.abs(axis.x * dx / length + axis.z * dz / length) > 0.99999 &&
            position.y - scale.y / 2 >= spec.base && position.y + scale.y / 2 <= spec.base + spec.height + 0.7;
        });
        assert.equal(supported, true);
      }
    }
    detail.dispose();
  });

  test('holds three shared-geometry batches below 5,000 instances and 60,000 triangles', () => {
    const detail = createBanpoFacadeDetails();
    let count = 0; const geometries = new Set<THREE.BufferGeometry>();
    assert.equal(detail.group.children.length, 3);
    for (const mesh of detail.group.children) {
      if (!(mesh instanceof THREE.InstancedMesh)) throw new TypeError('Facade batch must be instanced');
      count += mesh.count; geometries.add(mesh.geometry);
      assert.equal(mesh.castShadow, false);
    }
    assert.equal(geometries.size, 1);
    assert.ok(count <= 5000);
    assert.ok(count * 12 <= 60000);
    detail.dispose();
  });

  test('switches night windows off in daytime without rewriting their varied colors', () => {
    const detail = createBanpoFacadeDetails();
    const lights = detail.group.getObjectByName('Varied occupied north-bank windows');
    if (!(lights instanceof THREE.InstancedMesh) || !(lights.material instanceof THREE.MeshBasicMaterial)) throw new TypeError('Missing night light batch');
    const version = lights.instanceColor?.version;
    assert.equal(lights.visible, false);
    detail.setNightMix(1);
    assert.equal(lights.visible, true);
    assert.equal(lights.material.color.r, 1);
    detail.setNightMix(0.4);
    assert.equal(lights.material.color.r, 0.4);
    assert.equal(lights.instanceColor?.version, version);
    detail.setNightMix(-1);
    assert.equal(lights.visible, false);
    detail.dispose();
  });
});
