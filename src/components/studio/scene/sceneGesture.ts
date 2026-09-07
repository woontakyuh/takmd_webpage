import { MathUtils, Vector3 } from 'three';

type PendingAction = {
  readonly timer: ReturnType<typeof setTimeout>;
  readonly onCancel?: () => void;
};

type ZoomPose = {
  readonly position: Vector3;
  readonly target: Vector3;
};

const CLICK_SETTLE_MS = 320;
const MIN_INSPECTION_DISTANCE = 0.48;
const MAX_INSPECTION_DISTANCE = 1.2;
const pendingActions = new WeakMap<EventTarget, PendingAction>();

function clearPending(target: EventTarget, pending: PendingAction): void {
  clearTimeout(pending.timer);
  pendingActions.delete(target);
  pending.onCancel?.();
}

export function cancelSceneSingleAction(target: EventTarget): void {
  const pending = pendingActions.get(target);
  if (pending) clearPending(target, pending);
}

export function scheduleSceneSingleAction(target: EventTarget, action: () => void, onCancel?: () => void): void {
  const pending = pendingActions.get(target);
  if (pending) {
    clearPending(target, pending);
    onCancel?.();
    return;
  }
  const timer = setTimeout(() => {
    pendingActions.delete(target);
    action();
  }, CLICK_SETTLE_MS);
  pendingActions.set(target, onCancel ? { timer, onCancel } : { timer });
}

export function zoomPoseForPoint(position: Vector3, point: Vector3): ZoomPose {
  const distance = MathUtils.clamp(position.distanceTo(point) * 0.22, MIN_INSPECTION_DISTANCE, MAX_INSPECTION_DISTANCE);
  const direction = position.clone().sub(point).normalize();
  return {
    position: point.clone().addScaledVector(direction, distance),
    target: point.clone(),
  };
}
