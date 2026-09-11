import { Html } from '@react-three/drei';
import { useEffect, useRef } from 'react';
import type { Dispatch, SyntheticEvent } from 'react';
import { CD_SLOTS, beosoundDisplay } from './Beosound9000State';
import type { BeosoundAction, BeosoundState } from './Beosound9000State';
import './beosound-9000.css';

const stopEvent = (event: SyntheticEvent) => event.stopPropagation();

export function Beosound9000Controls({ state, compact, dispatch, onClose }: {
  readonly state: BeosoundState; readonly compact: boolean;
  readonly dispatch: Dispatch<BeosoundAction>; readonly onClose: () => void;
}) {
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement;
    closeButton.current?.focus({ preventScroll: true });
    const close = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || document.querySelector('dialog:modal')) return;
      event.preventDefault();
      onClose();
    };
    window.addEventListener('keydown', close);
    return () => {
      window.removeEventListener('keydown', close);
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true });
    };
  }, [onClose]);
  const levelKeys = <>
    <button className="beosound-level-key" type="button" onClick={() => dispatch({ type: 'mute' })} aria-pressed={state.muted}>MUTE</button>
    <button className="beosound-level-key" type="button" onClick={() => dispatch({ type: 'volume', delta: -1 })} aria-label="Decrease volume">VOL −</button>
    <button className="beosound-level-key" type="button" onClick={() => dispatch({ type: 'volume', delta: 1 })} aria-label="Increase volume">VOL +</button>
  </>;
  const loadingKeys = <>
    <button className="beosound-transport-key" type="button" onClick={() => dispatch({ type: 'load' })} aria-label={state.doorOpen ? 'Close CD glass cover' : 'Open CD glass cover'}
      aria-pressed={state.doorOpen}>LOAD</button>
    <button className="beosound-transport-key" type="button" onClick={() => dispatch({ type: 'standby' })} aria-label="Standby">•</button>
  </>;
  return <>
    <Html position={[compact ? .4 : .46, .301, .085]} center zIndexRange={[43, 39]}>
      <button className="beosound-close" ref={closeButton} type="button" aria-label="Return from Beosound 9000"
        onPointerDown={stopEvent} onPointerUp={stopEvent} onClick={event => { stopEvent(event); onClose(); }}>×</button>
    </Html>
    <Html transform={!compact} distanceFactor={compact ? undefined : .4} position={compact ? [0, .1135, .052] : [0, .064, .049]}
      zIndexRange={[43, 39]}>
      <div className="beosound-operation-panel" data-compact={compact} role="group" aria-label="Beosound 9000 controls"
        onPointerDown={stopEvent} onPointerUp={stopEvent} onClick={stopEvent} onDoubleClick={stopEvent} onWheel={stopEvent}>
        <div className="beosound-readout"><span>BANG &amp; OLUFSEN</span>
          <output aria-live="polite" aria-atomic="true">{beosoundDisplay(state)}</output>
        </div>
        <div className="beosound-keys">
          <button className="beosound-transport-key" type="button" onClick={() => dispatch({ type: 'play' })} aria-label="Play selected CD">CD ▷</button>
          <button className="beosound-transport-key" type="button" onClick={() => dispatch({ type: 'pause' })} aria-label="Pause CD">PAUSE</button>
          <button className="beosound-transport-key" type="button" onClick={() => dispatch({ type: 'step', direction: -1 })} aria-label="Previous CD">‹</button>
          <button className="beosound-transport-key" type="button" onClick={() => dispatch({ type: 'step', direction: 1 })} aria-label="Next CD">›</button>
          {compact ? loadingKeys : levelKeys}
        </div>
        <div className="beosound-disc-keys">
          {CD_SLOTS.map(disc => <button className="beosound-disc-key" key={disc} type="button" aria-label={`Select CD ${disc}`} aria-pressed={state.disc === disc}
            onClick={() => dispatch({ type: 'disc', disc })}>{disc}<i aria-hidden="true" /></button>)}
          {!compact && loadingKeys}
        </div>
        {compact && <div className="beosound-level-keys">{levelKeys}</div>}
      </div>
    </Html>
  </>;
}
