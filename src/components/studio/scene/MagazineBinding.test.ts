import assert from 'node:assert/strict';
import { magazineLeafPoint, magazineLeafPose } from './MagazineLeafGeometry';
import { magazinePacketLayout } from './MagazineGeometry';

const dimensions = { width: .207, height: .27, thickness: .006 };
const layout = magazinePacketLayout(dimensions, [{ leftLeaves: 2 }, { leftLeaves: 26 }]);

// Given adjacent bound paper packets, when both rest on the left,
// then the upper face of the lower packet supports its neighbour without a cavity.
const [coverPacket, paperPacket] = layout.packets;
const leftPose = magazineLeafPose(2, 0);
for (const u of [.2, .4, .7, .95]) {
  const distance = dimensions.width * u;
  const lower = magazineLeafPoint(distance, -coverPacket.depth / 2,
    { ...dimensions, ...coverPacket, ...leftPose });
  const upper = magazineLeafPoint(distance, paperPacket.depth / 2,
    { ...dimensions, width: dimensions.width - .001, ...paperPacket, ...leftPose });
  assert.ok(Math.hypot(lower.x - upper.x, lower.z - upper.z) < .0006,
    'neighbouring packets must retain sub-millimetre support across the leaf');
}

// Given a settled magazine leaf, when sampled away from the gutter,
// then its full-width crown remains visible instead of becoming a planar board.
const open = magazineLeafPose(2, 0);
const paperShape = { ...dimensions, depth: .001, startZ: 0, endZ: 0 };
const curled = magazineLeafPoint(dimensions.width * .65, 0, { ...paperShape, ...open, progress: 0 });
const planar = magazineLeafPoint(dimensions.width * .65, 0, { ...paperShape, ...open, progress: 0, arch: 0 });
assert.ok(curled.z - planar.z > .005, 'the outer half of the leaf retains a continuous crown');
console.log('Magazine paper support and open-cover posture passed.');
