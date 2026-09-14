import { useEffect, useRef, useState } from 'react';
import type { Dispatch, SyntheticEvent } from 'react';
import { ALBUM_IDS, BEOSOUND_ALBUMS } from './BeosoundAlbums';
import type { AlbumId } from './BeosoundAlbums';
import { CD_SLOTS, placementAfterExchange } from './Beosound9000State';
import type { BeosoundAction, BeosoundState } from './Beosound9000State';
import { trackAudio } from './BeosoundTracks';
import './beosound-collection.css';

const stop = (event: SyntheticEvent) => event.stopPropagation();
export function BeosoundBooklet({ state, album, onAlbum, onClose, dispatch }: {
  readonly state: BeosoundState; readonly album: AlbumId; readonly onAlbum: (album: AlbumId) => void;
  readonly onClose: () => void; readonly dispatch: Dispatch<BeosoundAction>;
}) {
  const [placing, setPlacing] = useState(false), [pendingTrack, setPendingTrack] = useState<number | undefined>();
  const close = useRef<HTMLButtonElement>(null), rail = useRef<HTMLDivElement>(null), drag = useRef<{ x: number; scroll: number } | null>(null), swiped = useRef(false);
  const record = BEOSOUND_ALBUMS[album], index = ALBUM_IDS.indexOf(album);
  const slots = placementAfterExchange(state);
  const mounted = CD_SLOTS.find(slot => slots[slot - 1] === album);
  useEffect(() => { close.current?.focus({ preventScroll: true }); }, []);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || document.querySelector('dialog:modal')) return;
      event.preventDefault(); event.stopImmediatePropagation();
      if (placing) setPlacing(false); else onClose();
    };
    window.addEventListener('keydown', escape, true);
    return () => window.removeEventListener('keydown', escape, true);
  }, [placing, onClose]);
  useEffect(() => { setPlacing(false); setPendingTrack(undefined); }, [album]);
  useEffect(() => { rail.current?.querySelector('[aria-pressed="true"]')?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'auto' }); }, [album]);
  const step = (direction: number) => { const id = ALBUM_IDS[index + direction]; if (id) onAlbum(id); };
  const play = (number: number) => {
    if (mounted) dispatch({ type: 'track', disc: mounted, track: number });
    else { setPendingTrack(number); setPlacing(true); }
  };
  return <section className="cd-booklet" role="region" aria-label="CD collection" onPointerDown={stop} onPointerUp={stop} onClick={stop} onDoubleClick={stop} onWheel={stop}>
    <header className="cd-booklet-header"><span>THE RECORD COLLECTION <small>{ALBUM_IDS.length} albums</small></span>
      <button ref={close} type="button" aria-label="Close CD collection" onClick={onClose}>×</button></header>
    <div className="cd-browser">
      <button type="button" aria-label="Previous album" disabled={index === 0} onClick={() => step(-1)}>‹</button>
      <div ref={rail} className="cd-case-rail" aria-label="Browse album cases"
        onPointerDown={event => { drag.current = { x: event.clientX, scroll: event.currentTarget.scrollLeft }; swiped.current = false; }}
        onPointerMove={event => { const start = drag.current; if (!start || Math.abs(event.clientX - start.x) < 8) return; swiped.current = true; event.currentTarget.setPointerCapture(event.pointerId); event.currentTarget.scrollLeft = start.scroll + start.x - event.clientX; }}
        onPointerUp={event => { const start = drag.current; if (start && Math.abs(event.clientX - start.x) > 35) { step(event.clientX < start.x ? 1 : -1); event.preventDefault(); } drag.current = null; }}
        onClickCapture={event => { if (swiped.current) { event.preventDefault(); event.stopPropagation(); swiped.current = false; } }}
        onPointerCancel={() => { drag.current = null; }}
        onKeyDown={event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); step(event.key === 'ArrowLeft' ? -1 : 1); } }}>
        {ALBUM_IDS.map(id => <button type="button" key={id} aria-label={`Browse ${BEOSOUND_ALBUMS[id].artist} — ${BEOSOUND_ALBUMS[id].album}`} aria-pressed={id === album}
          onClick={() => onAlbum(id)}><img draggable={false} src={BEOSOUND_ALBUMS[id].cover} width="64" height="64" alt="" /><span>{BEOSOUND_ALBUMS[id].artist}</span></button>)}
      </div>
      <button type="button" aria-label="Next album" disabled={index === ALBUM_IDS.length - 1} onClick={() => step(1)}>›</button>
    </div>
    <div className="cd-open-case">
      <div className="cd-cover-leaf"><img className="cd-cover" src={record.cover} width="240" height="240" alt={`${record.album} album cover`} />
        <div className="cd-album-details"><span className="cd-artist">{record.artist} · {record.year}</span><h2>{record.album}</h2>
          <p className="cd-case-location">{mounted ? `Empty case · In player, CD ${mounted}` : 'Disc in case'}</p>
          <div className="cd-tray" data-empty={Boolean(mounted)} aria-label={mounted ? `Empty disc tray; disc in slot ${mounted}` : 'Disc stored inside case'}>
            {!mounted && <img src={record.cover} width="48" height="48" alt="Disc inside case" />}<i /></div>
          <button type="button" className="cd-mount" onClick={() => { setPendingTrack(undefined); setPlacing(!placing); }}>{mounted ? 'Move disc…' : 'Place in player…'}</button>
          <a href={record.source} target="_blank" rel="noreferrer">Album details ↗</a>
        </div>
      </div>
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
    </div>
    {placing && <div className="cd-slot-picker" role="group" aria-label="Choose replacement slot">
      <div><strong>{pendingTrack ? 'Choose a slot · play after placing' : 'Choose a slot · place without playing'}</strong><button type="button" onClick={() => setPlacing(false)} aria-label="Cancel slot selection">×</button></div>
      <div className="cd-slot-grid">{CD_SLOTS.map(slot => {
        const id = slots[slot - 1];
        return <button type="button" key={slot} disabled={id === album} aria-label={`Place ${record.album} in CD ${slot}`}
          onClick={() => { dispatch({ type: 'exchange', slot, album, playTrack: pendingTrack }); setPlacing(false); }}>
          <b>CD {slot}</b><span>{id ? BEOSOUND_ALBUMS[id].artist : 'Empty'}</span></button>;
      })}</div>
    </div>}
    {['playing', 'paused', 'loading', 'error'].includes(state.playback) && <div className="cd-listening-controls">
      <button type="button" aria-label={state.playback === 'playing' || state.playback === 'loading' ? 'Pause music' : 'Resume music'}
        onClick={() => dispatch({ type: state.playback === 'playing' || state.playback === 'loading' ? 'pause' : 'play' })}>{state.playback === 'playing' || state.playback === 'loading' ? 'Pause' : 'Resume'}</button>
      <label>Volume <input type="range" min="0" max="90" value={state.volume} aria-label="Music volume"
        onChange={event => dispatch({ type: 'volume', value: Number(event.target.value) })} /></label>
      <button type="button" aria-label={state.muted ? 'Unmute music' : 'Mute music'} onClick={() => dispatch({ type: 'mute' })}>{state.muted ? 'Unmute' : 'Mute'}</button>
    </div>}
    <footer className="cd-booklet-footer"><span role="status">{state.exchange ? 'Changing disc…' : state.playback === 'error' ? 'Playback could not start. Select an available track to retry.' : mounted ? `CD ${mounted} · Case stays in the collection` : 'Select a highlighted track to listen, or place the disc for later.'}</span>
      {mounted && <button type="button" onClick={() => dispatch({ type: 'exchange', slot: mounted, album: null })}>Return disc</button>}</footer>
  </section>;
}
