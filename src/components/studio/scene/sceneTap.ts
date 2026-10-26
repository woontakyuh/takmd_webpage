type PointerSample = Pick<PointerEvent, 'pointerId' | 'clientX' | 'clientY' | 'button' | 'isPrimary' | 'shiftKey' | 'ctrlKey' | 'metaKey' | 'altKey'>;
export type SceneTap = { readonly finish: (event: PointerSample, delta?: number) => boolean; readonly cancel: () => void };
const active = new WeakMap<EventTarget, SceneTap>();
const DRAG_DISTANCE = 5;
const modified = (event: PointerSample) => event.shiftKey || event.ctrlKey || event.metaKey || event.altKey;

/** Track only the active press, including moves outside the object and a second finger. */
export function beginSceneTap(scope: EventTarget, events: EventTarget, start: PointerSample, onCancel: () => void): SceneTap | null {
  active.get(scope)?.cancel();
  if (start.button !== 0 || !start.isPrimary || modified(start)) return null;
  let live = true;
  const valid = (event: PointerSample) => event.pointerId === start.pointerId && !modified(event)
    && Math.hypot(event.clientX - start.clientX, event.clientY - start.clientY) < DRAG_DISTANCE;
  const release = () => {
    if (!live) return;
    live = false;
    events.removeEventListener('pointerdown', track, true);
    events.removeEventListener('pointermove', track, true);
    events.removeEventListener('pointerup', cancel);
    events.removeEventListener('pointercancel', cancel, true);
    events.removeEventListener('blur', cancel);
    if (active.get(scope) === tap) active.delete(scope);
  };
  const cancel = () => { if (live) { release(); onCancel(); } };
  const track = (event: Event) => { if (event instanceof PointerEvent && !valid(event)) cancel(); };
  const tap: SceneTap = {
    cancel,
    finish(event, delta = 0) {
      const accepted = live && event.button === 0 && event.isPrimary && delta < DRAG_DISTANCE && valid(event);
      release();
      return accepted;
    },
  };
  active.set(scope, tap);
  events.addEventListener('pointerdown', track, true);
  events.addEventListener('pointermove', track, true);
  events.addEventListener('pointerup', cancel);
  events.addEventListener('pointercancel', cancel, true);
  events.addEventListener('blur', cancel);
  return tap;
}
