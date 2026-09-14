import { useEffect, useId, useRef, useState } from 'react';
import { OfficeIcon } from '../OfficeIcon';
import type { useProposalPlayback } from './useProposalPlayback';
import './proposal-playback.css';

function clock(seconds: number) {
  return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
}

export function ProposalPlaybackControls({ playback }: { readonly playback: ReturnType<typeof useProposalPlayback> }) {
  const { state } = playback;
  const [volumeOpen, setVolumeOpen] = useState(false);
  const volumeControl = useRef<HTMLDivElement>(null);
  const volumeId = useId();
  useEffect(() => {
    if (!volumeOpen) return;
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !volumeControl.current?.contains(event.target)) setVolumeOpen(false);
    };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [volumeOpen]);
  return <div className="proposal-playback" aria-label="Proposal recording controls">
    <div className="proposal-playback-seek">
      <input aria-label="Recording position" type="range" min="0" max={state.duration || 1} step="0.1"
        value={state.time} disabled={!state.duration} onChange={event => playback.seek(event.currentTarget.valueAsNumber)} />
      <output>{clock(state.time)} / {clock(state.duration)}</output>
    </div>
    <div className="proposal-playback-actions">
      <button type="button" onClick={playback.toggle} aria-label={state.playing ? 'Pause recording' : 'Play recording'} title={state.playing ? 'Pause' : 'Play'}><OfficeIcon name={state.playing ? 'pause' : 'play'} /></button>
      <div ref={volumeControl} className="proposal-volume" onMouseEnter={() => setVolumeOpen(true)}
        onMouseLeave={() => { if (!volumeControl.current?.contains(document.activeElement)) setVolumeOpen(false); }}
        onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setVolumeOpen(false); }}
        onKeyDown={event => { if (event.key === 'Escape' && volumeOpen) { event.stopPropagation(); setVolumeOpen(false); volumeControl.current?.querySelector('button')?.focus(); } }}>
        <button type="button" aria-label="Recording sound controls" title="Volume" aria-expanded={volumeOpen} aria-controls={volumeId}
          onClick={() => setVolumeOpen(value => !value)}><OfficeIcon name={state.muted || state.volume === 0 ? 'muted' : 'volume'} /></button>
        {volumeOpen && <div id={volumeId} className="proposal-volume-popup" role="group" aria-label="Recording sound">
          {playback.systemVolume ? <span className="proposal-system-volume">Use device volume buttons</span> : <input aria-label="Recording volume" aria-orientation="vertical" type="range" min="0" max="1" step="0.05"
            value={state.muted ? 0 : state.volume} onChange={event => playback.volume(event.currentTarget.valueAsNumber)} />}
          <button type="button" onClick={playback.mute} aria-label={state.muted ? 'Unmute recording' : 'Mute recording'} title={state.muted ? 'Unmute' : 'Mute'}><OfficeIcon name={state.muted ? 'muted' : 'volume'} /></button>
        </div>}
      </div>
    </div>
    {(state.message || !state.duration) && <p className="proposal-playback-message" role="status">{state.message || 'Loading recording…'}</p>}
  </div>;
}
