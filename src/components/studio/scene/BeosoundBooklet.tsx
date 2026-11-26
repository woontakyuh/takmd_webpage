import { useEffect, useRef, useState } from 'react';
import type { Dispatch, SyntheticEvent } from 'react';
import { BEOSOUND_ALBUMS } from './BeosoundAlbums';
import type { AlbumId } from './BeosoundAlbums';
import { CD_SLOTS, placementAfterExchange } from './Beosound9000State';
import type { BeosoundAction, BeosoundState } from './Beosound9000State';
import { trackAudio } from './BeosoundTracks';
import './beosound-collection.css';
import { BeosoundCoverFlow } from './BeosoundCoverFlow';
import { useBeosoundUnfold } from './useBeosoundUnfold';

const stop = (event: SyntheticEvent) => event.stopPropagation();
export function BeosoundBooklet({ state, album, onAlbum, onClose, dispatch, expanded, reducedMotion, origin, onClosed, focusAlbum, placement, onPlace }: {
  readonly focusAlbum: AlbumId; readonly placement: { readonly album: AlbumId; readonly playTrack?: number } | null; readonly onPlace: (request: { readonly album: AlbumId; readonly playTrack?: number } | null) => void;
  readonly expanded: boolean; readonly reducedMotion: boolean; readonly origin: () => { readonly x: number; readonly y: number }; readonly onClosed: () => void;
  readonly state: BeosoundState; readonly album: AlbumId; readonly onAlbum: (album: AlbumId) => void;
  readonly onClose: () => void; readonly dispatch: Dispatch<BeosoundAction>;
}) {
  const [details, setDetails] = useState(false);
  const placing = placement !== null;
  const close = useRef<HTMLButtonElement>(null);
  const booklet = useBeosoundUnfold({ expanded, reducedMotion, origin, onClosed });
  const record = BEOSOUND_ALBUMS[album];
  const slots = placementAfterExchange(state);
  const mounted = CD_SLOTS.find(slot => slots[slot - 1] === album);
  useEffect(() => { close.current?.focus({ preventScroll: true }); }, []);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || document.querySelector('dialog:modal')) return;
      event.preventDefault(); event.stopImmediatePropagation();
      if (placing) onPlace(null); else if (details) setDetails(false); else onClose();
    };
    window.addEventListener('keydown', escape, true);
    return () => window.removeEventListener('keydown', escape, true);
  }, [placing, details, onClose, onPlace]);
  useEffect(() => { onPlace(null); }, [album, onPlace]);
  const play = (number: number) => {
    if (mounted) dispatch({ type: 'track', disc: mounted, track: number });
    else { setDetails(false); onPlace({ album, playTrack: number }); }
  };
  return <section ref={booklet} className="cd-booklet" inert={!expanded} data-tracks-open={details} role="region" aria-label="CD collection" onPointerDown={stop} onPointerUp={stop} onClick={stop} onDoubleClick={stop} onWheel={stop}>
    <button ref={close} className="cd-collection-close" type="button" aria-label="Close CD collection" onClick={onClose}>×</button>
    <BeosoundCoverFlow focusAlbum={focusAlbum} disabled={state.exchange !== null} album={album} onAlbum={onAlbum} onOpen={() => setDetails(value => !value)} />
    <div className="cd-selection-caption">
      <h2>{record.album}</h2><p>{record.artist} · {record.year}{mounted ? ` · CD ${mounted}` : ''}</p>
      <div className="cd-selection-actions">
        <button type="button" aria-expanded={details} onClick={() => setDetails(value => !value)}>{details ? 'Close tracks' : 'Tracks'}</button>
        <button type="button" disabled={state.exchange !== null} onClick={() => { setDetails(false); onPlace(placing ? null : { album }); }}>{mounted ? 'Move disc' : 'Place in player'}</button>
        {mounted && <button type="button" disabled={state.exchange !== null} onClick={() => dispatch({ type: 'exchange', slot: mounted, album: null })}>Return disc</button>}
      </div>
    </div>
    {details && <div className="cd-open-case">
      <div className="cd-track-leaf">
        <div className="cd-track-heading"><span>TRACKS · {record.tracks.length}</span><small>Highlighted tracks are available here</small></div>
        <ol className="cd-track-list" aria-label={`${record.album} tracks`}>
          {record.tracks.map(track => {
            const playable = Boolean(trackAudio(album, track.number));
            const selected = mounted === state.disc && state.track === track.number && state.playback === 'playing';
            return <li key={track.number}><button type="button" disabled={!playable} aria-current={selected ? 'true' : undefined}
              aria-label={`${playable ? 'Play' : 'Unavailable'} ${track.title}`} onClick={() => play(track.number)}>
              <span className="cd-track-number">{String(track.number).padStart(2, '0')}</span><span>{track.title}</span><span aria-hidden="true">{selected ? 'Ⅱ' : playable ? '▷' : '—'}</span>
            </button></li>;
          })}
        </ol>
      </div>
    </div>}
    {placing && <p className="cd-placement-hint" role="status">Choose a disc on the player above <button type="button" onClick={() => onPlace(null)}>Cancel</button></p>}
    {(state.exchange || state.playback === 'error') && <p className="cd-collection-status" role="status">{state.exchange ? 'Changing disc…' : 'Playback could not start. Select an available track to retry.'}</p>}
  </section>;
}
