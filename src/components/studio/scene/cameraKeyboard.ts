import type { Camera } from 'three';
import { Vector3 } from 'three';

const KEY_PAN_STEP = 0.04;

type SceneKeyEvent = Pick<KeyboardEvent,
  'target' | 'ctrlKey' | 'metaKey' | 'altKey' | 'defaultPrevented' | 'isComposing'>;

export function isSceneKeyboardEvent(event: SceneKeyEvent, scene: EventTarget, canvas: EventTarget): boolean {
  return !event.defaultPrevented && !event.isComposing && !event.ctrlKey && !event.metaKey && !event.altKey
    && (event.target === scene || event.target === canvas);
}

export function panCameraWithArrow(camera: Camera, target: Vector3, key: string): boolean {
  let column: 0 | 1;
  let sign: -1 | 1;
  switch (key) {
    case 'ArrowLeft': column = 0; sign = -1; break;
    case 'ArrowRight': column = 0; sign = 1; break;
    case 'ArrowUp': column = 1; sign = 1; break;
    case 'ArrowDown': column = 1; sign = -1; break;
    default: return false;
  }
  const offset = new Vector3().setFromMatrixColumn(camera.matrix, column)
    .multiplyScalar(camera.position.distanceTo(target) * KEY_PAN_STEP * sign);
  camera.position.add(offset);
  target.add(offset);
  return true;
}
