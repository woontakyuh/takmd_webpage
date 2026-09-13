import { OfficeIcon } from '../OfficeIcon';
import type { useProposalPlayback } from './useProposalPlayback';
import './proposal-playback.css';

function clock(seconds: number) {
  return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
}

export function ProposalPlaybackControls({ playback }: { readonly playback: ReturnType<typeof useProposalPlayback> }) {
  const { state } = playback;
  return <div className="proposal-playback" aria-label="Proposal recording controls">
    <div className="proposal-playback-seek">
      <input aria-label="Recording position" type="range" min="0" max={state.duration || 1} step="0.1"
        value={state.time} disabled={!state.duration} onChange={event => playback.seek(event.currentTarget.valueAsNumber)} />
      <output>{clock(state.time)} / {clock(state.duration)}</output>
    </div>
    <div className="proposal-playback-actions">
      <button type="button" onClick={playback.toggle} aria-label={state.playing ? 'Pause recording' : 'Play recording'}>{state.playing ? 'Pause' : 'Play'}</button>
      <button type="button" onClick={playback.mute} aria-label={state.muted ? 'Unmute recording' : 'Mute recording'}>{state.muted ? 'Sound off' : 'Sound on'}</button>
      <input aria-label="Recording volume" type="range" min="0" max="1" step="0.05"
        value={state.muted ? 0 : state.volume} onChange={event => playback.volume(event.currentTarget.valueAsNumber)} />
      <button type="button" onClick={playback.fullscreen} disabled={!state.duration} aria-label="Watch recording fullscreen"><OfficeIcon name="expand" /></button>
    </div>
    {(state.message || !state.duration) && <p className="proposal-playback-message" role="status">{state.message || 'Loading recording…'}</p>}
  </div>;
}
