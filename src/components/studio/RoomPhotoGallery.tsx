import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { OfficeIcon } from './OfficeIcon';
import './room-photo-gallery.css';

type Photo = { readonly src: string; readonly caption: string };

function PhotoViewer({ photos, initial, onClose }: { readonly photos: readonly Photo[]; readonly initial: number; readonly onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(initial);
  const [zoomed, setZoomed] = useState(false);
  const photo = photos[index];
  const move = (direction: number) => { setIndex(value => (value + direction + photos.length) % photos.length); setZoomed(false); viewportRef.current?.scrollTo(0, 0); };
  useEffect(() => {
    const dialog = dialogRef.current;
    const trigger = document.activeElement;
    dialog?.showModal();
    return () => { dialog?.close(); if (trigger instanceof HTMLElement) trigger.focus({ preventScroll: true }); };
  }, []);
  if (!photo) return null;
  return createPortal(<dialog ref={dialogRef} className="room-photo-viewer" aria-label="Workshop photograph"
    onCancel={event => { event.preventDefault(); event.stopPropagation(); onClose(); }}
    onKeyDown={event => { if (event.key === 'ArrowRight') { event.preventDefault(); move(1); } if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); } }}>
    <header><span>{index + 1} / {photos.length}</span><div>
      <button type="button" className="studio-icon-button" onClick={() => setZoomed(value => !value)} aria-label={zoomed ? 'Fit photograph' : 'Zoom photograph'}><OfficeIcon name={zoomed ? 'collapse' : 'expand'} /></button>
      <button type="button" className="studio-icon-button" onClick={onClose} aria-label="Close photograph" autoFocus><OfficeIcon name="close" /></button>
    </div></header>
    <div ref={viewportRef} className="room-photo-viewport" data-zoomed={zoomed}><img src={photo.src} alt={photo.caption} /></div>
    <footer><button type="button" className="studio-icon-button" onClick={() => move(-1)} aria-label="Previous photograph">‹</button><p>{photo.caption}</p><button type="button" className="studio-icon-button" onClick={() => move(1)} aria-label="Next photograph">›</button></footer>
  </dialog>, document.body);
}

export function RoomPhotoGallery({ photos }: { readonly photos: readonly Photo[] }) {
  const [selected, setSelected] = useState<number | null>(null);
  return <>
    <div className="workshop-room-gallery">{photos.map((photo, index) => <figure key={photo.src}>
      <button type="button" className="room-photo-open" onClick={() => setSelected(index)} aria-label={`Enlarge photograph: ${photo.caption}`}><img src={photo.src} alt={photo.caption} loading="lazy" /><span aria-hidden="true"><OfficeIcon name="expand" /></span></button>
      <figcaption>{photo.caption}</figcaption>
    </figure>)}</div>
    {selected !== null && <PhotoViewer photos={photos} initial={selected} onClose={() => setSelected(null)} />}
  </>;
}
