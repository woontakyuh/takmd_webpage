import { Html } from '@react-three/drei';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { CSSProperties, Dispatch } from 'react';
import { PlaybackGlyph } from './PlaybackGlyph';
import { albumAtSlot, selectedTrack } from './Beosound9000State';
import type { BeosoundState, BeosoundAction } from './Beosound9000State';
import { screenOrigin } from './BeosoundRack';
import { OfficeIcon } from '../OfficeIcon';

export function BeosoundMiniPlayer({ state, dispatch }: {
  readonly state: BeosoundState; readonly dispatch: Dispatch<BeosoundAction>;
}) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [volumeOpen, setVolumeOpen] = useState(false);
  const volumeControl = useRef<HTMLDivElement>(null);
  const volumeId = useId();
  useEffect(() => {
    if (!volumeOpen) return;
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !volumeControl.current?.contains(event.target)) setVolumeOpen(false);
    };
    document.addEventListener('pointerdown', dismiss, true);
    return () => document.removeEventListener('pointerdown', dismiss, true);
  }, [volumeOpen]);
  useEffect(() => { setHost(document.getElementById('office-music-control')); }, []);
  const portal = useMemo(() => ({ current: host! }), [host]);
  const playing = state.playback === 'playing';
  const canPause = playing || state.playback === 'loading';
  const track = selectedTrack(state);
  const album = albumAtSlot(state, state.disc);
  const title = [track?.title, album?.artist].filter(Boolean).join(' · ');
  if (!host) return null;
  return <Html portal={portal} wrapperClass="office-music-portal" calculatePosition={screenOrigin} onOcclude={() => undefined} zIndexRange={[2, 1]}>
    <div className="office-music" onPointerDown={event => event.stopPropagation()} onClick={event => event.stopPropagation()}>
      <button className="office-music-toggle" type="button" title={canPause ? 'Pause music' : 'Play music'} aria-label={canPause ? 'Pause music' : 'Play music'}
        onClick={() => dispatch({ type: canPause ? 'pause' : 'play' })}><PlaybackGlyph playing={canPause} /></button>
      <div ref={volumeControl} className="office-music-volume"
        onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setVolumeOpen(false); }}
        onKeyDown={event => { if (event.key === 'Escape' && volumeOpen) { event.stopPropagation(); setVolumeOpen(false); volumeControl.current?.querySelector('button')?.focus(); } }}>
        <button className="office-music-toggle" type="button" aria-label="Music volume controls" title="Volume" aria-expanded={volumeOpen} aria-controls={volumeId} onClick={() => setVolumeOpen(value => !value)}><OfficeIcon name={state.muted || state.volume === 0 ? 'muted' : 'volume'} /></button>
        {volumeOpen && <div id={volumeId} className="office-music-volume-popup" role="group" aria-label="Music volume">
          <input type="range" min="0" max="90" step="1" aria-label="Music volume" aria-orientation="vertical" aria-valuetext={`${Math.round((state.muted ? 0 : state.volume) / 90 * 100)}%`} value={state.muted ? 0 : state.volume} onChange={event => dispatch({ type: 'volume', value: event.currentTarget.valueAsNumber })}
            onKeyDown={event => { if (event.key === 'ArrowUp' || event.key === 'ArrowDown') { event.preventDefault(); dispatch({ type: 'volume', delta: event.key === 'ArrowUp' ? 1 : -1 }); } }} />
          <button type="button" aria-label={state.muted ? 'Unmute music' : 'Mute music'} onClick={() => dispatch({ type: 'mute' })}><OfficeIcon name={state.muted ? 'muted' : 'volume'} /></button>
        </div>}
      </div>
      {playing && title && <div className="office-music-title" role="status" aria-label={`Now playing: ${title}`}>
        <div className="office-music-marquee" key={title} style={{ '--track-duration': `${Math.max(12, title.length * .28)}s` } as CSSProperties} aria-hidden="true">
          <span>{title}</span><span>{title}</span>
        </div>
      </div>}
    </div>
  </Html>;
}
