import { expect, test } from 'bun:test';
import { frameInterval } from './frameCadence';

test('a settled room uses six frames per second on every device', () => {
  expect(frameInterval({ settled: true, interacting: false, animating: false })).toBe(1000 / 6);
});
test('loading, playback and interactions keep their animation cadence', () => {
  const idle = { settled: true, interacting: false, animating: false };
  expect(frameInterval({ ...idle, settled: false })).toBe(1000 / 30);
  expect(frameInterval({ ...idle, animating: true })).toBe(1000 / 30);
  expect(frameInterval({ ...idle, interacting: true })).toBe(1000 / 60);
});
