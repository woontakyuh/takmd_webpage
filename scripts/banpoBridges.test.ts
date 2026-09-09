import assert from 'node:assert/strict';
import * as THREE from 'three';
import bridgeReceipt from '../public/models/han-river/bridges.json';
import { createBanpoBridges } from '../src/components/studio/scene/BanpoBridges';

const bridges = createBanpoBridges();

const expected = [
  ['Dongjak Bridge', 'blue arch'],
  ['Hannam Bridge', 'wide beam'],
  ['Dongho Bridge', 'orange truss'],
] as const;

assert.equal(bridges.group.children.length, expected.length, 'three sourced adjacent bridges are present');
for (const [bridgeName, structureName] of expected) {
  const bridge = bridges.group.getObjectByName(bridgeName);
  assert.ok(bridge, `${bridgeName} exists`);
  assert.ok(bridge.getObjectByName(`${bridgeName} ${structureName}`), `${bridgeName} keeps its real structural identity`);
  const bounds = new THREE.Box3().setFromObject(bridge);
  const span = Math.hypot(bounds.max.x - bounds.min.x, bounds.max.z - bounds.min.z);
  assert.ok(span > 800, `${bridgeName} crosses the Han River instead of sitting on one bank`);
}

const hannam = bridges.group.getObjectByName('Hannam Bridge');
const dongho = bridges.group.getObjectByName('Dongho Bridge');
const dongjak = bridges.group.getObjectByName('Dongjak Bridge');
assert.ok(hannam && dongho && dongjak);
assert.ok(hannam.position.x > 1_000 && hannam.position.z < -1_000, 'Hannam is upstream/east of Banpo');
assert.ok(dongho.position.x > hannam.position.x && dongho.position.z < hannam.position.z, 'Dongho follows Hannam upstream');
assert.ok(dongjak.position.x < 0 && dongjak.position.z > -200, 'Dongjak is downstream/west of Banpo');

for (const receipt of bridgeReceipt.bridges) {
  const bridge = bridges.group.getObjectByName(receipt.nameEn);
  assert.ok(bridge);
  const sourceStart = new THREE.Vector3(...receipt.renderedAxisLocal[0]);
  const sourceEnd = new THREE.Vector3(...receipt.renderedAxisLocal[1]);
  const sourceMidpoint = sourceStart.clone().lerp(sourceEnd, 0.5);
  assert.ok(bridge.position.distanceTo(sourceMidpoint) < 0.1, `${receipt.nameEn} midpoint matches bridges.json`);
  const modeledStart = new THREE.Vector3(0, 0, -sourceStart.distanceTo(sourceEnd) / 2).applyQuaternion(bridge.quaternion).add(bridge.position);
  const modeledEnd = new THREE.Vector3(0, 0, sourceStart.distanceTo(sourceEnd) / 2).applyQuaternion(bridge.quaternion).add(bridge.position);
  assert.ok(modeledStart.distanceTo(sourceStart) < 0.1, `${receipt.nameEn} first endpoint matches bridges.json`);
  assert.ok(modeledEnd.distanceTo(sourceEnd) < 0.1, `${receipt.nameEn} second endpoint matches bridges.json`);
}

let renderedTriangles = 0;
let drawCalls = 0;
bridges.group.traverse(object => {
  if (!(object instanceof THREE.Mesh)) return;
  const triangleCount = (object.geometry.index?.count ?? object.geometry.getAttribute('position').count) / 3;
  renderedTriangles += triangleCount * (object instanceof THREE.InstancedMesh ? object.count : 1);
  drawCalls += 1;
});
assert.ok(renderedTriangles < 30_000, `bridge geometry stays below 30k triangles (${renderedTriangles})`);
assert.ok(drawCalls <= 30, `bridge geometry stays at 30 draw calls or fewer (${drawCalls})`);

const nightLights = bridges.group.getObjectByName('Hannam Bridge roadway lights');
assert.ok(nightLights instanceof THREE.InstancedMesh);
assert.ok(nightLights.material instanceof THREE.MeshBasicMaterial);
bridges.setNightMix(0);
assert.equal(nightLights.material.opacity, 0, 'road lighting is completely absent by day');
bridges.setNightMix(1);
assert.equal(nightLights.material.opacity, 1, 'night lighting reaches full visibility');
assert.ok(Math.max(nightLights.material.color.r, nightLights.material.color.g, nightLights.material.color.b) > 1, 'night lighting uses an HDR core that survives kilometre-scale viewing');

const dongjakSteel = bridges.group.getObjectByName('Dongjak Bridge colored steelwork');
const donghoSteel = bridges.group.getObjectByName('Dongho Bridge colored steelwork');
assert.ok(dongjakSteel instanceof THREE.Mesh && dongjakSteel.material instanceof THREE.MeshStandardMaterial);
assert.ok(donghoSteel instanceof THREE.Mesh && donghoSteel.material instanceof THREE.MeshStandardMaterial);
assert.ok(dongjakSteel.material.emissiveIntensity > 0 && donghoSteel.material.emissiveIntensity > 0, 'road-rail steelwork remains subtly legible at night');
bridges.setNightMix(0);
assert.equal(dongjakSteel.material.emissiveIntensity, 0, 'Dongjak structure glow resets completely by day');
assert.equal(donghoSteel.material.emissiveIntensity, 0, 'Dongho structure glow resets completely by day');
bridges.setNightMix(1);

const traffic = bridges.group.getObjectByName('Hannam Bridge traffic bodies');
assert.ok(traffic instanceof THREE.InstancedMesh);
const before = new THREE.Matrix4();
const after = new THREE.Matrix4();
traffic.getMatrixAt(0, before);
bridges.setTime(8);
traffic.getMatrixAt(0, after);
assert.notDeepEqual(after.elements, before.elements, 'traffic advances along the sourced bridge axis');

const donghoTraffic = bridges.group.getObjectByName('Dongho Bridge traffic bodies');
assert.ok(donghoTraffic instanceof THREE.InstancedMesh);
const laneMatrix = new THREE.Matrix4();
const donghoLaneX: number[] = [];
for (let index = 0; index < 4; index += 1) {
  donghoTraffic.getMatrixAt(index, laneMatrix);
  donghoLaneX.push(new THREE.Vector3().setFromMatrixPosition(laneMatrix).x);
}
assert.ok(donghoLaneX.every(x => Math.abs(x) > 3.5), 'Dongho road traffic stays outside the central railway bed');

bridges.setTime(0);
const directionBefore: number[] = [];
const directionAfter: number[] = [];
for (let index = 0; index < 6; index += 1) {
  traffic.getMatrixAt(index, laneMatrix);
  directionBefore.push(new THREE.Vector3().setFromMatrixPosition(laneMatrix).z);
}
bridges.setTime(1);
for (let index = 0; index < 6; index += 1) {
  traffic.getMatrixAt(index, laneMatrix);
  directionAfter.push(new THREE.Vector3().setFromMatrixPosition(laneMatrix).z);
}
const directionDelta = directionAfter.map((value, index) => value - directionBefore[index]);
assert.ok(directionDelta.slice(0, 3).every(delta => delta > 0), 'Hannam first carriageway flows in one direction');
assert.ok(directionDelta.slice(3).every(delta => delta < 0), 'Hannam opposite carriageway flows in the other direction');

bridges.dispose();
assert.equal(bridges.group.children.length, 0, 'dispose releases the bridge scene graph');
console.log(`Banpo bridge scenarios passed: geography, distinct structures, night lighting, traffic, disposal; ${renderedTriangles} triangles, ${drawCalls} draw calls`);
