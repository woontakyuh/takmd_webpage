import { useEffect, useRef, useState } from 'react';
import type { ExhibitId, OfficeCollection, StudioContent } from './types';
import { TeachingReader } from './TeachingReader';
import { CvReader } from './CvReader';
import { OfficeDetails, officeDetailsTitle } from './OfficeDetails';
import { ResearchFolio } from './ResearchFolio';
import { OfficeIcon } from './OfficeIcon';
import { AiReader } from './AiReader';
import { PersonalReader } from './PersonalReader';
import { folioReadingPanelLeft } from './scene/folioFocus';

const titles = {
  spine: 'Precision, in practice.',
  research: 'The research folio.',
  education: 'Knowledge, shared.',
  ai: 'Curriculum Vitae',
  projects: 'AI, in practice.',
  family: 'Family.',
  award: 'KOSESS Best Shorts Award',
  bjj: 'Jiu-jitsu.',
  surfing: 'Surfing.',
} as const;

type Props = StudioContent & {
  readonly detailsPath?: string | null;
  readonly selected: Exclude<ExhibitId, 'family' | 'award-photo' | 'books' | 'bookshelf'> | null;
  readonly collection: OfficeCollection;
  readonly onPaper: (id: string) => void;
  readonly onTalk: (id: string | null) => void;
  readonly talkSlideIndex: number;
  readonly onTalkSlide: (index: number) => void;
  readonly onClose: () => void;
};

export function ReadingPanel({ selected, detailsPath, publications, presentations, updatedAt, presentationsUpdatedAt, collection, onPaper, onTalk, talkSlideIndex, onTalkSlide, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [folioLeft, setFolioLeft] = useState<number>();
  const active = detailsPath || selected;
  const researchFocused = !detailsPath && selected === 'research';
  const screenFocused = !detailsPath && (selected === 'education' || selected === 'ai');
  const modal = expanded || screenFocused;
  const resetScroll = () => dialogRef.current?.scrollTo({ top: 0 });

  useEffect(() => { setExpanded(false); dialogRef.current?.scrollTo({ top: 0 }); }, [active]);

  useEffect(() => {
    if (selected !== 'research') return;
    const place = () => setFolioLeft(folioReadingPanelLeft(window.innerWidth, window.innerHeight));
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [selected]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (active && dialog.open && dialog.matches(':modal') !== modal) dialog.close();
    if (active && !dialog.open) {
      if (modal) dialog.showModal();
      else dialog.show();
      dialog.querySelector<HTMLButtonElement>('[data-reader-close]')?.focus({ preventScroll: true });
    }
    if (!active && dialog.open) dialog.close();
    if (!active) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      const modal = document.querySelector('dialog:modal');
      if (modal && modal !== dialog) return;
      if (event.key === 'Escape' && !event.defaultPrevented) { event.preventDefault(); onClose(); }
    };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', onKey); };
  }, [active, modal, onClose]);

  return (
    <dialog
      ref={dialogRef}
      className="studio-dialog"
      style={!detailsPath && selected === 'research' && !expanded && folioLeft !== undefined ? { left: folioLeft, right: 'auto' } : undefined}
      data-exhibit={detailsPath ? 'details' : selected}
      data-expanded={expanded}
      data-screen-focus={screenFocused}
      aria-modal={modal}
      aria-labelledby="studio-panel-title"
      onCancel={event => { event.preventDefault(); onClose(); }}
      onClick={event => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
      }}
    >
      {active && <>
        <div className="studio-panel-top">
          {researchFocused ? <h2 id="studio-panel-title">Research folio</h2> : <span className="studio-kicker">TakMD / {detailsPath ? 'Office collection' : selected === 'spine' ? 'Clinical practice' : selected === 'ai' ? 'CV' : selected}</span>}
          <div className="studio-panel-actions">
            {!screenFocused && <button className="studio-icon-button" onClick={() => setExpanded(value => !value)} aria-label={expanded ? 'Return to side reader' : 'Expand reading view'}><OfficeIcon name={expanded ? 'collapse' : 'expand'} /></button>}
            <button className="studio-icon-button" onClick={onClose} aria-label="Close and return to office" data-reader-close><OfficeIcon name="close" /></button>
          </div>
        </div>
        {!researchFocused && <h2 id="studio-panel-title">{detailsPath ? officeDetailsTitle(detailsPath) : selected ? titles[selected] : ''}</h2>}
        {detailsPath && <OfficeDetails path={detailsPath} publications={publications} presentations={presentations} onPaper={onPaper} onTalk={id => onTalk(id)} />}
        {selected === 'research' && <ResearchFolio publications={publications} updatedAt={updatedAt} publication={collection.publication} media={collection.paperMedia} direction={collection.paperDirection} onPaper={id => { onPaper(id); resetScroll(); }} />}
        {selected === 'spine' && <OfficeDetails path="/ube" publications={publications} presentations={presentations} onPaper={onPaper} onTalk={id => onTalk(id)} />}
        {selected === 'education' && <TeachingReader presentations={presentations} selected={collection.presentation} onSelect={id => { onTalk(id); resetScroll(); }} slideIndex={talkSlideIndex} onSlide={onTalkSlide} updatedAt={presentationsUpdatedAt} />}
        {selected === 'projects' && <AiReader publications={publications} presentations={presentations} onPaper={id => { onPaper(id); resetScroll(); }} onTalk={id => { onTalk(id); resetScroll(); }} />}
        {selected === 'ai' && <CvReader publicationCount={publications.length} presentationCount={presentations.length} />}
        {(selected === 'bjj' || selected === 'surfing') && <PersonalReader interest={selected} />}
      </>}
    </dialog>
  );
}
