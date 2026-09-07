import { useEffect, useRef, useState } from 'react';

type Props = { readonly ready: boolean; readonly explored: boolean; readonly compact: boolean };

export function OfficeHelp({ ready, explored, compact }: Props) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    setOpen(ready && !explored);
    if (ready && !explored) timer.current = setTimeout(() => setOpen(false), 7000);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [ready, explored]);
  const gestureSummary = compact
    ? 'One finger: orbit · Two fingers: pan or pinch to zoom · Tap: discover an object.'
    : 'Drag: orbit · Right / Shift-drag: pan · Scroll / pinch: zoom · Double-click: inspect or return.';

  return <div className="office-help" id="office-help">
    <button className="office-help-toggle" aria-expanded={open} aria-controls="office-gesture-hint"
      onClick={() => { if (timer.current) clearTimeout(timer.current); setOpen(value => !value); }}>
      <span aria-hidden="true">?</span> Controls
    </button>
    <div id="office-gesture-hint" className="office-gesture-hint" hidden={!open}>
      <p className="office-gesture-actions">{gestureSummary}</p>
    </div>
    <span className="studio-sr-only">Focus the scene: arrow keys rotate, Shift plus arrow keys pan, and plus or minus zoom. Double-click a room surface to inspect it, then double-click again to return. Right-drag also pans. Touch: one finger rotates; two fingers pan or pinch to zoom.</span>
  </div>;
}
