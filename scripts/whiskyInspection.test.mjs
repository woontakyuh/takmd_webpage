import { describe, expect, test } from 'bun:test';
import { Group, PerspectiveCamera, Vector3 } from 'three';
import { WHISKY_BOTTLES } from '../src/components/studio/scene/WhiskyBottleSpecs';
import { advanceWhiskyProgress, applyWhiskyPresentation, resolveWhiskyBottleClearance, whiskyCabinetPose, whiskyInspectionPose, whiskyPresentationPath } from '../src/components/studio/scene/WhiskyInspectionMotion';
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
  for (const [width, height] of [[1440, 1000], [1280, 800], [768, 1024], [375, 812], [812, 375]]) {
    for (const inspecting of [false, true]) {
      test(`frames the full open cabinet at ${width}x${height} with inspector ${inspecting}`, () => {
        // Given: the cabinet's transformed open envelope, including its controls.
        const { cabinet } = openingHierarchy();
        const narrow = width < 760;
        const viewport = { width, height };
        // When: the fitted camera is applied to a real perspective projection.
        const pose = inspecting ? whiskyInspectionPose(cabinet, viewport) : whiskyCabinetPose(cabinet, viewport);
        const camera = new PerspectiveCamera(width < height ? 60 : 42, width / height, 0.015, 60);
        camera.position.set(...pose.position); camera.lookAt(new Vector3(...pose.target)); camera.updateMatrixWorld();
        const projected = [];
        for (const x of [-0.355, 0.61]) for (const y of [narrow ? -0.18 : 0.02, narrow ? 1.18 : 1.31]) for (const z of [-0.735, 0.255]) {
          const point = cabinet.localToWorld(new Vector3(x, y, z)).project(camera);
          projected.push({ x: (point.x + 1) * width / 2, y: (1 - point.y) * height / 2 });
        }
        // Then: every corner remains inside the region not occupied by the information card.
        expect(Math.min(...projected.map(point => point.x))).toBeGreaterThanOrEqual(16);
        expect(Math.max(...projected.map(point => point.x))).toBeLessThanOrEqual(width - (inspecting && !narrow ? 340 : 16));
        expect(Math.min(...projected.map(point => point.y))).toBeGreaterThanOrEqual(16);
        expect(Math.max(...projected.map(point => point.y))).toBeLessThanOrEqual(height - (inspecting && narrow ? height * 0.4 + 16 : 16));
      });
    }
  }
});

describe('concurrent physical bottle exchange', () => {
  const first = WHISKY_BOTTLES[0].image;
  const next = WHISKY_BOTTLES[4].image;
  test('starts the next bottle while the current bottle returns', () => {
    // Given: a bottle is already presented.
    const current = selectWhiskyBottle(null, first);
    // When: another physical bottle is selected.
    const switching = selectWhiskyBottle(current, next);
    // Then: the new selection is active without waiting for return completion.
    expect(switching).toEqual({ bottle: next, returning: false, returningBottles: [first], closing: false });
    expect(finishWhiskyReturn(switching, first)).toEqual({ bottle: next, returning: false, returningBottles: [], closing: false });
  });
  test('closing during a switch waits for every moving bottle', () => {
    const switching = selectWhiskyBottle(selectWhiskyBottle(null, first), next);
    const closing = returnWhiskyBottle(switching, true);
    expect(closing).toEqual({ bottle: next, returning: true, returningBottles: [first, next], closing: true });
    expect(finishWhiskyReturn(closing, first)).not.toBeNull();
    expect(finishWhiskyReturn(finishWhiskyReturn(closing, first), next)).toBeNull();
  });
  test('reselecting the returning bottle reverses its return', () => {
    const returning = returnWhiskyBottle(selectWhiskyBottle(null, first), false);
    expect(selectWhiskyBottle(returning, first)).toEqual({ bottle: first, returning: false, returningBottles: [], closing: false });
  });
});


describe('continuous bottle movement', () => {
  test('keeps travelling through the former segment boundaries', () => {
    // Given: the actual presentation route for an upper-shelf bottle.
    const { cabinet, parent } = openingHierarchy();
    const model = new Group();
    const path = whiskyPresentationPath(cabinet, parent, WHISKY_BOTTLES[0].position);
    // When: movement is sampled on either side of every former stop.
    const speeds = [0.25, 0.5, 0.75].map(progress => {
      applyWhiskyPresentation(model, path, progress - 0.0001);
      const before = model.position.clone();
      applyWhiskyPresentation(model, path, progress + 0.0001);
      return before.distanceTo(model.position) / 0.0002;
    });
    // Then: the path never pauses at an internal waypoint.
    expect(Math.min(...speeds)).toBeGreaterThan(0.2);
  });

  test('separates concurrent moving bottles without shifting a shelf bottle', () => {
    // Given: two trajectories pass close to a stationary shelf bottle.
    const shelf = { position: new Vector3(0, 0.12, 0), radius: 0.06, height: 0.35, moving: false };
    const returning = { position: new Vector3(0.08, 0.14, 0), radius: 0.05, height: 0.34, moving: true };
    const arriving = { position: new Vector3(0.14, 0.2, 0), radius: 0.05, height: 0.35, moving: true };
    // When: one frame resolves shared physical clearance.
    resolveWhiskyBottleClearance([shelf, returning, arriving]);
    // Then: physical bodies remain apart and the shelf slot is untouched.
    expect(shelf.position.toArray()).toEqual([0, 0.12, 0]);
    expect(shelf.position.distanceTo(returning.position)).toBeGreaterThanOrEqual(0.1139);
    expect(returning.position.distanceTo(arriving.position)).toBeGreaterThanOrEqual(0.1039);
  });

  test('ignores an old return completion after that bottle is reselected', () => {
    // Given: first returns while next is active, then first is selected again.
    const switching = selectWhiskyBottle(selectWhiskyBottle(null, WHISKY_BOTTLES[0].image), WHISKY_BOTTLES[1].image);
    const reselected = selectWhiskyBottle(switching, WHISKY_BOTTLES[0].image);
    // When: a stale return callback arrives for the active bottle.
    const finished = finishWhiskyReturn(reselected, WHISKY_BOTTLES[0].image);
    // Then: the active selection and the other return are preserved.
    expect(finished).toEqual(reselected);
  });
});


describe('interrupted presentation timing', () => {
  test('preserves velocity when a moving bottle is reselected', () => {
    // Given: a bottle is returning at a known point and velocity.
    const returning = { progress: 0.6, velocity: -0.5 };
    // When: the direction changes for one sixty-Hz frame.
    const next = advanceWhiskyProgress(returning.progress, returning.velocity, true, 1 / 60, false);
    // Then: it decelerates before turning instead of snapping direction or position.
    expect(next.progress).toBeLessThan(returning.progress);
    expect(next.velocity).toBeGreaterThan(returning.velocity);
    expect(next.velocity).toBeLessThan(0);
  });

  test('settles both directions immediately for reduced motion', () => {
    // Given: an interrupted bottle.
    const progress = 0.6;
    // When: reduced-motion movement advances towards either endpoint.
    const endpoints = [false, true].map(presenting => advanceWhiskyProgress(progress, 0.4, presenting, 1 / 60, true));
    // Then: it reaches the exact requested pose without residual velocity.
    expect(endpoints).toEqual([{ progress: 0, velocity: 0 }, { progress: 1, velocity: 0 }]);
  });

  test('keeps all seven physical bottles apart during repeated rapid selections', () => {
    // Given: every bottle at its exact cabinet shelf pose.
    const { cabinet, parent } = openingHierarchy();
    const bottles = WHISKY_BOTTLES.map(bottle => {
      const group = new Group(); parent.add(group);
      group.position.set(...bottle.position);
      return { bottle, group, path: whiskyPresentationPath(cabinet, parent, bottle.position), progress: 0, velocity: 0 };
    });
    const sequence = [0, 1, 4, 2, 6, 3, 5, 0, 4, 6, 1];
    let smallestGap = Infinity;
    let largestStep = 0;
    // When: the active physical bottle changes every third of a second before arrivals settle.
    for (let frame = 0; frame < 330; frame += 1) {
      const selected = sequence[Math.min(sequence.length - 1, Math.floor(frame / 20))];
      const previous = bottles.map(({ group }) => group.position.clone());
      for (const [index, motion] of bottles.entries()) {
        const next = advanceWhiskyProgress(motion.progress, motion.velocity, index === selected, 1 / 60, false);
        Object.assign(motion, next);
        applyWhiskyPresentation(motion.group, motion.path, motion.progress);
      }
      resolveWhiskyBottleClearance(bottles.map(({ bottle, group, progress }) => ({
        position: group.position, radius: bottle.radius, height: bottle.height, moving: progress > 0 && progress < 1,
      })));
      for (const [index, left] of bottles.entries()) {
        largestStep = Math.max(largestStep, left.group.position.distanceTo(previous[index]));
        for (const right of bottles.slice(index + 1)) {
          const a = left.group.position, b = right.group.position;
          const y = Math.max(0, b.y + right.bottle.radius - a.y - left.bottle.height + left.bottle.radius)
            - Math.max(0, a.y + left.bottle.radius - b.y - right.bottle.height + right.bottle.radius);
          smallestGap = Math.min(smallestGap, Math.hypot(a.x - b.x, y, a.z - b.z) - left.bottle.radius - right.bottle.radius);
        }
      }
    }
    // Then: no bodies intersect and there is no visible teleport between frames.
    expect(smallestGap).toBeGreaterThan(0.0038);
    expect(largestStep).toBeLessThan(0.075);
  });
});
