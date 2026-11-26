import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { PerspectiveCamera, Vector3 } from 'three';
import { isSceneKeyboardEvent, panCameraWithArrow } from '../src/components/studio/scene/cameraKeyboard';

describe('camera keyboard navigation', () => {
  for (const key of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']) {
    it(`pans without rotating or zooming when ${key} is pressed`, () => {
      // Given a camera looking diagonally into the room.
      const camera = new PerspectiveCamera(42, 1.5, 0.1, 100);
      camera.position.set(4, 3, 6);
      const target = new Vector3(0, 1, 0);
      camera.lookAt(target);
      camera.updateMatrix();
      const beforePosition = camera.position.clone();
      const beforeTarget = target.clone();
      const beforeDirection = camera.getWorldDirection(new Vector3());
      const beforeDistance = camera.position.distanceTo(target);

      // When an arrow key pans the camera.
      const handled = panCameraWithArrow(camera, target, key);

      // Then camera and orbit target translate equally in the requested screen direction.
      const translation = camera.position.clone().sub(beforePosition);
      const screenAxis = new Vector3().setFromMatrixColumn(camera.matrix, key === 'ArrowLeft' || key === 'ArrowRight' ? 0 : 1);
      const sign = key === 'ArrowLeft' || key === 'ArrowDown' ? -1 : 1;
      assert.equal(handled, true);
      assert.ok(translation.length() > 0);
      assert.ok(translation.distanceTo(target.clone().sub(beforeTarget)) < 1e-12);
      assert.ok(translation.dot(screenAxis) * sign > 0);
      assert.ok(Math.abs(camera.position.distanceTo(target) - beforeDistance) < 1e-12);
      assert.ok(camera.getWorldDirection(new Vector3()).distanceTo(beforeDirection) < 1e-12);
    });
  }

  it('leaves the camera still when a zoom key is passed to the pan helper', () => {
    // Given a camera and target in the room.
    const camera = new PerspectiveCamera();
    camera.position.set(0, 1, 5);
    const target = new Vector3(0, 1, 0);
    const position = camera.position.clone();

    // When the zoom key reaches pan classification.
    const handled = panCameraWithArrow(camera, target, '+');

    // Then zoom remains available to its existing handler.
    assert.equal(handled, false);
    assert.ok(camera.position.equals(position));
    assert.ok(target.equals(new Vector3(0, 1, 0)));
  });

  const scene = new EventTarget();
  const canvas = new EventTarget();
  const event = { target: scene, ctrlKey: false, metaKey: false, altKey: false, defaultPrevented: false, isComposing: false };

  for (const target of [scene, canvas]) {
    it('accepts navigation when the scene itself has keyboard focus', () => {
      // Given scene or canvas focus; when its key event is checked.
      const accepted = isSceneKeyboardEvent({ ...event, target }, scene, canvas);
      // Then the room can handle that key.
      assert.equal(accepted, true);
    });
  }

  for (const flag of ['ctrlKey', 'metaKey', 'altKey', 'defaultPrevented', 'isComposing'] as const) {
    it(`leaves the key untouched when ${flag} is active`, () => {
      // Given a browser shortcut, composition, or an already handled event.
      const blocked = { ...event, [flag]: true };
      // When its key event is checked.
      const accepted = isSceneKeyboardEvent(blocked, scene, canvas);
      // Then room movement cannot consume it.
      assert.equal(accepted, false);
    });
  }

  it('leaves nested controls and text fields in charge of their keys', () => {
    // Given focus on any child control rather than the room canvas.
    const target = new EventTarget();
    // When its bubbling key event reaches the scene.
    const accepted = isSceneKeyboardEvent({ ...event, target }, scene, canvas);
    // Then the room does not consume it.
    assert.equal(accepted, false);
  });
});
