import { useEffect, useRef } from 'react';
import { OfficeIcon } from './OfficeIcon';
import type { PhotoMemory } from './photoMemories';
import { awardPairReadingLayout } from './scene/awardPairReading';
import './photo-frame-info.css';

export function PhotoFrameInfo({ memory, onClose, variant = 'frame' }: {
  readonly memory: PhotoMemory;
  readonly onClose: () => void;
  readonly variant?: 'frame' | 'award-pair';
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.show();
    dialog.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || document.querySelector('dialog:modal')) return;
      event.preventDefault();
      onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [memory.src, onClose]);

  useEffect(() => {
    if (variant !== 'award-pair') return;
    const placeCaption = () => {
      const layout = awardPairReadingLayout(window.innerWidth, window.innerHeight);
      dialogRef.current?.style.setProperty('--award-caption-top', `${layout.captionTop}px`);
    };
    placeCaption();
    window.addEventListener('resize', placeCaption);
    return () => window.removeEventListener('resize', placeCaption);
  }, [variant]);

  return <dialog ref={dialogRef} className={`office-frame-info office-frame-info--${variant === 'award-pair' ? 'award-pair' : 'family'}`} aria-labelledby="office-frame-title"
    aria-describedby="office-frame-description" aria-modal="false" lang="en"
    onCancel={event => { event.preventDefault(); onClose(); }}>
    <div className="office-frame-info-top">
      <span>{memory.kicker}</span>
      <button className="studio-icon-button" onClick={onClose} aria-label="Close photo frame"><OfficeIcon name="close" /></button>
    </div>
    <h2 id="office-frame-title">{memory.title}</h2>
    <p id="office-frame-description" className="studio-sr-only">{memory.alt}</p>
    {memory.occasion && <p className="office-frame-occasion">{memory.occasion}</p>}
    <div className="office-frame-meta">
      {memory.dateLabel && <time dateTime={memory.dateTime}>{memory.dateLabel}</time>}
      {memory.place && <p>{memory.place}</p>}
    </div>
    {memory.people && <p className="office-frame-people">{memory.people}</p>}
  </dialog>;
}
