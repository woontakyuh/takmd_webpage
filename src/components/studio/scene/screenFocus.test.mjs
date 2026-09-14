import { describe, expect, it } from 'bun:test';
import { isScreenFocusSettled } from './screenFocus.ts';

const pose = {
  position: [0, 1.943, 1.02],
  target: [0, 1.943, 3.22],
  zoom: 1,
};

describe('isScreenFocusSettled', () => {
  it('keeps the interactive layer hidden while the camera is approaching the screen', () => {
    const visible = isScreenFocusSettled(
      true,
      { x: 0, y: 1.943, z: 1.0241 },
      { x: 0, y: 0, z: 1 },
      pose,
    );

    expect(visible).toBe(false);
  });

  it('shows the interactive layer at the settled screen pose', () => {
    const visible = isScreenFocusSettled(
      true,
      { x: 0.001, y: 1.943, z: 1.019 },
      { x: 0, y: 0, z: 1 },
      pose,
    );

    expect(visible).toBe(true);
  });

  it('hides the interactive layer as soon as the screen is no longer selected', () => {
    const visible = isScreenFocusSettled(
      false,
      { x: 0, y: 1.943, z: 1.02 },
      { x: 0, y: 0, z: 1 },
      pose,
    );

    expect(visible).toBe(false);
  });
});
