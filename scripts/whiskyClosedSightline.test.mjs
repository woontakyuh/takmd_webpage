import { afterAll, describe, expect, test } from 'bun:test';
import { DoubleSide, Group, Mesh, MeshBasicMaterial, PerspectiveCamera, Raycaster, Vector3 } from 'three';
import { createBodilDeskGeometry } from '../src/components/studio/scene/BodilDeskGeometry';
import { focusFov, ROOM } from '../src/components/studio/scene/config';
import { WHISKY_CABINET } from '../src/components/studio/scene/WhiskyCabinetLayout';
import { whiskyClosedCabinetPose } from '../src/components/studio/scene/WhiskyInspectionMotion';

const geometry = createBodilDeskGeometry();
const material = new MeshBasicMaterial({ side: DoubleSide });
const desk = new Group();
desk.position.set(...ROOM.desk.position);
desk.rotation.y = ROOM.desk.rotation;
for (const part of Object.values(geometry)) desk.add(new Mesh(part, material));
desk.updateMatrixWorld(true);
afterAll(() => { Object.values(geometry).forEach(part => part.dispose()); material.dispose(); });

describe('closed cabinet approach sightline', () => {
  for (const [width, height] of [[1440, 900], [1280, 900], [768, 1024], [390, 844], [375, 667], [844, 390]]) {
    test(`shows the closed cabinet and its handle beyond the real desk at ${width}x${height}`, () => {
      // Given the actual cabinet transform and the desk's rendered solid geometry.
      const cabinet = new Group();
      cabinet.position.set(...WHISKY_CABINET.center);
      cabinet.rotation.y = WHISKY_CABINET.rotation;
      cabinet.updateMatrixWorld(true);
      const targets = [];
      for (const x of [-.34, 0, .34]) for (const y of [.05, .35, .62, .865, 1.14]) {
        targets.push(cabinet.localToWorld(new Vector3(x, y, -.255)));
      }
      for (const y of [.5, .62, .74]) targets.push(cabinet.localToWorld(new Vector3(-.399, y, .073)));
      // When the responsive closed approach is applied to a perspective camera.
      const pose = whiskyClosedCabinetPose(cabinet, { width, height });
      const camera = new PerspectiveCamera(focusFov(null, width < 760, width, height), width / height, .015, 60);
      camera.position.set(...pose.position);
      camera.lookAt(...pose.target);
      camera.updateMatrixWorld(true);
      // Then the complete front and usable handle are in frame, with no desk hit before them.
      for (const target of targets) {
        const projection = target.clone().project(camera);
        expect(Math.abs(projection.x)).toBeLessThan(1);
        expect(Math.abs(projection.y)).toBeLessThan(1);
        const direction = target.clone().sub(camera.position);
        const ray = new Raycaster(camera.position, direction.clone().normalize(), 0, direction.length() - .001);
        expect(ray.intersectObjects(desk.children).length, `Desk obscures ${target.toArray()} from ${pose.position}`).toBe(0);
      }
    });
  }
});
