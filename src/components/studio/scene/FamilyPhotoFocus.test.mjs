import { describe, expect, it } from 'bun:test';
import { Group, PerspectiveCamera, Vector3 } from 'three';
import { FAMILY_PHOTO, FOCUS, MOBILE_FOCUS, ROOM, focusFov } from './config.ts';
import { moveFocus } from '../arrangement.tsx';

describe('desk photo inspection', () => {
  for (const [width, height] of [[1440, 900], [390, 844], [768, 1024]]) {
    for (const angle of [0, Math.PI / 12]) {
      it(`keeps the physical photo in front of the camera at ${width}x${height}, desk rotation ${angle}`, () => {
        const desk = new Group();
        desk.position.set(...ROOM.desk.position);
        desk.rotation.y = ROOM.desk.rotation;
        const frame = new Group();
        frame.position.set(...FAMILY_PHOTO.position);
        frame.rotation.y = FAMILY_PHOTO.rotation;
        desk.add(frame);
        desk.updateMatrixWorld(true);
        const center = frame.localToWorld(new Vector3(0, .095, 0));
        const front = new Vector3(0, 0, 1).transformDirection(frame.matrixWorld);
        const offset = angle ? { x: -.1, z: .1, angle } : { x: 0, z: 0, angle };
        const transformed = moveFocus({ position: center.toArray(), target: center.clone().add(front).toArray(), zoom: 1 }, 'family', { desk: offset });
        const compact = width < 760 || width < height;
        const pose = moveFocus((compact ? MOBILE_FOCUS : FOCUS).family, 'family', { desk: offset });
        const camera = new PerspectiveCamera(focusFov('family', compact, width, height), width / height, .015, 60);
        camera.setViewOffset(width, height, compact ? 0 : 176, compact ? height * .24 : 0, width, height);
        camera.position.set(...pose.position);
        camera.lookAt(...pose.target);
        camera.updateMatrixWorld();
        const actualCenter = new Vector3(...transformed.position);
        const actualFront = new Vector3(...transformed.target).sub(actualCenter).normalize();
        expect(camera.position.clone().sub(actualCenter).normalize().dot(actualFront)).toBeGreaterThan(.97);
        expect(new Vector3(...pose.target).distanceTo(actualCenter)).toBeLessThan(.003);
        for (const x of [-.123, .123]) for (const y of [-.095, .095]) {
          const corner = frame.localToWorld(new Vector3(x, .095 + y, 0));
          const moved = moveFocus({ position: corner.toArray(), target: corner.toArray(), zoom: 1 }, 'family', { desk: offset });
          const projected = new Vector3(...moved.position).project(camera);
          expect(Math.abs(projected.x)).toBeLessThan(1);
          expect(Math.abs(projected.y)).toBeLessThan(1);
          expect(projected.z).toBeGreaterThan(-1);
          expect(projected.z).toBeLessThan(1);
        }
      });
    }
  }
});
