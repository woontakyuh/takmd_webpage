import { useEffect, useRef } from 'react';
import { OfficeIcon } from './OfficeIcon';

export function MemoryPhoto({ onClose }: { readonly onClose: () => void }) {
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
    <div className="office-memory-top"><span>우리만의 첫 번째 이스터에그</span><button className="studio-icon-button" onClick={onClose} aria-label="사진 닫기" autoFocus><OfficeIcon name="close" /></button></div>
    <figure>
      <img src="/studio/memories/ppomppu.webp" width={1800} height={1399} alt="서래본갈비에서 함께한 여운탁, 고용산, 박용진. 왼쪽부터 순서대로." />
      <figcaption>
        <h2 id="office-memory-title">뽐뿌방 <span aria-label="하트">❤️</span></h2>
        <p className="office-memory-occasion">KOSESS 2026 뒷풀이</p>
        <p className="office-memory-meta"><time dateTime="2026-08-29T20:13:39">2026.08.29 · 20:13</time><span>서래본갈비</span></p>
        <p className="office-memory-people">왼쪽부터 여운탁 · 고용산 · 박용진</p>
      </figcaption>
    </figure>
  </dialog>;
}
