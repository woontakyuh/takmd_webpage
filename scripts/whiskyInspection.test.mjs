import { describe, expect, test } from 'bun:test';
import { Box3, Group, PerspectiveCamera, Vector3 } from 'three';
import { WHISKY_BOTTLES } from '../src/components/studio/scene/WhiskyBottleSpecs';
import { focusFov, ROOM } from '../src/components/studio/scene/config';
import { WHISKY_CABINET } from '../src/components/studio/scene/WhiskyCabinetLayout';
import { advanceWhiskyProgress, applyWhiskyPresentation, resolveWhiskyBottleClearance, whiskyCabinetPose, whiskyInspectionLayout, whiskyInspectionPose, whiskyPresentationPath } from '../src/components/studio/scene/WhiskyInspectionMotion';
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

function physicalCabinetCorners(angle) {
  // Case, side strap, opened lower window doors, and worktop are independently measured here.
  const points = [];
  for (const x of [-.355, .355]) for (const y of [.004, 1.17]) for (const z of [0, .255]) points.push(new Vector3(x, y, z));
  for (const x of [-.405, -.355]) for (const y of [.3, .915]) for (const z of [0, .093]) points.push(new Vector3(x, y, z));
  for (const part of [
    { x: [-.71, 0], y: [.004, 1.17], z: [-.255, 0] },
    { x: [-.682, -.028], y: [.068, .478], z: [-.017, .301] },
  ]) for (const x of part.x) for (const y of part.y) for (const z of part.z) {
    points.push(new Vector3(x, y, z).applyAxisAngle(new Vector3(0, 1, 0), angle).add(new Vector3(.355, 0, 0)));
  }
  for (const x of [-.31, .31]) for (const y of [.648, .666]) for (const z of [-.32, 0]) points.push(new Vector3(x, y, z));
  return points;
}

function physicalOpeningPanels() {
  return [
    [[-.32, .067, -.11], [.32, .085, .11]],
    [[-.32, .478, -.11], [.32, .49, .11]],
    [[-.32, .654, -.11], [.32, .666, .11]],
    [[-.32, .979, -.11], [.32, .991, .11]],
    [[-.304, .6852, .1317], [.304, .6888, .1353]],
    [[-.304, 1.0102, .1317], [.304, 1.0138, .1353]],
    [[-.355, 1.145, -.1275], [.355, 1.17, .1275]],
    [[-.327, .0688, .1108], [-.311, .4762, .428]],
    [[.311, .0688, .1108], [.327, .4762, .428]],
  ].map(([min, max]) => new Box3(new Vector3(...min), new Vector3(...max)));
}

describe('physical whisky presentation', () => {
  for (const bottle of WHISKY_BOTTLES) {
    test(`places ${bottle.name} on the worktop after a furniture rotation`, () => {
      const { cabinet, parent } = openingHierarchy();
      const model = new Group();
      parent.add(model);
      const path = whiskyPresentationPath(cabinet, parent, bottle);
      applyWhiskyPresentation(model, path, 1);
      const position = cabinet.worldToLocal(model.getWorldPosition(new Vector3()));
      expect(position.toArray()).toEqual([expect.closeTo(0, 6), expect.closeTo(0.666, 6), expect.closeTo(-0.205, 6)]);
      const facing = model.getWorldDirection(new Vector3());
      const front = new Vector3(0, 0, -1).transformDirection(cabinet.matrixWorld);
      expect(facing.dot(front)).toBeCloseTo(1, 6);
    });
    test(`returns ${bottle.name} to its exact slot`, () => {
      const { cabinet, parent } = openingHierarchy();
      const model = new Group();
      parent.add(model);
      const path = whiskyPresentationPath(cabinet, parent, bottle);
      applyWhiskyPresentation(model, path, 1);
      applyWhiskyPresentation(model, path, 0);
      expect(model.position.toArray()).toEqual([...bottle.position]);
      expect(model.quaternion.toArray()).toEqual([0, 0, 0, 1]);
    });
  }
  for (const [width, height] of [[1440, 900], [1280, 800], [768, 1024], [390, 844], [375, 667], [844, 390], [667, 375]]) {
    for (const inspecting of [false, true]) {
      test(`frames the physical cabinet at ${width}x${height} with inspector ${inspecting}`, () => {
        // Given: actual shell, feet, carry-handle and worktop corners, with no removed text-label volume.
        const { cabinet } = openingHierarchy();
        const narrow = width < 760;
        const viewport = { width, height };
        // When: the fitted camera is applied to a real perspective projection.
        const pose = inspecting ? whiskyInspectionPose(cabinet, viewport) : whiskyCabinetPose(cabinet, viewport);
        const camera = new PerspectiveCamera(focusFov(null, narrow, width, height), width / height, 0.015, 60);
        camera.position.set(...pose.position); camera.lookAt(new Vector3(...pose.target)); camera.updateMatrixWorld();
        const projected = [];
        const angles = inspecting ? [-Math.PI / 2] : Array.from({ length: 91 }, (_, degree) => -degree * Math.PI / 180);
        for (const angle of angles) for (const corner of physicalCabinetCorners(angle)) {
          const point = cabinet.localToWorld(corner).project(camera);
          projected.push({ x: (point.x + 1) * width / 2, y: (1 - point.y) * height / 2 });
        }
        // Then: every physical corner, including the complete opening sweep, stays in view.
        const stacked = width < 960 && height >= width;
        const panelWidth = Math.min(300, width * .36);
        expect(Math.min(...projected.map(point => point.x))).toBeGreaterThanOrEqual(inspecting && !stacked ? panelWidth + 32 + 16 : 16);
        expect(Math.max(...projected.map(point => point.x))).toBeLessThanOrEqual(width - 16);
        expect(Math.min(...projected.map(point => point.y))).toBeGreaterThanOrEqual(16);
        expect(Math.max(...projected.map(point => point.y))).toBeLessThanOrEqual(height - (inspecting && stacked ? 160 + 32 + 16 : 16));
      });
    }
  }
});

describe('whisky caption background clearance', () => {
  for (const [width, height] of [[1440, 900], [1280, 800], [390, 844], [375, 667]]) {
    test(`keeps the caption clear of the guitar at ${width}x${height}`, () => {
      // Given the real room positions and the full guitar/stand envelope.
      const cabinet = new Group();
      cabinet.position.set(...WHISKY_CABINET.center); cabinet.rotation.y = WHISKY_CABINET.rotation;
      const guitar = new Group();
      guitar.position.set(...ROOM.music.position); guitar.rotation.y = ROOM.music.rotation;
      guitar.updateMatrixWorld();
      const viewport = { width, height };
      // When the selected-bottle camera frames the room.
      const pose = whiskyInspectionPose(cabinet, viewport);
      const camera = new PerspectiveCamera(focusFov(null, width < 760, width, height), width / height, .015, 60);
      camera.position.set(...pose.position); camera.lookAt(...pose.target); camera.updateMatrixWorld();
      const points = [];
      for (const x of [-.576, -.196]) for (const y of [0, 1.112]) for (const z of [-.13, .16]) {
        const point = guitar.localToWorld(new Vector3(x, y, z)).project(camera);
        points.push({ x: (point.x + 1) * width / 2, y: (1 - point.y) * height / 2 });
      }
      const layout = whiskyInspectionLayout(viewport);
      // Then desktop text has a clear side, and mobile text begins below the guitar.
      expect(layout.stacked ? layout.panel.top >= Math.max(...points.map(point => point.y))
        : layout.panel.left + layout.panel.width < Math.min(...points.map(point => point.x))).toBe(true);
    });
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
    const path = whiskyPresentationPath(cabinet, parent, WHISKY_BOTTLES[0]);
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
      return { bottle, group, path: whiskyPresentationPath(cabinet, parent, bottle), progress: 0, velocity: 0 };
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
      resolveWhiskyBottleClearance(bottles.map(({ bottle, group, progress, path }) => ({
        position: group.position, radius: bottle.radius, height: bottle.height, moving: progress > 0 && progress < 1, obstacles: path.obstacles,
      })));
      for (const [index, left] of bottles.entries()) {
        largestStep = Math.max(largestStep, left.group.position.distanceTo(previous[index]));
        const { x, y, z } = left.group.position;
        for (const box of physicalOpeningPanels()) {
          const gap = Math.hypot(Math.max(box.min.x - x, 0, x - box.max.x), Math.max(box.min.z - z, 0, z - box.max.z));
          const intersects = gap < left.bottle.radius * 1.005 + .00035 - .000001 && y < box.max.y - .000001 && y + left.bottle.height > box.min.y + .000001;
          expect(intersects, `frame ${frame}, ${left.bottle.name}, panel ${box.max.toArray()}`).toBe(false);
        }
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

describe('cabinet shelf clearance', () => {
  test('routes every lower bottle around the unfolded worktop in both directions and during exchanges', () => {
    // Given: the actual worktop and its front underside lip, in cabinet coordinates.
    const { cabinet, parent } = openingHierarchy();
    const obstacles = [
      new Box3(new Vector3(-.31, .648, -.32), new Vector3(.31, .666, 0)),
      new Box3(new Vector3(-.31, .6395, -.319), new Vector3(.31, .6485, -.301)),
    ];
    const bottles = WHISKY_BOTTLES.map(bottle => {
      const group = new Group(); parent.add(group);
      return { bottle, group, path: whiskyPresentationPath(cabinet, parent, bottle), progress: 0, velocity: 0 };
    });
    const check = (motion, context) => {
      const position = cabinet.worldToLocal(parent.localToWorld(motion.group.position.clone()));
      const radius = motion.bottle.radius * 1.005 + .00035;
      for (const box of obstacles) {
        const horizontalGap = Math.hypot(Math.max(box.min.x - position.x, 0, position.x - box.max.x), Math.max(box.min.z - position.z, 0, position.z - box.max.z));
        const overlap = horizontalGap < radius - .000001 && position.y < box.max.y - .000001 && position.y + motion.bottle.height > box.min.y + .000001;
        expect(overlap, `${context}: ${motion.bottle.name} at ${position.toArray()}`).toBe(false);
      }
    };
    // When: each route is traversed, then replaced repeatedly while both bottles move.
    for (const motion of bottles) for (let frame = 0; frame <= 1000; frame++) {
      applyWhiskyPresentation(motion.group, motion.path, frame / 1000);
      check(motion, `route ${frame}`);
    }
    for (const framesPerSelection of [36, 114, 117, 108]) for (let frame = 0; frame < 1200; frame++) {
      const selected = [2, 4, 3, 5, 6, 0, 4, 1, 5][Math.min(8, Math.floor(frame / framesPerSelection))];
      for (const [index, motion] of bottles.entries()) {
        Object.assign(motion, advanceWhiskyProgress(motion.progress, motion.velocity, index === selected, 1 / 60, false));
        applyWhiskyPresentation(motion.group, motion.path, motion.progress);
      }
      resolveWhiskyBottleClearance(bottles.map(({ bottle, group, progress, path }) => ({position: group.position, radius: bottle.radius, height: bottle.height, moving: progress > 0 && progress < 1, obstacles: path.obstacles})));
      // Then: neither the outgoing nor returning bottle passes through the worktop.
      for (const motion of bottles) check(motion, `exchange ${frame}`);
    }
  });
  for (const bottle of WHISKY_BOTTLES) {
    test(`clears shelf volumes in both directions for ${bottle.name}`, () => {
      // Given: actual moving-half shelf and top-panel bounds in bottle-parent coordinates.
      const { cabinet, parent } = openingHierarchy();
      const model = new Group();
      const path = whiskyPresentationPath(cabinet, parent, bottle);
      const shelves = physicalOpeningPanels();
      const radius = bottle.radius * 1.005 + 0.00035;
      // When: the upright bottle envelope traverses the route and its exact reverse.
      for (const direction of [1, -1]) for (let sample = 0; sample <= 1000; sample += 1) {
        const progress = direction === 1 ? sample / 1000 : 1 - sample / 1000;
        applyWhiskyPresentation(model, path, progress);
        const { x, y, z } = model.position;
        // Then: no cylindrical bottle envelope penetrates a shelf, including between waypoints.
        for (const shelf of shelves) {
          const horizontalGap = Math.hypot(Math.max(shelf.min.x - x, 0, x - shelf.max.x), Math.max(shelf.min.z - z, 0, z - shelf.max.z));
          const overlaps = horizontalGap < radius - 0.000001 && y < shelf.max.y - 0.000001 && y + bottle.height > shelf.min.y + 0.000001;
          expect(overlaps, `${bottle.name}, progress ${progress}, panel ${shelf.max.toArray()}, position ${model.position.toArray()}`).toBe(false);
        }
        if (bottle.position[1] === 0.085 && z < 0.428 + radius) {
          expect(y).toBeCloseTo(0.085, 6);
        }
      }
    });
  }
});
