import { describe, expect, it } from 'bun:test';
import { Vector3 } from 'three';
import { scheduleSceneSingleAction, zoomPoseForPoint } from './sceneGesture.ts';

describe('scheduleSceneSingleAction', () => {
  it('runs one settled click', async () => {
    // Given a scene event target and one action.
    const target = new EventTarget();
    let activations = 0;

    // When the click settles without a second click.
    await new Promise(resolve => scheduleSceneSingleAction(target, () => {
      activations += 1;
      resolve();
    }));

    // Then the action runs once.
    expect(activations).toBe(1);
  });

  it('cancels both actions when a second click arrives', () => {
    // Given one pending scene action.
    const target = new EventTarget();
    let activations = 0;
    let cancellations = 0;
    scheduleSceneSingleAction(target, () => { activations += 1; }, () => { cancellations += 1; });

    // When a second click schedules another action on the same scene.
    scheduleSceneSingleAction(target, () => { activations += 1; }, () => { cancellations += 1; });

    // Then neither single action runs and both cancellation paths close.
    expect(activations).toBe(0);
    expect(cancellations).toBe(2);
  });
});

describe('zoomPoseForPoint', () => {
  it('approaches the clicked point while preserving the viewing ray', () => {
    // Given an overview camera and a point on the room surface.
    const position = new Vector3(4, 3, 6);
    const point = new Vector3(1, 1, 0);

    // When a close inspection pose is calculated.
    const pose = zoomPoseForPoint(position, point);

    // Then the camera remains on the same ray, 1.2 metres from the point.
    expect(pose.target.distanceTo(point)).toBeLessThan(0.000_001);
    expect(pose.position.distanceTo(point)).toBeCloseTo(1.2, 6);
    expect(pose.position.clone().sub(point).normalize().distanceTo(position.clone().sub(point).normalize())).toBeLessThan(0.000_001);
  });

  it('does not move closer than the near inspection distance', () => {
    // Given a camera already close to the clicked surface.
    const position = new Vector3(0, 0, 0.2);
    const point = new Vector3(0, 0, 0);

    // When a close inspection pose is calculated.
    const pose = zoomPoseForPoint(position, point);

    // Then the camera keeps a safe 0.48 metre distance.
    expect(pose.position.distanceTo(point)).toBeCloseTo(0.48, 6);
  });
});
