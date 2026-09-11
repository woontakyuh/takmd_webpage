import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { act, createElement as h } from 'react';
import { createRoot, extend } from '@react-three/fiber';
import * as THREE from 'three';
import { Group, PerspectiveCamera, Raycaster, Scene, Vector3 } from 'three';
import { FOCUS, MOBILE_FOCUS, MONITOR, ROOM, SIDE_READER_SPACE, focusFov } from '../src/components/studio/scene/config';
import { folioReadingPanelLeft } from '../src/components/studio/scene/folioFocus';
import { MONITOR_SCREEN } from '../src/components/studio/scene/monitorReading';
import { MonitorArm } from '../src/components/studio/scene/MonitorArm';
import { Block } from '../src/components/studio/scene/Primitives';
import { M4_MAC_MINI } from '../src/components/studio/scene/MacMini';

const elevation = pose => {
  const delta = pose.position.map((value, index) => value - pose.target[index]);
  return Math.atan2(delta[1], Math.hypot(delta[0], delta[2])) * 180 / Math.PI;
};
const distance = pose => Math.hypot(...pose.position.map((value, index) => value - pose.target[index]));

const scene = new Scene();
let root;
beforeAll(async () => {
  // Mount the production arm and rounded housing in the real R3F reconciler, with no WebGL renderer.
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  extend(THREE);
  const noop = () => {};
  const canvas = { width: 1440, height: 900 };
  const renderer = { domElement: canvas, render: () => { throw new Error('CPU geometry test must not render'); },
    setSize: noop, setPixelRatio: noop, xr: { addEventListener: noop, removeEventListener: noop } };
  root = createRoot(canvas);
  await act(async () => {
    await root.configure({ gl: renderer, scene, frameloop: 'never', dpr: 1, size: { width: 1440, height: 900, top: 0, left: 0 } });
    root.render(h('group', { position: ROOM.monitor.position, rotation: [0, ROOM.monitor.rotation, 0] },
      h(MonitorArm),
      h('group', { position: MONITOR_SCREEN.mount, rotation: [MONITOR_SCREEN.tilt, 0, 0] },
        h(Block, { size: [MONITOR.width, MONITOR.height, 0.027], radius: 0.008, color: '#202d2a' }),
        h(Block, { size: [0.3, 0.26, 0.035], position: [0, 0, -0.025], radius: 0.028, color: '#202d2a' }))));
  });
  scene.updateMatrixWorld(true);
});
afterAll(async () => {
  await act(async () => root?.unmount());
  delete globalThis.IS_REACT_ACT_ENVIRONMENT;
});

function deskPoint(x, y, z) {
  return new Vector3(x, y, z).applyAxisAngle(new Vector3(0, 1, 0), ROOM.desk.rotation)
    .add(new Vector3(...ROOM.desk.position));
}

function blockedTopPoints(pose) {
  const eye = new Vector3(...pose.position);
  const blocked = [];
  const sightline = (point, label) => {
    const direction = point.clone().sub(eye);
    const hits = new Raycaster(eye, direction.clone().normalize(), 0.001, direction.length()).intersectObject(scene, true);
    if (hits.length > 0) blocked.push(label);
  };
  for (let x = -4; x <= 4; x++) for (let z = -4; z <= 4; z++) {
    sightline(deskPoint(ROOM.macMini.position[0] + x * M4_MAC_MINI.size[0] / 8,
      ROOM.macMini.position[1] + M4_MAC_MINI.size[1] + 0.0001,
      ROOM.macMini.position[2] + z * M4_MAC_MINI.size[2] / 8), `mini ${x},${z}`);
  }
  for (let x = -4; x <= 4; x++) for (let z = -4; z <= 4; z++) {
    if (x * x + z * z > 16) continue;
    sightline(deskPoint(ROOM.macMini.position[0] + 0.13 + x * 0.034 / 4,
      0.0185 + ROOM.desk.height + 0.033 - z * 0.034 / 4 * Math.tan(Math.PI / 18),
      ROOM.macMini.position[2] + z * 0.034 / 4), `dial ${x},${z}`);
  }
  return blocked;
}

describe('object reading camera composition', () => {
  test('the physical monitor fixture catches the previously missed rear-housing occlusion', () => {
    let meshes = 0;
    scene.traverse(object => { if (object.isMesh) meshes += 1; });
    expect(meshes).toBeGreaterThan(30);
    expect(blockedTopPoints({ position: [0.45998057, 1.56181426, -1.06419503] }).length).toBeGreaterThan(0);
  });
  for (const [name, pose] of [['desktop', FOCUS.projects], ['mobile', MOBILE_FOCUS.projects]]) {
    test(`Given the production monitor and arm, when viewing the Mac mini on ${name}, then its full top and Halo remain visible from the front`, () => {
      const screenNormal = new Vector3(0, -Math.sin(MONITOR_SCREEN.tilt), Math.cos(MONITOR_SCREEN.tilt))
        .applyAxisAngle(new Vector3(0, 1, 0), ROOM.monitor.rotation);
      const toEye = new Vector3(...pose.position).sub(new Vector3(...ROOM.monitor.position));
      expect(toEye.dot(screenNormal)).toBeGreaterThan(0.1);
      expect(blockedTopPoints(pose)).toEqual([]);
    });
  }
  test('Given the approved large folio, when entering desktop research, then its camera becomes more top-down at the same distance', () => {
    // Given / When
    const pose = FOCUS.research;
    // Then
    expect(elevation(pose)).toBeCloseTo(62, 2);
    expect(distance(pose)).toBeCloseTo(.66618256, 5);
  });
  test('Given a mobile folio reader, when entering research, then the steeper view preserves its large-paper distance', () => {
    // Given / When
    const pose = MOBILE_FOCUS.research;
    // Then
    expect(elevation(pose)).toBeCloseTo(74, 2);
    expect(distance(pose)).toBeCloseTo(.82921536, 5);
  });
  test('Given the Mac mini, when approaching projects, then its camera moves closer and shows more of its top', () => {
    // Given / When
    const pose = FOCUS.projects;
    // Then
    expect(elevation(pose)).toBeCloseTo(44, 2);
    expect(distance(pose)).toBeCloseTo(.91169187, 6);
    expect(distance(MOBILE_FOCUS.projects)).toBeCloseTo(1.37800310, 6);
  });
  for (const viewport of [{ width: 1916, height: 957 }, { width: 1440, height: 900 }, { width: 1024, height: 768 }]) {
    test(`Given ${viewport.width}px research viewing, when its panel is placed, then it sits beside the actual projected folio and remains on screen`, () => {
      // Given
      const { width, height } = viewport;
      const camera = new PerspectiveCamera(focusFov('research', false, width, height), width / height, .02, 80);
      camera.position.set(...FOCUS.research.position);
      camera.lookAt(new Vector3(...FOCUS.research.target));
      camera.setViewOffset(width, height, SIDE_READER_SPACE / 2, 0, width, height);
      camera.updateMatrixWorld(true);
      const book = new Group();
      book.position.set(...ROOM.folio.position);
      book.rotation.y = ROOM.folio.rotation;
      book.scale.setScalar(.3);
      book.updateMatrixWorld(true);
      const projected = [-.515, .515].flatMap(x => [-.68, .68].map(z => book.localToWorld(new Vector3(x, .06, z)).project(camera)));
      const right = Math.max(...projected.map(point => (point.x + 1) * width / 2));
      // When
      const left = folioReadingPanelLeft(width, height);
      // Then
      expect(left).toBeCloseTo(Math.min(width - 438, right + 24), 3);
      expect(left + 420).toBeLessThanOrEqual(width - 18);
    });
  }
  test('Given a portrait phone, when the folio panel is positioned, then its existing bottom reader remains in control', () => {
    // Given / When / Then
    expect(folioReadingPanelLeft(360, 800)).toBeUndefined();
  });
});
