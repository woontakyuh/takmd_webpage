import { Html } from '@react-three/drei';
import { useEffect, useRef, useState } from 'react';
import type { Dispatch, SyntheticEvent } from 'react';
import { CD_SLOTS, beosoundDisplay, albumAtSlot, selectedTrack } from './Beosound9000State';
import type { BeosoundAction, BeosoundState } from './Beosound9000State';
import { screenOrigin } from './BeosoundRack';
import './beosound-9000.css';

const stopEvent = (event: SyntheticEvent) => event.stopPropagation();

export function Beosound9000Controls({ state, compact, hidden, dispatch, onClose }: {
  readonly state: BeosoundState; readonly compact: boolean; readonly hidden: boolean;
  readonly dispatch: Dispatch<BeosoundAction>; readonly onClose: () => void;
}) {
  const [volumeOpen, setVolumeOpen] = useState(false);
  const playing = state.playback === 'playing' || state.playback === 'loading';
  const closeButton = useRef<HTMLButtonElement>(null);
  const album = albumAtSlot(state, state.disc);
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
    {!hidden && compact && <Html calculatePosition={screenOrigin} zIndexRange={[43, 39]}>
      <div className="beosound-mobile-controls" role="group" aria-label="Beosound 9000 controls"
        onPointerDown={stopEvent} onPointerUp={stopEvent} onClick={stopEvent} onDoubleClick={stopEvent} onWheel={stopEvent}>
        <div className="beosound-mobile-transport">
          <button type="button" onClick={() => dispatch({ type: 'step', direction: -1 })} aria-label="Previous CD">‹</button>
          <button className="beosound-primary-play" type="button" onClick={() => dispatch({ type: playing ? 'pause' : 'play' })} aria-label={playing ? 'Pause CD' : 'Play selected CD'}><span aria-hidden="true">{playing ? 'Ⅱ' : '▶'}</span> {playing ? '정지' : '재생'}</button>
          <button type="button" onClick={() => dispatch({ type: 'step', direction: 1 })} aria-label="Next CD">›</button>
          <button type="button" aria-expanded={volumeOpen} onClick={() => setVolumeOpen(value => !value)}>음량</button>
        </div>
        <p>{selectedTrack(state)?.title ?? album?.album} · CD {state.disc}</p>
        {volumeOpen && <div className="beosound-mobile-volume"><button type="button" aria-pressed={state.muted} onClick={() => dispatch({ type: 'mute' })}>{state.muted ? '소리 켜기' : '음소거'}</button><input type="range" min="0" max="90" value={state.volume} aria-label="Music volume" onChange={event => dispatch({ type: 'volume', value: Number(event.target.value) })} /></div>}
      </div>
    </Html>}
    {!hidden && !compact && <Html transform={!compact} distanceFactor={compact ? undefined : .4} position={compact ? [.10, .1135, .052] : [0, .064, .049]}
      zIndexRange={[43, 39]}>
      <div className="beosound-operation-panel" data-compact={compact} role="group" aria-label="Beosound 9000 controls"
        onPointerDown={stopEvent} onPointerUp={stopEvent} onClick={stopEvent} onDoubleClick={stopEvent} onWheel={stopEvent}>
        <div className="beosound-readout"><span>BANG &amp; OLUFSEN</span>
          <output aria-live="polite" aria-atomic="true">{beosoundDisplay(state)}</output>
        </div>
        <div className="beosound-keys">
          <button className="beosound-transport-key beosound-primary-play" type="button" onClick={() => dispatch({ type: 'play' })} aria-label="Play selected CD">▶ 재생</button>
          <button className="beosound-transport-key" type="button" onClick={() => dispatch({ type: 'pause' })} aria-label="Pause CD">Ⅱ 정지</button>
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
        {compact && album && <p className="beosound-track-caption">{album.artist} · {selectedTrack(state)?.title ?? album.album}</p>}
      </div>
    </Html>}
    {!hidden && !compact && album && <Html position={[0, -.017, .06]} center zIndexRange={[43, 39]}>
      <p className="beosound-track-caption">{album.artist} · {selectedTrack(state)?.title ?? album.album}</p>
    </Html>}
  </>;
}
