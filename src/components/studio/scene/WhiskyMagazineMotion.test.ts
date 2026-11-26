import assert from 'node:assert/strict';
import { Box3, Euler, Group, Matrix4, Vector3 } from 'three';
import { EDBM_MAGAZINE } from '../edbmArchive';
import { isidoroOpeningObstacles } from './IsidoroCollisionGeometry';
import { WHISKY_BOTTLES } from './WhiskyBottleSpecs';
import { ISIDORO_DIMENSIONS, ISIDORO_OPEN_ANGLE, ISIDORO_SHELF_THICKNESS,
  ISIDORO_BOTTLE_SHELF_HEIGHT, ISIDORO_UPPER_SHELF_HEIGHT, ISIDORO_WORKTOP_TOP } from './WhiskyCabinetLayout';
import { MAGAZINE_READING, MAGAZINE_REST, whiskyMagazineTransform } from './WhiskyMagazineMotion';

const width = EDBM_MAGAZINE.width, height = EDBM_MAGAZINE.height, depth = EDBM_MAGAZINE.thickness;
const halfDepth = ISIDORO_DIMENSIONS.depth / 2;
const panel = .025;
const outsideZ = -(halfDepth / 2 - panel / 2);
const liningFront = outsideZ + .019 + .006;
const shelfTop = ISIDORO_BOTTLE_SHELF_HEIGHT + ISIDORO_SHELF_THICKNESS / 2;
const upperUnderside = ISIDORO_UPPER_SHELF_HEIGHT - ISIDORO_SHELF_THICKNESS / 2;
const railTop = ISIDORO_BOTTLE_SHELF_HEIGHT + .027 + .0018;

// Given the actual Door -> outer mirror -> OpeningHalf -> label mirror hierarchy,
// when its mobile half is fully open, then magazine axes are unmirrored in cabinet space.
const cabinet = new Group();
const door = new Group();
door.position.x = ISIDORO_DIMENSIONS.width / 2;
door.rotation.y = -ISIDORO_OPEN_ANGLE;
cabinet.add(door);
const outerMirror = new Group();
outerMirror.scale.x = -1;
door.add(outerMirror);
const shell = new Group();
shell.position.set(ISIDORO_DIMENSIONS.width / 2, 0, -halfDepth / 2);
outerMirror.add(shell);
const collection = new Group();
collection.scale.x = -1;
shell.add(collection);
cabinet.updateMatrixWorld(true);
assert.ok(Math.abs(collection.matrixWorld.determinant() - 1) < 1e-12);
const expectedOrigin = new Vector3(.4825, 0, -.355);
assert.ok(collection.getWorldPosition(new Vector3()).distanceTo(expectedOrigin) < 1e-12);
assert.ok(new Vector3(0, 0, 1).transformDirection(collection.matrixWorld).distanceTo(new Vector3(-1, 0, 0)) < 1e-12);
const collectionToShell = new Matrix4().copy(shell.matrixWorld).invert().multiply(collection.matrixWorld);
const cabinetToShell = new Matrix4().copy(shell.matrixWorld).invert();
assert.ok(new Vector3(MAGAZINE_REST.x, 0, 0).applyMatrix4(collectionToShell).x < 0);
assert.ok(new Vector3(WHISKY_BOTTLES[0].position[0], 0, 0).applyMatrix4(collectionToShell).x > 0);

const obstacles = [
  ...isidoroOpeningObstacles().map((box, index) => ({ name: `shelf or hardware ${index}`, box })),
  { name: 'fixed half envelope', box: new Box3(new Vector3(-.355, .035, 0),
    new Vector3(.355, ISIDORO_DIMENSIONS.height, halfDepth)).applyMatrix4(cabinetToShell) },
  { name: 'deployed worktop', box: new Box3(new Vector3(-.31, ISIDORO_WORKTOP_TOP - .018, -.32),
    new Vector3(.31, ISIDORO_WORKTOP_TOP, 0)).applyMatrix4(cabinetToShell) },
  { name: 'leather back', box: new Box3(new Vector3(-.355, .03, outsideZ - panel / 2),
    new Vector3(.355, 1.16, outsideZ + panel / 2)) },
  { name: 'fabric back lining', box: new Box3(new Vector3(-.3275, .0525, liningFront - .012),
    new Vector3(.3275, 1.1275, liningFront)) },
  ...[-1, 1].map(side => ({ name: `side wall ${side}`, box: new Box3(
    new Vector3(side > 0 ? .33 : -.355, .045, -halfDepth / 2),
    new Vector3(side > 0 ? .355 : -.33, 1.145, halfDepth / 2)) })),
  ...WHISKY_BOTTLES.map(bottle => ({ name: bottle.name, box: new Box3(
    new Vector3(bottle.position[0] - bottle.radius, bottle.position[1], bottle.position[2] - bottle.radius),
    new Vector3(bottle.position[0] + bottle.radius, bottle.position[1] + bottle.height, bottle.position[2] + bottle.radius),
  ).applyMatrix4(collectionToShell) })),
];

function magazineCorners(progress: number) {
  const pose = whiskyMagazineTransform(progress);
  const transform = new Matrix4().makeRotationFromEuler(new Euler(pose.pitch ?? 0, pose.yaw, 0, 'YXZ'));
  transform.setPosition(pose.x, pose.y, pose.z);
  const corners: Vector3[] = [];
  for (const x of [-width / 2, width / 2]) for (const y of [-height / 2, height / 2]) for (const z of [-depth / 2, depth / 2]) {
    corners.push(new Vector3(x, y, z).applyMatrix4(transform).applyMatrix4(collectionToShell));
  }
  return corners;
}

// Given a stored softcover, its lower edge rests on the shelf and its upper edge leans on the lining.
const restingBounds = new Box3().setFromPoints(magazineCorners(0));
assert.ok(Math.abs(restingBounds.min.y - shelfTop) < .001, 'magazine rests on shelf');
assert.ok(Math.abs(restingBounds.min.z - liningFront) < .001, 'magazine leans against lining');
assert.ok(Math.abs(whiskyMagazineTransform(0).pitch ?? 0) > .1, 'softcover is visibly leaning');

// Given the lift/pull/turn trajectory, when all corners sweep each complete stage,
// then conservative continuous volumes remain disjoint from the actual shell and contents.
const liftSweep = new Box3().setFromPoints([...magazineCorners(0), ...magazineCorners(.18)]);
const pullSweep = new Box3().setFromPoints([...magazineCorners(.18), ...magazineCorners(.62)]);
const radius = Math.hypot(width / 2, depth / 2);
const turnSweep = new Box3(
  new Vector3(Math.min(MAGAZINE_REST.x, MAGAZINE_READING.x) - radius,
    MAGAZINE_READING.y - height / 2, MAGAZINE_READING.z - radius),
  new Vector3(Math.max(MAGAZINE_REST.x, MAGAZINE_READING.x) + radius,
    whiskyMagazineTransform(.62).y + height / 2, MAGAZINE_READING.z + radius),
).applyMatrix4(collectionToShell);
for (const [stage, swept] of [['lift', liftSweep], ['pull', pullSweep], ['turn', turnSweep]] as const) {
  for (const obstacle of obstacles) assert.equal(swept.intersectsBox(obstacle.box), false, `${stage} intersects ${obstacle.name}`);
}
assert.ok(liftSweep.min.y > shelfTop);
assert.ok(pullSweep.min.y > railTop);
assert.ok(Math.max(liftSweep.max.y, pullSweep.max.y, turnSweep.max.y) < upperUnderside);

for (let index = 0; index <= 10000; index += 1) {
  const progress = index / 10000;
  const pose = whiskyMagazineTransform(progress);
  const bounds = progress <= .18 ? liftSweep : progress <= .62 ? pullSweep : turnSweep;
  assert.ok(magazineCorners(progress).every(corner => bounds.containsPoint(corner)));
  if (progress <= .18) assert.equal(pose.z, MAGAZINE_REST.z);
  if (progress <= .62) assert.equal(pose.yaw, MAGAZINE_REST.yaw);
  if (progress >= .62) assert.equal(pose.z, MAGAZINE_READING.z);
}
console.log(JSON.stringify({ checked: 'continuous lift/pull/turn bounds, 80,008 corners, real mirror hierarchy, shared forward/return path',
  liningClearanceMm: (liftSweep.min.z - liningFront) * 1000,
  shelfClearanceMm: (liftSweep.min.y - shelfTop) * 1000,
  railClearanceMm: (pullSweep.min.y - railTop) * 1000,
  upperClearanceMm: (upperUnderside - pullSweep.max.y) * 1000 }));
