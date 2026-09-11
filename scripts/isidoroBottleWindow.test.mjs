import { expect, test } from 'bun:test';
import { BoxGeometry, DoubleSide, Group, Mesh, MeshBasicMaterial, PerspectiveCamera, Raycaster, Vector2 } from 'three';
import { createIsidoroWindowDoorGeometry, createIsidoroWindowRevealGeometry, createIsidoroWindowGlassGeometry,
  ignoreIsidoroWindowRaycast } from '../src/components/studio/scene/IsidoroStorage';
import { createBottleGeometry } from '../src/components/studio/scene/WhiskyBottleGeometry';
import { WHISKY_BOTTLES } from '../src/components/studio/scene/WhiskyBottleSpecs';
import { WHISKY_CABINET } from '../src/components/studio/scene/WhiskyCabinetLayout';
import { whiskyCabinetPose } from '../src/components/studio/scene/WhiskyInspectionMotion';
import { focusFov } from '../src/components/studio/scene/config';

test('the fitted camera can select Ballantine through clear glass while walnut still blocks clicks', () => {
  const cabinet = new Group(); cabinet.position.set(...WHISKY_CABINET.center); cabinet.rotation.y = WHISKY_CABINET.rotation;
  const pivot = new Group(); pivot.position.x = .355; pivot.rotation.y = -Math.PI / 2; cabinet.add(pivot);
  const mirror = new Group(); mirror.scale.x = -1; pivot.add(mirror);
  const opening = new Group(); opening.position.set(.355, 0, -.1275); mirror.add(opening);
  const windowPivot = new Group(); windowPivot.position.set(.319, .07, .112); windowPivot.rotation.y = Math.PI / 2; opening.add(windowPivot);
  const frame = new Group(); frame.scale.x = -1; windowPivot.add(frame);
  const woodMaterial = new MeshBasicMaterial(), glassMaterial = new MeshBasicMaterial({ side: DoubleSide });
  const wood = new Mesh(createIsidoroWindowDoorGeometry(), woodMaterial);
  const reveal = new Mesh(createIsidoroWindowRevealGeometry(), woodMaterial);
  const glass = new Mesh(createIsidoroWindowGlassGeometry(), glassMaterial);
  frame.add(wood, reveal, glass);
  const collection = new Group(); collection.scale.x = -1; opening.add(collection);
  const spec = WHISKY_BOTTLES[1];
  const bottle = new Mesh(createBottleGeometry(spec, { closed: true }), woodMaterial);
  bottle.position.set(...spec.position); collection.add(bottle);
  const edge = new Mesh(new BoxGeometry(.05, 1.12, .285), woodMaterial);
  edge.position.set(-.6975, .595, -.1275); pivot.add(edge);
  cabinet.updateMatrixWorld(true);
  const camera = new PerspectiveCamera(focusFov(null, false, 1440, 900), 1.6, .015, 60);
  const pose = whiskyCabinetPose(cabinet, { width: 1440, height: 900 });
  camera.position.set(...pose.position); camera.lookAt(...pose.target); camera.updateMatrixWorld(true);
  const ray = new Raycaster();
  const firstHit = (x, y) => {
    ray.setFromCamera(new Vector2(x / 720 - 1, 1 - y / 450), camera);
    return ray.intersectObject(cabinet, true)[0]?.object;
  };
  expect(firstHit(474, 667)).toBe(glass);
  glass.raycast = ignoreIsidoroWindowRaycast;
  expect(firstHit(474, 667)).toBe(bottle);
  expect(firstHit(480, 605)).toBe(wood);
  for (const mesh of [wood, reveal, glass, bottle, edge]) mesh.geometry.dispose();
  woodMaterial.dispose(); glassMaterial.dispose();
});
