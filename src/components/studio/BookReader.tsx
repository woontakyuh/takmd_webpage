import { useCallback, useEffect, useRef } from 'react';
import { OfficeIcon } from './OfficeIcon';
import { personalBook, PERSONAL_BOOKS } from './personalBooks';
import { PERSONAL_BOOK_INFO } from './personalBookInfo';
import type { PersonalBookId } from './personalBooks';
import './photo-frame-info.css';
import './book-reader.css';

export function BookReader({ selectedBook, pageIndex, browsingShelf, shelfReady, onBookSelect, onPageChange, onClose }: {
  readonly selectedBook: PersonalBookId;
  readonly pageIndex: number;
  readonly browsingShelf: boolean;
  readonly shelfReady: boolean;
  readonly onBookSelect: (id: PersonalBookId) => void;
  readonly onPageChange: (index: number) => void;
  readonly onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const catalogRef = useRef<HTMLDetailsElement>(null);
  const selectionFocusFrame = useRef<number | null>(null);
  const closing = useRef(false);
  const book = personalBook(selectedBook);
  const info = PERSONAL_BOOK_INFO[selectedBook];
  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    if (window.history.state?.officeBooks) window.history.back();
    else onClose();
  }, [onClose]);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus = document.activeElement;
    closing.current = false;
    window.history.pushState({ ...window.history.state, officeBooks: true }, '', window.location.href);
    const onBack = () => onClose();
    window.addEventListener('popstate', onBack);
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
      window.removeEventListener('popstate', onBack);
      if (window.history.state?.officeBooks) {
        const { officeBooks, ...state } = window.history.state;
        window.history.replaceState(state, '', window.location.href);
      }
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [close, onClose]);

  return <dialog ref={dialogRef} className="office-frame-info office-book-reader" aria-labelledby="office-book-title"
    aria-modal="false" lang="ko" onCancel={event => { event.preventDefault(); close(); }}>
    <div className="office-frame-info-top">
      <span>책장 · {PERSONAL_BOOKS.length}권</span>
      <button className="studio-icon-button" onClick={close} aria-label={browsingShelf ? '책장에서 돌아가기' : '책을 닫고 책장에 넣기'}><OfficeIcon name="close" /></button>
    </div>
    <h2 id="office-book-title">{browsingShelf ? '책장' : book.title}</h2>
    <p className="office-frame-occasion" aria-live="polite">{browsingShelf ? (shelfReady ? '읽을 책을 골라주세요.' : '책장으로 다가가는 중입니다.') : book.author}</p>
    {!browsingShelf && <p className="office-book-publication">{info.publication}</p>}
    {!browsingShelf && <div className="office-book-pages" aria-label="책에서 보기">
      <button onClick={() => onPageChange(-1)} aria-pressed={pageIndex < 0 || book.pages.length === 0}>표지</button>
      {book.pages.map((page, index) => <button key={page.label} onClick={() => onPageChange(index)}
        aria-pressed={pageIndex === index}>{page.label}</button>)}
    </div>}
    {!browsingShelf && <div className="office-book-info" key={selectedBook}>
      <p>{info.description}</p>
      {info.details && <details className="office-book-details">
        <summary>{info.details.label}</summary>
        {info.details.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
        <a href={info.details.source.url} target="_blank" rel="noopener noreferrer"
          aria-label={`${info.details.source.label} (새 탭)`}>{info.details.source.label}<span aria-hidden="true"> ↗</span></a>
      </details>}
      <a href={info.source.url} target="_blank" rel="noopener noreferrer"
        aria-label={`${info.source.label} (새 탭)`}>{info.source.label}<span aria-hidden="true"> ↗</span></a>
    </div>}
    <details ref={catalogRef} className="office-book-catalog" open={browsingShelf || undefined}>
      <summary>{browsingShelf ? '책 선택' : '다른 책 보기'}</summary>
      <div>{PERSONAL_BOOKS.map(item => <button key={item.id} onClick={() => {
        onBookSelect(item.id);
        if (catalogRef.current) catalogRef.current.open = false;
        if (selectionFocusFrame.current !== null) cancelAnimationFrame(selectionFocusFrame.current);
        selectionFocusFrame.current = requestAnimationFrame(() => {
          dialogRef.current?.querySelector<HTMLButtonElement>('.office-book-pages button')?.focus({ preventScroll: true });
        });
      }}
        disabled={browsingShelf && !shelfReady}
        aria-pressed={selectedBook === item.id}>{item.title}</button>)}</div>
    </details>
  </dialog>;
}
