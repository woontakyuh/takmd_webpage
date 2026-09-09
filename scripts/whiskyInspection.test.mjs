import { describe, expect, test } from 'bun:test';
import { Group, Vector3 } from 'three';
import { WHISKY_BOTTLES } from '../src/components/studio/scene/WhiskyBottleSpecs';
import { applyWhiskyPresentation, whiskyInspectionPose, whiskyPresentationPath } from '../src/components/studio/scene/WhiskyInspectionMotion';
import { finishWhiskyReturn, returnWhiskyBottle, selectWhiskyBottle } from '../src/components/studio/scene/WhiskyInspectionState';

function openingHierarchy() {
  const cabinet = new Group();
  cabinet.position.set(-0.4, 0.0185, 1.1);
  cabinet.rotation.y = 0.37;
  const door = new Group();
  door.position.x = 0.355;
  door.rotation.y = -Math.PI / 2;
  const mirror = new Group();
  mirror.scale.x = -1;
  const half = new Group();
  half.position.set(0.355, 0, -0.1275);
  const unmirror = new Group();
  unmirror.scale.x = -1;
  const parent = new Group();
  cabinet.add(door); door.add(mirror); mirror.add(half); half.add(unmirror); unmirror.add(parent);
  return { cabinet, parent };
}

describe('physical whisky presentation', () => {
  for (const bottle of WHISKY_BOTTLES) {
    test(`places ${bottle.name} on the worktop after a furniture rotation`, () => {
      const { cabinet, parent } = openingHierarchy();
      const model = new Group();
      parent.add(model);
      const path = whiskyPresentationPath(cabinet, parent, bottle.position);
      applyWhiskyPresentation(model, path, 1);
      const position = cabinet.worldToLocal(model.getWorldPosition(new Vector3()));
      expect(position.toArray()).toEqual([expect.closeTo(0, 6), expect.closeTo(0.634, 6), expect.closeTo(-0.205, 6)]);
      const facing = model.getWorldDirection(new Vector3());
      const front = new Vector3(0, 0, -1).transformDirection(cabinet.matrixWorld);
      expect(facing.dot(front)).toBeCloseTo(1, 6);
    });
    test(`returns ${bottle.name} to its exact slot`, () => {
      const { cabinet, parent } = openingHierarchy();
      const model = new Group();
      parent.add(model);
      const path = whiskyPresentationPath(cabinet, parent, bottle.position);
      applyWhiskyPresentation(model, path, 1);
      applyWhiskyPresentation(model, path, 0);
      expect(model.position.toArray()).toEqual([...bottle.position]);
      expect(model.quaternion.toArray()).toEqual([0, 0, 0, 1]);
    });
  }
  test('moves the inspection camera with the actual cabinet transform', () => {
    const { cabinet } = openingHierarchy();
    const pose = whiskyInspectionPose(cabinet, false);
    const local = cabinet.worldToLocal(new Vector3(...pose.position));
    expect(local.toArray()).toEqual([expect.closeTo(0.03, 6), expect.closeTo(1.13, 6), expect.closeTo(-1.10, 6)]);
  });
});

describe('one bottle at a time', () => {
  const first = WHISKY_BOTTLES[0].image;
  const next = WHISKY_BOTTLES[4].image;
  test('returns the current bottle before starting the next bottle', () => {
    const current = selectWhiskyBottle(null, first);
    const switching = selectWhiskyBottle(current, next);
    expect(switching).toEqual({ bottle: first, returning: true, next, closing: false });
    expect(finishWhiskyReturn(switching)).toEqual({ bottle: next, returning: false, next: null, closing: false });
  });
  test('closing during a switch cancels the next selection', () => {
    const switching = selectWhiskyBottle(selectWhiskyBottle(null, first), next);
    const closing = returnWhiskyBottle(switching, true);
    expect(closing).toEqual({ bottle: first, returning: true, next: null, closing: true });
    expect(finishWhiskyReturn(closing)).toBeNull();
  });
  test('reselecting the returning bottle reverses its return', () => {
    const returning = returnWhiskyBottle(selectWhiskyBottle(null, first), false);
    expect(selectWhiskyBottle(returning, first)).toEqual({ bottle: first, returning: false, next: null, closing: false });
  });
});
