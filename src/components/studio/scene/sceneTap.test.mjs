import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { beginSceneTap } from './sceneTap.ts';
const originalPointer = globalThis.PointerEvent;
class TestPointer extends Event {
  constructor(type, values = {}) { super(type); Object.assign(this, { pointerId: 1, clientX: 100, clientY: 100, button: 0, isPrimary: true, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false }, values); }
}
beforeAll(() => { globalThis.PointerEvent = TestPointer; });
afterAll(() => { globalThis.PointerEvent = originalPointer; });
const press = () => new TestPointer('pointerdown');
const release = values => new TestPointer('pointerup', values);
describe('scene press tracking', () => {
  it('accepts a stationary primary tap only once', () => {
    const tap = beginSceneTap(new EventTarget(), new EventTarget(), press(), () => {});
    expect(tap.finish(release())).toBe(true);
    expect(tap.finish(release())).toBe(false);
  });
  it('rejects an orbit that returns to its starting point', () => {
    const events = new EventTarget(); let cancelled = 0;
    const tap = beginSceneTap(new EventTarget(), events, press(), () => cancelled++);
    events.dispatchEvent(new TestPointer('pointermove', { clientX: 120 }));
    events.dispatchEvent(new TestPointer('pointermove'));
    expect(tap.finish(release())).toBe(false); expect(cancelled).toBe(1);
  });
  it('rejects a pinch even if the first finger never moved', () => {
    const events = new EventTarget();
    const tap = beginSceneTap(new EventTarget(), events, press(), () => {});
    events.dispatchEvent(new TestPointer('pointerdown', { pointerId: 2, isPrimary: false }));
    expect(tap.finish(release())).toBe(false);
  });
  it('cancels release outside the object, pointer cancellation, and window blur', () => {
    for (const type of ['pointerup', 'pointercancel', 'blur']) {
      const events = new EventTarget(); let cancelled = 0;
      const tap = beginSceneTap(new EventTarget(), events, press(), () => cancelled++);
      events.dispatchEvent(new Event(type));
      expect(tap.finish(release())).toBe(false); expect(cancelled).toBe(1);
    }
  });
  it('allows only one active object per canvas and ignores modified or secondary presses', () => {
    const scope = new EventTarget(), events = new EventTarget(); let cancelled = 0;
    const first = beginSceneTap(scope, events, press(), () => cancelled++);
    const second = beginSceneTap(scope, events, press(), () => {});
    expect(cancelled).toBe(1); expect(first.finish(release())).toBe(false); expect(second.finish(release())).toBe(true);
    for (const changes of [{ button: 2 }, { isPrimary: false }, { shiftKey: true }, { ctrlKey: true }]) expect(beginSceneTap(scope, events, new TestPointer('pointerdown', changes), () => {})).toBeNull();
  });
  it('removes all window listeners after the interaction', () => {
    const events = new EventTarget(), listeners = new Set();
    const add = events.addEventListener.bind(events), remove = events.removeEventListener.bind(events);
    events.addEventListener = (type, callback, options) => { listeners.add(type); add(type, callback, options); };
    events.removeEventListener = (type, callback, options) => { listeners.delete(type); remove(type, callback, options); };
    const tap = beginSceneTap(new EventTarget(), events, press(), () => {});
    expect(listeners.size).toBe(5); tap.finish(release()); expect(listeners.size).toBe(0);
  });
});
