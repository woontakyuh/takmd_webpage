import { useEffect, useRef } from 'react';
import { OfficeIcon } from './OfficeIcon';

import type { PhotoMemory } from './photoMemories';

export function MemoryPhoto({ memory, onClose }: { readonly memory: PhotoMemory; readonly onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const returnFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (returnFocus instanceof HTMLElement && returnFocus !== document.body) returnFocus.focus({ preventScroll: true });
      else document.querySelector<HTMLElement>('.studio-scene')?.focus({ preventScroll: true });
    };
  }, []);

  return <dialog ref={dialogRef} className="office-memory" aria-labelledby="office-memory-title" lang="ko"
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => {
      if (event.target !== event.currentTarget) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
    }}>
    <div className="office-memory-top"><span>{memory.kicker}</span><button className="studio-icon-button" onClick={onClose} aria-label="사진 닫기" autoFocus><OfficeIcon name="close" /></button></div>
    <figure>
      <img src={memory.src} width={memory.width} height={memory.height} alt={memory.alt} />
      <figcaption>
        <h2 id="office-memory-title">{memory.title}{memory.heart && <> <span aria-label="하트">❤️</span></>}</h2>
        {memory.occasion && <p className="office-memory-occasion">{memory.occasion}</p>}
        {(memory.dateLabel || memory.place) && <p className="office-memory-meta">
          {memory.dateLabel && <time dateTime={memory.dateTime}>{memory.dateLabel}</time>}
          {memory.place && <span>{memory.place}</span>}
        </p>}
        {memory.people && <p className="office-memory-people">{memory.people}</p>}
      </figcaption>
    </figure>
  </dialog>;
}
