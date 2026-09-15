import { useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { ALBUM_IDS, BEOSOUND_ALBUMS } from './BeosoundAlbums';
import type { AlbumId } from './BeosoundAlbums';
import './beosound-cover-flow.css';

type Props = { readonly returning: AlbumId | null; readonly disabled: boolean; readonly album: AlbumId; readonly onAlbum: (album: AlbumId) => void; readonly onOpen: () => void };

export function BeosoundCoverFlow({ album, onAlbum, onOpen, returning, disabled }: Props) {
  const index = ALBUM_IDS.indexOf(album);
  const [dragOffset, setDragOffset] = useState(0);
  const gesture = useRef<{ id: number; x: number } | null>(null);
  const swiped = useRef(false);
  const step = (direction: number) => {
    if (disabled) return;
    const next = ALBUM_IDS[Math.max(0, Math.min(ALBUM_IDS.length - 1, index + direction))];
    if (next) onAlbum(next);
  };
  return <div className="cd-browser cd-cover-flow">
    <button type="button" aria-label="Previous album" disabled={disabled || index === 0} onClick={() => step(-1)}>‹</button>
    <div className="cd-case-rail" aria-label="Browse album cases" data-dragging={dragOffset !== 0}
      onPointerDown={event => { gesture.current = { id: event.pointerId, x: event.clientX }; swiped.current = false; }}
      onPointerMove={event => {
        const start = gesture.current;
        if (disabled || !start || start.id !== event.pointerId || Math.abs(event.clientX - start.x) < 8) return;
        swiped.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        setDragOffset(Math.max(-90, Math.min(90, event.clientX - start.x)));
      }}
      onPointerUp={event => {
        const start = gesture.current;
        if (start && Math.abs(event.clientX - start.x) > 28) step(event.clientX < start.x ? 1 : -1);
        gesture.current = null; setDragOffset(0);
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={() => { gesture.current = null; setDragOffset(0); }}
      onClickCapture={event => { if (swiped.current) { event.preventDefault(); event.stopPropagation(); swiped.current = false; } }}
      onKeyDown={event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); step(event.key === 'ArrowLeft' ? -1 : 1); } }}>
      {ALBUM_IDS.map((id, slot) => {
        const rawOffset = slot - index;
        const offset = id === returning ? Math.max(-1, Math.min(1, rawOffset)) : rawOffset;
        const distance = Math.abs(offset), record = BEOSOUND_ALBUMS[id];
        const style = {
          '--cover-offset': offset === 0 ? 0 : Math.sign(offset) * (.83 + (distance - 1) * .36),
          '--cover-angle': `${offset === 0 ? 0 : -Math.sign(offset) * 58}deg`,
          '--cover-depth': `${offset === 0 ? 28 : -35 - distance * 12}px`,
          '--drag-offset': `${dragOffset}px`,
          '--cover-image': `url("${record.cover}")`,
          zIndex: id === returning ? ALBUM_IDS.length + 1 : ALBUM_IDS.length - distance,
          visibility: distance > 3 ? 'hidden' : 'visible',
        } as CSSProperties;
        return <button type="button" key={id} data-cd-album={id} disabled={disabled} style={style} aria-label={`Browse ${record.artist} — ${record.album}`}
          aria-pressed={id === album} onClick={() => id === album ? onOpen() : onAlbum(id)}>
          <img draggable={false} src={record.cover} width="240" height="240" alt="" />
        </button>;
      })}
    </div>
    <button type="button" aria-label="Next album" disabled={disabled || index === ALBUM_IDS.length - 1} onClick={() => step(1)}>›</button>
    <span className="cd-cover-flow-position" aria-live="polite">{String(index + 1).padStart(2, '0')} / {String(ALBUM_IDS.length).padStart(2, '0')}</span>
  </div>;
}
