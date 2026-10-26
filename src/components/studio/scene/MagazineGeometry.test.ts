import assert from 'node:assert/strict';
import { magazinePacketLayout, magazineSheetPoint } from './MagazineGeometry.ts';
import { createMagazineLeafGeometry, shapeMagazineLeaf } from './MagazineLeafGeometry';

const dimensions = { width: .21, height: .297, thickness: .006 };

// Given a thin magazine with two photographed spreads, when packets are allocated,
// then every paper layer and both soft covers retain the original total thickness.
const layout = magazinePacketLayout(dimensions, [{ leftLeaves: 3 }, { leftLeaves: 26 }]);
assert.ok(Math.abs(layout.packets.reduce((sum, packet) => sum + packet.depth, 0)
  + layout.remainingDepth + layout.coverThickness - dimensions.thickness) < 1e-12);
for (const packet of layout.packets) {
  assert.ok(packet.depth > 0);
  assert.ok(packet.startZ - packet.depth / 2 >= -dimensions.thickness / 2);
  assert.ok(packet.endZ - packet.depth / 2 >= -dimensions.thickness / 2);
}
const sparseLayout = magazinePacketLayout(dimensions, [{ leftLeaves: 26 }, { leftLeaves: 2 }]);
assert.ok(sparseLayout.packets.every(packet => packet.depth > 0));

// Given either end of the turn, when a paper point is sampled,
// then it lies on the correct side with no residual lift or spine drift.
for (const progress of [0, 1]) {
  const spine = magazineSheetPoint({ distance: 0, width: dimensions.width, progress });
  const tip = magazineSheetPoint({ distance: dimensions.width, width: dimensions.width, progress });
  assert.ok(Math.abs(spine.x) + Math.abs(spine.z) < 1e-12);
  assert.ok(Math.abs(tip.x - dimensions.width * (progress ? -1 : 1)) < 1e-12);
  assert.ok(Math.abs(tip.z) < 1e-12);
}

// Given the middle of a turn, when the sheet is sampled along its width,
// then it visibly curves while preserving physical paper length and bounded lift.
const points = Array.from({ length: 1001 }, (_, index) => magazineSheetPoint({
  distance: dimensions.width * index / 1000, width: dimensions.width, progress: .5,
}));
const length = points.reduce((total, point, index) => {
  const previous = points[index - 1];
  return previous ? total + Math.hypot(point.x - previous.x, point.z - previous.z) : total;
}, 0);
assert.ok(Math.abs(length - dimensions.width) < 1e-6);
assert.ok(Math.min(...points.map(point => point.x)) < -.02);
assert.ok(points.every(point => point.z >= 0 && point.z <= dimensions.width));

const givenFront = { src: '/front.webp', quad: [[.1, .2], [.8, .2], [.8, .9], [.1, .9]] } as const;
const givenBack = { src: '/back.webp', quad: [[.2, .1], [.9, .1], [.9, .8], [.2, .8]] } as const;
const givenShape = { width: dimensions.width, height: dimensions.height, depth: .001, startZ: .003, endZ: .001 };
const { geometry, flat } = createMagazineLeafGeometry(givenShape, { front: givenFront, back: givenBack });
const normals = geometry.getAttribute('normal');
const uv = geometry.getAttribute('uv');
let verifiedCorners = 0;
for (let index = 0; index < flat.count; index += 1) {
  if (Math.abs(flat.getY(index) - dimensions.height / 2) > 1e-6
    || Math.abs(normals.getZ(index)) < .9) continue;
  const atSpine = Math.abs(flat.getX(index)) < 1e-6;
  const atEdge = Math.abs(flat.getX(index) - dimensions.width) < 1e-6;
  if (!atSpine && !atEdge) continue;
  const expectedU = normals.getZ(index) > 0 ? atSpine ? .1 : .8 : atSpine ? .9 : .2;
  assert.ok(Math.abs(uv.getX(index) - expectedU) < 1e-6);
  verifiedCorners += 1;
}
assert.equal(verifiedCorners, 4);
const originalUv = uv.array.slice();
const backIndices = Array.from({ length: flat.count }, (_, index) => index).filter(index => normals.getZ(index) < -.9);
shapeMagazineLeaf(geometry, flat, { ...givenShape, progress: 1 });
assert.deepEqual(uv.array, originalUv);
assert.ok(backIndices.every(index => geometry.getAttribute('normal').getZ(index) > .999));
geometry.dispose();
console.log('Magazine thickness, curved arc length, bounds, original UVs and readable reverse faces passed.');
