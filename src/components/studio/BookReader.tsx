import { useEffect, useRef } from 'react';
import { OfficeIcon } from './OfficeIcon';
import { personalBook, PERSONAL_BOOKS } from './personalBooks';
import { PERSONAL_BOOK_INFO } from './personalBookInfo';
import type { PersonalBookId } from './personalBooks';
import './photo-frame-info.css';
import './book-reader.css';

export function BookReader({ selectedBook, pageIndex, browsingShelf, onBookSelect, onPageChange, onClose }: {
  readonly selectedBook: PersonalBookId;
  readonly pageIndex: number;
  readonly browsingShelf: boolean;
  readonly onBookSelect: (id: PersonalBookId) => void;
  readonly onPageChange: (index: number) => void;
  readonly onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const catalogRef = useRef<HTMLDetailsElement>(null);
  const selectionFocusFrame = useRef<number | null>(null);
  const book = personalBook(selectedBook);
  const info = PERSONAL_BOOK_INFO[selectedBook];
  const close = onClose;
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
      close();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(focusFrame);
      if (selectionFocusFrame.current !== null) cancelAnimationFrame(selectionFocusFrame.current);
      dialog.close();
      window.removeEventListener('keydown', onKey);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [close, onClose]);

  return <dialog ref={dialogRef} className={`office-frame-info ${browsingShelf ? 'office-bookshelf-exit' : 'office-book-reader'}`} aria-labelledby={browsingShelf ? undefined : 'office-book-title'} aria-label={browsingShelf ? 'Bookshelf view' : undefined}
    aria-modal="false" lang="en" onCancel={event => { event.preventDefault(); close(); }}>
    {browsingShelf ? <button className="studio-icon-button" onClick={close} aria-label="Return from bookshelf"><OfficeIcon name="close" /></button> : <>
    <div className="office-frame-info-top">
      <span>Personal library · {PERSONAL_BOOKS.length} books</span>
      <button className="studio-icon-button" onClick={close} aria-label="Close book and return to shelf"><OfficeIcon name="close" /></button>
    </div>
    <h2 id="office-book-title">{book.title}</h2>
    <p className="office-frame-occasion" aria-live="polite">{book.author}</p>
    <p className="office-book-publication">{info.publication}</p>
    <div className="office-book-pages" aria-label="Book pages">
      <button onClick={() => onPageChange(-1)} aria-pressed={pageIndex < 0 || book.pages.length === 0}>Cover</button>
      {book.pages.map((page, index) => <button key={page.label} onClick={() => onPageChange(index)}
        aria-pressed={pageIndex === index}>{page.label}</button>)}
    </div>
    <div className="office-book-info" key={selectedBook}>
      <p>{info.description}</p>
      {info.details && <details className="office-book-details">
        <summary>{info.details.label}</summary>
        {info.details.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
        <a href={info.details.source.url} target="_blank" rel="noopener noreferrer"
          aria-label={`${info.details.source.label} (opens in a new tab)`}>{info.details.source.label}<span aria-hidden="true"> ↗</span></a>
      </details>}
      <a href={info.source.url} target="_blank" rel="noopener noreferrer"
        aria-label={`${info.source.label} (opens in a new tab)`}>{info.source.label}<span aria-hidden="true"> ↗</span></a>
    </div>
    <details ref={catalogRef} className="office-book-catalog">
      <summary>Other books</summary>
      <div>{PERSONAL_BOOKS.map(item => <button key={item.id} onClick={() => {
        onBookSelect(item.id);
        if (catalogRef.current) catalogRef.current.open = false;
        if (selectionFocusFrame.current !== null) cancelAnimationFrame(selectionFocusFrame.current);
        selectionFocusFrame.current = requestAnimationFrame(() => {
          dialogRef.current?.querySelector<HTMLButtonElement>('.office-book-pages button')?.focus({ preventScroll: true });
        });
      }}
        aria-pressed={selectedBook === item.id}>{item.title}</button>)}</div>
    </details>
    </>}
  </dialog>;
}
