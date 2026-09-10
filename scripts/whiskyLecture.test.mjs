import { describe, expect, test } from 'bun:test';
import { Group, PerspectiveCamera, Vector3 } from 'three';
import { WHISKY_LECTURE, whiskyLectureLayout, whiskyLecturePose } from '../src/components/studio/scene/WhiskyLectureLayout';
import { focusFov } from '../src/components/studio/scene/config';

describe('cabinet lecture reading composition', () => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
    test(`Given a rotated cabinet, when inspecting at ${viewport.width}x${viewport.height}, then the entire paper fits above its controls`, () => {
      const card = new Group();
      card.position.set(1.7, 0.92, -2.1);
      card.rotation.y = 0.42;
      const layout = whiskyLectureLayout(viewport);
      const pose = whiskyLecturePose(card, viewport);
      const camera = new PerspectiveCamera(focusFov(null, viewport.width < 760, viewport.width, viewport.height), viewport.width / viewport.height, 0.02, 80);
      camera.position.set(...pose.position);
      camera.lookAt(new Vector3(...pose.target));
      camera.updateMatrixWorld(true);
      for (const x of [-WHISKY_LECTURE.width / 2, WHISKY_LECTURE.width / 2]) {
        for (const y of [-WHISKY_LECTURE.height / 2, WHISKY_LECTURE.height / 2]) {
          const projected = card.localToWorld(new Vector3(x, y, 0)).project(camera);
          const screenX = (projected.x + 1) * viewport.width / 2;
          const screenY = (1 - projected.y) * viewport.height / 2;
          expect(screenX).toBeGreaterThanOrEqual(16);
          expect(screenX).toBeLessThanOrEqual(viewport.width - 16);
          expect(screenY).toBeGreaterThanOrEqual(60);
          expect(screenY).toBeLessThanOrEqual(layout.controlsTop - 12);
        }
      }
    });
  }
});
