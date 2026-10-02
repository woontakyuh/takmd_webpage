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

const dongjakArches = bridges.group.getObjectByName('Dongjak Bridge 13 repeated central tied-arch bays');
assert.ok(dongjakArches instanceof THREE.Mesh, 'Dongjak uses short tied arches aligned to the 14 support stations');
assert.equal(dongjakArches.userData.archBayCount, 13, 'Dongjak has one photo-based arch bay between each modeled support station');
assert.equal(dongjakArches.userData.placement, 'centralRailway', 'Dongjak structural steel is assigned to the central railway');
dongjakArches.geometry.computeBoundingBox();
const dongjakArchBounds = dongjakArches.geometry.boundingBox;
assert.ok(dongjakArchBounds);
assert.ok(Math.max(Math.abs(dongjakArchBounds.min.x), Math.abs(dongjakArchBounds.max.x)) < 6, 'Dongjak arches flank the central railway instead of the outer road edges');
const dongjakPiers = bridges.group.getObjectByName('Dongjak Bridge sourced pier rhythm');
assert.ok(dongjakPiers instanceof THREE.InstancedMesh && dongjakPiers.count === 14);
const dongjakPierCaps = bridges.group.getObjectByName('Dongjak Bridge concrete transverse pier caps');
assert.ok(dongjakPierCaps instanceof THREE.InstancedMesh && dongjakPierCaps.count === 14, 'Dongjak piers carry modest concrete transverse caps');
const supportMatrix = new THREE.Matrix4();
dongjakPiers.getMatrixAt(0, supportMatrix);
const firstDongjakSupportZ = new THREE.Vector3().setFromMatrixPosition(supportMatrix).z;
dongjakPiers.getMatrixAt(13, supportMatrix);
const lastDongjakSupportZ = new THREE.Vector3().setFromMatrixPosition(supportMatrix).z;
assert.ok(Math.abs(firstDongjakSupportZ - dongjakArchBounds.min.z) < 2, 'Dongjak first short arch begins at the first support station');
assert.ok(Math.abs(lastDongjakSupportZ - dongjakArchBounds.max.z) < 2, 'Dongjak last short arch ends at the last support station');

const donghoTruss = bridges.group.getObjectByName('Dongho Bridge photo-based 8-module central peaked railway truss');
assert.ok(donghoTruss instanceof THREE.Mesh, 'Dongho uses the photographed repeating peaked truss silhouette');
assert.equal(donghoTruss.userData.peakedModuleCount, 8, 'Dongho records eight partial-view modules as a scene approximation');
assert.equal(donghoTruss.userData.placement, 'centralRailway', 'Dongho truss is assigned to the central railway');
assert.deepEqual(donghoTruss.userData.peakSupportIndices, [0, 2, 4, 6, 8, 10, 12, 14], 'Dongho modeled peaks align with alternating modeled support stations');
const donghoPiers = bridges.group.getObjectByName('Dongho Bridge sourced pier rhythm');
const donghoPierCaps = bridges.group.getObjectByName('Dongho Bridge concrete transverse pier caps');
assert.ok(donghoPiers instanceof THREE.InstancedMesh && donghoPiers.count === 16);
assert.ok(donghoPierCaps instanceof THREE.InstancedMesh && donghoPierCaps.count === 16, 'Dongho piers carry modest concrete transverse caps');
for (const [peakIndex, supportIndex] of donghoTruss.userData.peakSupportIndices.entries()) {
  donghoPiers.getMatrixAt(supportIndex, supportMatrix);
  const supportZ = new THREE.Vector3().setFromMatrixPosition(supportMatrix).z;
  assert.ok(Math.abs(supportZ - donghoTruss.userData.peakLocalZ[peakIndex]) < 0.01, `Dongho peak ${peakIndex + 1} aligns to modeled support ${supportIndex}`);
}
donghoTruss.geometry.computeBoundingBox();
const donghoTrussBounds = donghoTruss.geometry.boundingBox;
assert.ok(donghoTrussBounds);
assert.ok(Math.max(Math.abs(donghoTrussBounds.min.x), Math.abs(donghoTrussBounds.max.x)) < 6, 'Dongho truss flanks the central railway instead of the outer road edges');
assert.ok(donghoTrussBounds.max.y > 16 && donghoTrussBounds.min.y < 1, 'Dongho truss has a pronounced peaked profile above its bottom chords');

const hannamDecks = bridges.group.getObjectByName('Hannam Bridge paired road decks');
const hannamSupports = bridges.group.getObjectByName('Hannam Bridge paired pier rows at 27 support stations');
assert.ok(hannamDecks instanceof THREE.InstancedMesh && hannamDecks.count === 2, 'Hannam reads as two parallel expanded bridge decks');
assert.ok(hannamSupports instanceof THREE.InstancedMesh && hannamSupports.count === 54, 'Hannam uses paired supports across 27 longitudinal stations');
assert.equal(hannamDecks.userData.deckCount, 2, 'Hannam records two aerial-photo-derived deck ribbons');
assert.equal(hannamSupports.userData.longitudinalStations, 27, 'Hannam preserves the official 27-pier longitudinal rhythm');
assert.equal(hannamSupports.userData.rowCount, 2, 'Hannam support instances are paired under the two deck ribbons');
const leftDeckMatrix = new THREE.Matrix4();
const rightDeckMatrix = new THREE.Matrix4();
hannamDecks.getMatrixAt(0, leftDeckMatrix);
hannamDecks.getMatrixAt(1, rightDeckMatrix);
assert.ok(new THREE.Vector3().setFromMatrixPosition(leftDeckMatrix).x < 0, 'Hannam first deck occupies one side of the centre gap');
assert.ok(new THREE.Vector3().setFromMatrixPosition(rightDeckMatrix).x > 0, 'Hannam second deck occupies the opposite side of the centre gap');

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

assert.ok(dongjakPiers.material instanceof THREE.MeshStandardMaterial);
assert.ok(dongjakPierCaps.material instanceof THREE.MeshStandardMaterial);
assert.ok(donghoPiers.material instanceof THREE.MeshStandardMaterial);
assert.ok(donghoPierCaps.material instanceof THREE.MeshStandardMaterial);
for (const concretePart of [dongjakPiers, dongjakPierCaps, donghoPiers, donghoPierCaps]) {
  assert.equal(concretePart.material.emissive.getHex(), 0, `${concretePart.name} remains nonemissive at night`);
}
assert.notEqual(dongjakPiers.material, dongjakArches.material, 'Dongjak concrete and blue steel use distinct materials');
assert.notEqual(donghoPiers.material, donghoTruss.material, 'Dongho concrete and orange steel use distinct materials');

const dongjakSteel = dongjakArches;
const donghoSteel = donghoTruss;
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
console.log(`Banpo bridge scenarios passed: Dongjak 13 central tied-arch bays, Dongho 8 central peaked modules, Hannam 2 decks/54 columns; geography, night lighting, traffic, disposal; ${renderedTriangles} triangles, ${drawCalls} draw calls`);
