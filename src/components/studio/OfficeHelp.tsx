import { useEffect, useRef, useState } from 'react';
import type { RoomControl } from './OfficeRoomControls';

type Props = { readonly ready: boolean; readonly explored: boolean; readonly compact: boolean; readonly onControl: (control: RoomControl) => void };

export function OfficeHelp({ ready, explored, compact, onControl }: Props) {
  const [open, setOpen] = useState(false);
  const [manual, setManual] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    setOpen(ready && !explored);
    if (ready && !explored) timer.current = setTimeout(() => setOpen(false), 7000);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [ready, explored]);
  const gestureSummary = compact
    ? 'One finger: orbit · Two fingers: pan or pinch to zoom · Tap: approach, then open · Double-tap: zoom · X: return.'
    : 'Drag: orbit · Arrow keys / Right / Shift-drag: pan · Scroll / pinch / + / −: zoom · Click: approach, then open · Double-click: zoom · X: return.';

  return <div className="office-help" id="office-help">
    <button className="office-help-toggle" aria-expanded={open} aria-controls="office-gesture-hint"
      onClick={() => { if (timer.current) clearTimeout(timer.current); setManual(true); setOpen(value => !value); }}>
      <span aria-hidden="true">?</span> Controls
    </button>
    <div id="office-gesture-hint" className="office-gesture-hint" hidden={!open}>
      <p className="office-gesture-actions">{gestureSummary}</p>
      {manual && <div className="office-device-shortcuts" aria-label="Device controls">
        <button onClick={() => { setOpen(false); onControl('room'); }}>Room lights</button>
        <button onClick={() => { setOpen(false); onControl('shades'); }}>Blinds</button>
        <button onClick={() => { setOpen(false); onControl('halo'); }}>Halo 2</button>
      </div>}
    </div>
    <span className="studio-sr-only">Focus the scene: arrow keys pan, and plus or minus zoom. Drag to rotate. Click an object to approach, then click again to open. Double-click a room surface to zoom further; use X or Escape to return. Right-drag or Shift-drag also pans. Touch: one finger rotates; two fingers pan or pinch to zoom.</span>
  </div>;
}
