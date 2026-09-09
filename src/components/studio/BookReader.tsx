import { useEffect, useRef } from 'react';
import { OfficeIcon } from './OfficeIcon';
import { personalBook, PERSONAL_BOOKS } from './personalBooks';
import type { PersonalBookId } from './personalBooks';
import './photo-frame-info.css';
import './book-reader.css';

export function BookReader({ selectedBook, pageIndex, onBookSelect, onPageChange, onClose }: {
  readonly selectedBook: PersonalBookId;
  readonly pageIndex: number;
  readonly onBookSelect: (id: PersonalBookId) => void;
  readonly onPageChange: (index: number) => void;
  readonly onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const book = personalBook(selectedBook);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus = document.activeElement;
    dialog.show();
    const focusFrame = requestAnimationFrame(() => {
      dialog.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
    });
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || document.querySelector('dialog:modal')) return;
      event.preventDefault();
      onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(focusFrame);
      dialog.close();
      window.removeEventListener('keydown', onKey);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [onClose]);

  return <dialog ref={dialogRef} className="office-frame-info office-book-reader" aria-labelledby="office-book-title"
    aria-modal="false" lang="ko" onCancel={event => { event.preventDefault(); onClose(); }}>
    <div className="office-frame-info-top">
      <span>책장 · {PERSONAL_BOOKS.length}권</span>
      <button className="studio-icon-button" onClick={onClose} aria-label="책을 닫고 책장에 넣기"><OfficeIcon name="close" /></button>
    </div>
    <h2 id="office-book-title">{book.title}</h2>
    <p className="office-frame-occasion">{book.author}</p>
    <div className="office-book-pages" aria-label="책에서 보기">
      <button onClick={() => onPageChange(-1)} aria-pressed={pageIndex < 0 || book.pages.length === 0}>표지</button>
      {book.pages.map((page, index) => <button key={page.label} onClick={() => onPageChange(index)}
        aria-pressed={pageIndex === index}>{page.label}</button>)}
    </div>
    <details className="office-book-catalog">
      <summary>다른 책 보기</summary>
      <div>{PERSONAL_BOOKS.map(item => <button key={item.id} onClick={() => onBookSelect(item.id)}
        aria-pressed={selectedBook === item.id}>{item.title}</button>)}</div>
    </details>
  </dialog>;
}
