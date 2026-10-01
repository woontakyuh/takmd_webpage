import { expect, test } from 'bun:test';
import { frameInterval } from './frameCadence';

test('an idle phone does not redraw the entire room thirty times per second', () => {
  expect(frameInterval({ phone: true, settled: true, interacting: false, animating: false })).toBe(1000 / 6);
});
test('loading, playback and interactions keep their animation cadence', () => {
  const idle = { phone: true, settled: true, interacting: false, animating: false };
  expect(frameInterval({ ...idle, settled: false })).toBe(1000 / 30);
  expect(frameInterval({ ...idle, animating: true })).toBe(1000 / 30);
  expect(frameInterval({ ...idle, interacting: true })).toBe(1000 / 60);
  expect(frameInterval({ ...idle, phone: false })).toBe(1000 / 30);
});
