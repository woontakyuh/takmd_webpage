import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { LIGHT_PRESETS, LIGHT_PRESET_IDS, type LightPreset } from './lightingPresets';
import { OfficeIcon } from './OfficeIcon';
import type { BlindLift, HaloSettings } from './types';

export type RoomControl = 'room' | 'halo' | 'shades';

type Props = {
  readonly preset: LightPreset;
  readonly onPreset: (preset: LightPreset) => void;
  readonly control: RoomControl | null;
  readonly onClose: () => void;
  readonly blindLift: BlindLift;
  readonly lightsOn: boolean;
  readonly automaticLight: boolean;
  readonly onBlindLift: (side: 0 | 1, value: number) => void;
  readonly onLights: (value: boolean) => void;
  readonly onAutomaticLight: () => void;
  readonly roomBrightness: number;
  readonly onRoomBrightness: (value: number) => void;
  readonly haloSettings: HaloSettings;
  readonly haloOn: boolean;
  readonly onHaloSettings: (value: HaloSettings) => void;
};

function DeviceIcon({ name }: { readonly name: 'power' | 'temperature' | 'up' | 'down' }) {
  const paths = { power: 'M12 3v8M7 5.8a8 8 0 1 0 10 0', temperature: 'M10 14.8V5a2 2 0 0 1 4 0v9.8a4 4 0 1 1-4 0ZM12 10v8', up: 'm6 15 6-6 6 6', down: 'm6 9 6 6 6-6' };
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}

function HaloController({ settings, on, onChange }: {
  readonly settings: HaloSettings; readonly on: boolean; readonly onChange: (settings: HaloSettings) => void;
}) {
  const [mode, setMode] = useState<'brightness' | 'temperature'>('brightness');
  const dial = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pointerId: number; angle: number; value: number } | null>(null);
  const brightness = Math.round(settings.brightness * 100);
  const min = mode === 'brightness' ? 0 : 2700;
  const max = mode === 'brightness' ? 100 : 6500;
  const step = mode === 'brightness' ? 1 : 100;
  const value = mode === 'brightness' ? brightness : settings.temperature;
  const update = (next: number) => {
    const snapped = Math.min(max, Math.max(min, Math.round(next / step) * step));
    onChange(mode === 'brightness' ? { ...settings, enabled: true, brightness: snapped / 100 } : { ...settings, temperature: snapped });
  };
  const latest = useRef({ value, step, update });
  latest.current = { value, step, update };
  useEffect(() => {
    const element = dial.current;
    const wheel = (event: WheelEvent) => {
      if (!event.deltaY) return;
      event.preventDefault();
      event.stopPropagation();
      const current = latest.current;
      current.update(current.value - Math.sign(event.deltaY) * current.step);
    };
    element?.addEventListener('wheel', wheel, { passive: false });
    return () => element?.removeEventListener('wheel', wheel);
  }, []);
  const angleAt = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return Math.atan2((event.clientY - bounds.top - bounds.height / 2) / bounds.height, (event.clientX - bounds.left - bounds.width / 2) / bounds.width) * 180 / Math.PI;
  };
  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { pointerId: event.pointerId, angle: angleAt(event), value };
  };
  const turnDial = (event: PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const angle = angleAt(event);
    const delta = ((angle - current.angle + 540) % 360) - 180;
    current.angle = angle;
    current.value = Math.min(max, Math.max(min, current.value + delta / 270 * (max - min)));
    update(current.value);
  };
  const releaseDial = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current?.pointerId !== event.pointerId) return;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const changes: Record<string, number> = { ArrowUp: step, ArrowRight: step, ArrowDown: -step, ArrowLeft: -step, PageUp: step * 10, PageDown: -step * 10 };
    if (!(event.key in changes) && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    event.stopPropagation();
    update(event.key === 'Home' ? min : event.key === 'End' ? max : value + changes[event.key]);
  };
  return <section className="office-device-halo" aria-label="BenQ ScreenBar Halo 2 controls">
    <div className="office-device-puck" data-powered={on}>
      <div className="office-device-puck-base" aria-hidden="true" />
      <div className="office-device-puck-top">
        <div ref={dial} className="office-device-dial" role="slider" tabIndex={0} data-initial-focus
          aria-label={mode === 'brightness' ? 'Halo brightness' : 'Halo color temperature'} aria-valuemin={min} aria-valuemax={max} aria-valuenow={value}
          aria-valuetext={mode === 'brightness' ? `${value}% brightness` : `${value} kelvin`} aria-describedby="office-halo-dial-help"
          onPointerDown={startDrag} onPointerMove={turnDial} onPointerUp={releaseDial} onPointerCancel={releaseDial} onLostPointerCapture={() => { drag.current = null; }} onKeyDown={onKeyDown}>
          <span className="office-device-dial-marker" style={{ transform: `rotate(${-135 + (value - min) / (max - min) * 270}deg)` }} aria-hidden="true" />
        </div>
        <div className="office-device-glass">
          <span className="office-device-wordmark" aria-hidden="true">BenQ</span>
          <div className="office-device-readings">
            <button type="button" aria-label="Adjust Halo brightness" aria-pressed={mode === 'brightness'} onClick={() => { setMode('brightness'); dial.current?.focus({ preventScroll: true }); }}>
              <OfficeIcon name="sun" /><span>{brightness}<small>%</small></span><em>Brightness</em>
            </button>
            <button type="button" aria-label="Adjust Halo color temperature" aria-pressed={mode === 'temperature'} onClick={() => { setMode('temperature'); dial.current?.focus({ preventScroll: true }); }}>
              <DeviceIcon name="temperature" /><span>{settings.temperature}<small>K</small></span><em>Temperature</em>
            </button>
          </div>
          <button className="office-device-halo-power" type="button" role="switch" aria-label="Halo 2 power" aria-checked={on}
            onClick={() => onChange({ ...settings, enabled: !on, brightness: settings.brightness || 0.65 })}><DeviceIcon name="power" /></button>
        </div>
      </div>
    </div>
    <p id="office-halo-dial-help" className="office-device-help">Turn the ring · scroll · arrow keys</p>
    <p className="office-device-status">{on ? 'On' : 'Off'} <span aria-hidden="true">·</span> {mode === 'brightness' ? 'Adjusting brightness' : 'Adjusting temperature'}</p>
  </section>;
}

function ShadeRocker({ side, lift, onLift }: { readonly side: 0 | 1; readonly lift: number; readonly onLift: (side: 0 | 1, value: number) => void }) {
  const [direction, setDirection] = useState<-1 | 1 | null>(null);
  const latest = useRef({ lift, onLift });
  latest.current = { lift, onLift };
  const travel = useRef<{ direction: -1 | 1; source: number | string; time: number } | null>(null);
  const frame = useRef(0);
  const lastStop = useRef(0);
  const stop = () => {
    cancelAnimationFrame(frame.current);
    travel.current = null;
    lastStop.current = performance.now();
    setDirection(null);
  };
  const start = (next: -1 | 1, source: number | string) => {
    cancelAnimationFrame(frame.current);
    travel.current = { direction: next, source, time: performance.now() };
    setDirection(next);
    const tick = (time: number) => {
      const current = travel.current;
      if (!current) return;
      const nextLift = Math.max(0, Math.min(1, latest.current.lift + current.direction * Math.max(0, Math.min(time - current.time, 64)) / 5000));
      current.time = time;
      latest.current.lift = nextLift;
      latest.current.onLift(side, nextLift);
      if (nextLift === (current.direction === 1 ? 1 : 0)) stop();
      else frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  };
  useEffect(() => {
    const onVisibility = () => { if (document.hidden) stop(); };
    window.addEventListener('blur', stop);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(frame.current);
      travel.current = null;
      window.removeEventListener('blur', stop);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);
  const label = side === 0 ? 'Left shade' : 'Right shade';
  return <div className="office-device-shade-column">
    <span className="office-device-shade-name">{side === 0 ? 'Left' : 'Right'}</span>
    <div className="office-device-shade-rocker">
      {([1, -1] as const).map(next => <button key={next} type="button" data-initial-focus={side === 0 && next === 1 ? true : undefined}
        aria-label={`${next === 1 ? 'Raise' : 'Lower'} ${label.toLowerCase()}; hold to move`} aria-describedby="office-shade-hold-help"
        data-held={direction === next} aria-disabled={next === 1 ? lift >= 1 : lift <= 0}
        onPointerDown={event => {
          if (event.button !== 0) return;
          event.preventDefault();
          event.currentTarget.focus({ preventScroll: true });
          event.currentTarget.setPointerCapture(event.pointerId);
          start(next, event.pointerId);
        }}
        onPointerUp={event => { if (travel.current?.source === event.pointerId) stop(); if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
        onPointerCancel={event => { if (travel.current?.source === event.pointerId) stop(); }}
        onLostPointerCapture={event => { if (travel.current?.source === event.pointerId) stop(); }}
        onKeyDown={event => {
          if (!['Enter', ' ', next === 1 ? 'ArrowUp' : 'ArrowDown'].includes(event.key)) return;
          event.preventDefault();
          event.stopPropagation();
          if (!event.repeat) start(next, event.key);
        }}
        onKeyUp={event => { if (travel.current?.source === event.key) { event.preventDefault(); event.stopPropagation(); stop(); } }}
        onBlur={stop}
        onClick={event => { if (event.detail === 0 && !travel.current && performance.now() - lastStop.current > 100) onLift(side, Math.max(0, Math.min(1, lift + next * 0.05))); }}>
        <DeviceIcon name={next === 1 ? 'up' : 'down'} />
      </button>)}
    </div>
    <output className="office-device-shade-percent" aria-label={`${label} position`}>{Math.round(lift * 100)}<small>%</small></output>
    <div className="office-device-shade-actions">
      <button type="button" aria-label={`Open ${label.toLowerCase()} fully`} onClick={() => { stop(); onLift(side, 1); }}>Open fully</button>
      <button type="button" aria-label={`Close ${label.toLowerCase()} fully`} onClick={() => { stop(); onLift(side, 0); }}>Close fully</button>
    </div>
  </div>;
}

export function OfficeRoomControls({ preset, onPreset, control, onClose, blindLift, lightsOn, automaticLight, onBlindLift, onLights, onAutomaticLight,
  roomBrightness, onRoomBrightness, haloSettings, haloOn, onHaloSettings }: Props) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (control) {
      panel.current?.showPopover();
      panel.current?.querySelector<HTMLElement>('[data-initial-focus]')?.focus({ preventScroll: true });
    } else panel.current?.hidePopover();
  }, [control]);
  const roomPercent = Math.round(roomBrightness * 100);
  return <div ref={panel} id="office-room-settings" className="office-room-panel office-device-panel" data-device={control} popover="auto" role="dialog"
    aria-label={control === 'halo' ? 'Halo 2 controls' : control === 'shades' ? 'Blind controls' : 'Room light controls'}
    onToggle={event => { if (event.newState === 'closed') onClose(); }}>
    <header className="office-device-header"><div><strong>{control === 'halo' ? 'ScreenBar Halo 2' : control === 'shades' ? 'Palladiom shades' : 'Room lighting'}</strong>
      <span>{control === 'halo' ? 'Wireless controller' : control === 'shades' ? 'Window keypad' : 'Wall dimmer'}</span></div>
      <button type="button" onClick={onClose} aria-label="Close controls"><OfficeIcon name="close" /></button></header>
    {control === 'room' && <section aria-label="Room lighting controls">
      <div className="office-device-wallplate office-device-room-plate">
        <div className="office-device-dimmer-mechanism">
          <button className="office-device-rocker" type="button" role="switch" data-initial-focus aria-label="Room lights" aria-checked={lightsOn} onClick={() => onLights(!lightsOn)}>
            <DeviceIcon name="power" /><span>{lightsOn ? 'On' : 'Off'}</span>
          </button>
          <div className="office-device-dimmer-slide">
            <div className="office-device-leds" aria-hidden="true">{[100, 85, 70, 55, 40, 25, 10].map(level => <i key={level} data-lit={lightsOn && roomPercent >= level} />)}</div>
            <input id="office-room-brightness" type="range" min="0" max="100" value={roomPercent} aria-label="Room brightness" aria-orientation="vertical" aria-valuetext={`${roomPercent}% brightness`}
              onChange={event => onRoomBrightness(Number(event.currentTarget.value) / 100)} />
          </div>
        </div>
        <label className="office-device-engraving" htmlFor="office-room-brightness">Room <output>{roomPercent}%</output></label>
      </div>
      <div className="office-device-follow"><span>{automaticLight ? 'Following local light' : 'Manual light'}</span>
        {!automaticLight && <button type="button" onClick={onAutomaticLight}>Use local light</button>}</div>
      <div className="office-device-presets" role="group" aria-label="Lighting presets">
        {LIGHT_PRESET_IDS.map(key => <button type="button" key={key} aria-pressed={preset === key} onClick={() => onPreset(key)}>
          <i style={{ background: `linear-gradient(110deg, ${LIGHT_PRESETS[key].gradient[0]}, ${LIGHT_PRESETS[key].gradient[1]})` }} aria-hidden="true" />{LIGHT_PRESETS[key].label}</button>)}
      </div>
    </section>}
    {control === 'halo' && <HaloController settings={haloSettings} on={haloOn} onChange={onHaloSettings} />}
    {control === 'shades' && <section className="office-device-shades" aria-label="Palladiom shade controls">
      <div className="office-device-wallplate office-device-shade-plate">
        <div className="office-device-dual-shades">
          <ShadeRocker side={0} lift={blindLift[0]} onLift={onBlindLift} />
          <ShadeRocker side={1} lift={blindLift[1]} onLift={onBlindLift} />
        </div>
        <span className="office-device-engraving">LUTRON</span>
      </div>
      <p id="office-shade-hold-help" className="office-device-help">Hold an arrow to move · release to stop</p>
    </section>}
  </div>;
}
