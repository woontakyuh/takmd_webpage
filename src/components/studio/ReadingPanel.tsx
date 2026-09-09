import { useEffect, useRef, useState } from 'react';
import type { ExhibitId, OfficeCollection, StudioContent } from './types';
import { TeachingReader } from './TeachingReader';
import { CvReader } from './CvReader';
import { ResearchFolio } from './ResearchFolio';
import { OfficeIcon } from './OfficeIcon';
import { workshops } from '../../data/workshops';
import { AiReader } from './AiReader';
import { PersonalReader } from './PersonalReader';
import { PERSONAL_LINKS } from './personal';

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
  readonly selected: Exclude<ExhibitId, 'family' | 'award-photo' | 'books' | 'bookshelf'> | null;
  readonly collection: OfficeCollection;
  readonly onPaper: (id: string) => void;
  readonly onTalk: (id: string | null) => void;
  readonly talkSlideIndex: number;
  readonly onTalkSlide: (index: number) => void;
  readonly onClose: () => void;
};

export function ReadingPanel({ selected, publications, presentations, updatedAt, presentationsUpdatedAt, collection, onPaper, onTalk, talkSlideIndex, onTalkSlide, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [expanded, setExpanded] = useState(false);
  const screenFocused = selected === 'education' || selected === 'ai';
  const modal = expanded || screenFocused;
  const resetScroll = () => dialogRef.current?.scrollTo({ top: 0 });

  useEffect(() => { setExpanded(false); }, [selected]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (selected && dialog.open && dialog.matches(':modal') !== modal) dialog.close();
    if (selected && !dialog.open) {
      if (modal) dialog.showModal();
      else dialog.show();
      dialog.querySelector<HTMLButtonElement>('[data-reader-close]')?.focus({ preventScroll: true });
    }
    if (!selected && dialog.open) dialog.close();
    if (!selected) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      const modal = document.querySelector('dialog:modal');
      if (modal && modal !== dialog) return;
      if (event.key === 'Escape' && !event.defaultPrevented) { event.preventDefault(); onClose(); }
    };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', onKey); };
  }, [selected, modal, onClose]);

  return (
    <dialog
      ref={dialogRef}
      className="studio-dialog"
      data-exhibit={selected}
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
      {selected && <>
        <div className="studio-panel-top">
          <span className="studio-kicker">TakMD / {selected === 'spine' ? 'Clinical practice' : selected === 'ai' ? 'CV' : selected}</span>
          <div className="studio-panel-actions">
            {!screenFocused && <button className="studio-icon-button" onClick={() => setExpanded(value => !value)} aria-label={expanded ? 'Return to side reader' : 'Expand reading view'}><OfficeIcon name={expanded ? 'collapse' : 'expand'} /></button>}
            <button className="studio-icon-button" onClick={onClose} aria-label="Close and return to office" data-reader-close><OfficeIcon name="close" /></button>
          </div>
        </div>
        <h2 id="studio-panel-title">{titles[selected]}</h2>
        {selected === 'award' && <>
          <p className="studio-panel-intro">Select the polished gold play button to watch the award-winning Short.</p>
          <a className="studio-panel-footer" href={PERSONAL_LINKS.awardShort} target="_blank" rel="noopener noreferrer"
            aria-label="Watch the award-winning Short on YouTube (opens in a new tab)">Watch the Short <span aria-hidden="true">↗</span></a>
        </>}
        {selected === 'research' && <ResearchFolio publications={publications} updatedAt={updatedAt} publication={collection.publication} media={collection.paperMedia} direction={collection.paperDirection} onPaper={id => { onPaper(id); resetScroll(); }} />}
        {selected === 'spine' && <>
          <p className="studio-panel-intro">Endoscopic spine surgery, with a considered approach to anatomy and technique.</p>
          <div className="studio-editorial-note"><span>Clinical focus</span><h3>Unilateral biportal endoscopy.</h3><p>A clinical and academic interest in minimally invasive spine surgery, surgical technique, and outcomes.</p></div>
          <details className="clinical-detail"><summary>Anatomy, technique & evidence</summary><p>Clinical questions continue at the desk, through publications on endoscopic approaches, surgical tools, and outcomes.</p><div className="reader-list">{publications.filter(paper => /endoscop/i.test(paper.title)).slice(0, 3).map(paper => <button key={paper.id} className="reader-record-button" onClick={() => { onPaper(paper.id); resetScroll(); }}><span className="studio-meta">{paper.journal} / {paper.year}</span><strong>{paper.title}</strong><span>Open in the research folio ↗</span></button>)}</div></details>
          <nav className="reader-list" aria-label="Workshops">{workshops.map(workshop => <a className="reader-record-button" key={workshop.slug} href={`/workshops/${workshop.slug}`}><span className="studio-meta">Workshop</span><strong>{workshop.title}</strong><span>{workshop.objectLabel} ↗</span></a>)}</nav>
          <a className="studio-panel-footer" href="/ube">Explore clinical practice <span>↗</span></a>
        </>}
        {selected === 'education' && <TeachingReader presentations={presentations} selected={collection.presentation} onSelect={id => { onTalk(id); resetScroll(); }} slideIndex={talkSlideIndex} onSlide={onTalkSlide} updatedAt={presentationsUpdatedAt} />}
        {selected === 'projects' && <AiReader publications={publications} presentations={presentations} onPaper={id => { onPaper(id); resetScroll(); }} onTalk={id => { onTalk(id); resetScroll(); }} />}
        {selected === 'ai' && <CvReader publications={publications} presentations={presentations} />}
        {(selected === 'bjj' || selected === 'surfing') && <PersonalReader interest={selected} />}
      </>}
    </dialog>
  );
}
