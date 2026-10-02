import { test, expect } from 'bun:test';
import * as THREE from 'three';
import { appendParkPolygon, parkBuffer } from './BanpoParkGeometry';
import { createBanpoPark, BANPO_PARK_FEATURES } from './BanpoPark';
import { generateParkTrees, PARK_TREE_BUDGET } from './BanpoParkPlanting';
import { insideRing, lineDistance } from './BanpoCanopyPlacement';

function surface(points, height) {
  const positions = []; appendParkPolygon(positions, points, height);
  return new THREE.Mesh(parkBuffer(positions), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
}
function elevation(mesh, x, y) {
  const ray = new THREE.Raycaster(new THREE.Vector3(x, 100, -y), new THREE.Vector3(0, -1, 0));
  return ray.intersectObject(mesh)[0]?.point.y;
}
test('overlapping park polygons follow the same terrain triangles regardless of outline', () => {
  const height = ([x,y]) => Math.max(8.2, 4 + Math.abs(x - 41) * .2 + Math.abs(y - 38) * .14);
  const base = surface([[0,0],[100,0],[100,100],[0,100]], height);
  const path = surface([[3,12],[98,46],[91,51],[2,16]], p => height(p) + .18);
  for (const [x,y] of [[25,22],[50,31],[75,40],[92,47]]) {
    expect(elevation(path,x,y) - elevation(base,x,y)).toBeCloseTo(.18, 4);
  }
  for (const m of [base,path]) { m.geometry.dispose(); m.material.dispose(); }
});
test('restored Seoraeseom occupies its mapped footprint and leaves the canal outside it', () => {
  const island = BANPO_PARK_FEATURES.find(f => f.kind === 'island');
  const mesh = surface(island.p, () => 8.32);
  expect(elevation(mesh,-190,-230)).toBeCloseTo(8.32, 4);
  expect(elevation(mesh,-200,-345)).toBeUndefined();
  mesh.geometry.dispose(); mesh.material.dispose();
});
test('additional trees stay on mapped land, clear paths and remain within the instance budget', () => {
  const trees = generateParkTrees(BANPO_PARK_FEATURES);
  expect(trees.length).toBeGreaterThan(30); expect(trees.length).toBeLessThanOrEqual(PARK_TREE_BUDGET);
  for (const tree of trees) {
    const region = BANPO_PARK_FEATURES.find(f => f.id === tree.sourceId);
    expect(insideRing([tree.east,tree.north],region.p)).toBe(true);
    for (const path of BANPO_PARK_FEATURES.filter(f => ['walk','cycle','service','bridge'].includes(f.kind))) {
      expect(lineDistance([tree.east,tree.north],path.p,path.area)).toBeGreaterThanOrEqual(path.widthM / 2 + 6.5);
    }
  }
});
test('park owns bounded static batches with finite geometry and disposes its resources', () => {
  const park = createBanpoPark(); let disposed = 0;
  for (const mesh of park.group.children) {
    mesh.geometry.addEventListener('dispose', () => disposed++);
    expect([...mesh.geometry.getAttribute('position').array].every(Number.isFinite)).toBe(true);
    expect([...mesh.geometry.getAttribute('normal').array].every(Number.isFinite)).toBe(true);
    expect(mesh.castShadow).toBe(false);
  }
  const batches = park.group.children.length;
  expect(batches).toBeLessThanOrEqual(10);
  expect(park.group.userData.triangles).toBeLessThan(40000);
  park.dispose(); expect(disposed).toBe(batches); expect(park.group.children.length).toBe(0);
});
