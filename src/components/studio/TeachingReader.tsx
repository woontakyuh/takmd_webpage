import { useState } from 'react';
import { talkMedia } from './collection';
import type { Presentation } from './types';

type Props = {
  readonly presentations: readonly Presentation[];
  readonly selected: Presentation | null;
  readonly onSelect: (id: string | null) => void;
  readonly slideIndex: number;
  readonly onSlide: (index: number) => void;
  readonly updatedAt: string;
};

export function TeachingReader({ presentations, selected, onSelect, slideIndex, onSlide, updatedAt }: Props) {
  const [year, setYear] = useState('all');
  const [slidesOnly, setSlidesOnly] = useState(false);
  const years = [...new Set(presentations.map(talk => talk.date.slice(0, 4)))].sort().reverse();
  const slides = talkMedia.find(media => media.id === selected?.id)?.slides ?? [];
  const slide = slides[slideIndex];
  const visible = presentations.filter(talk => (year === 'all' || talk.date.startsWith(year)) && (!slidesOnly || talkMedia.some(media => media.id === talk.id)));
  const today = new Date().toISOString().slice(0, 10);
  return <div className="teaching-reader" data-active-talk={selected?.id}>
    {selected ? <>
      <button className="reader-back" onClick={() => onSelect(null)}>← All presentations</button>
      <div className="studio-paper-meta"><span>{selected.date}</span>{selected.date > today && <span>Upcoming</span>}</div>
      <h3 className="reader-detail-title">{selected.topic || selected.title}</h3>
      <p className="studio-panel-intro">{selected.title}{selected.venue && ' · ' + selected.venue}</p>
      {slide ? <>
        <div className="folio-paging"><span role="status">{slideIndex + 1} / {slides.length} · On the board</span><div>
          <button aria-label="Previous presentation slide" disabled={slideIndex === 0} onClick={() => onSlide(slideIndex - 1)}>←</button>
          <button aria-label="Next presentation slide" disabled={slideIndex === slides.length - 1} onClick={() => onSlide(slideIndex + 1)}>→</button>
        </div></div>
        <figure className="talk-slide" key={slide.src}><a href={slide.src} target="_blank" rel="noreferrer" aria-label="Open presentation slide image"><img src={slide.src} alt={slide.caption} width={1280} height={720} /></a><figcaption>{slide.caption}</figcaption></figure>
        {slides.length > 1 && <nav className="slide-strip" aria-label="Presentation slides">{slides.map((item, index) => <button key={item.src} aria-label={'Show presentation slide ' + (index + 1)} aria-pressed={index === slideIndex} onClick={() => onSlide(index)}><img src={item.src} alt="" width={160} height={90} /><span>{String(index + 1).padStart(2, '0')}</span></button>)}</nav>}
        <p className="studio-meta">Selected slides · The board follows your selection.</p>
      </> : <div className="reader-record"><span className="studio-kicker">Presentation record</span><p>The board shows the topic and event details. Slide previews are not available for this presentation.</p></div>}
    </> : <>
      <p className="studio-panel-intro">Select a presentation to put it on the board.</p>
      <div className="reader-filter"><label htmlFor="talk-year">Year</label><select id="talk-year" value={year} onChange={event => setYear(event.target.value)}><option value="all">All years</option>{years.map(value => <option key={value}>{value}</option>)}</select><span>{visible.length} presentations</span></div>
      <button className="reader-preview-filter" aria-pressed={slidesOnly} onClick={() => setSlidesOnly(value => !value)}>With slides <span>{talkMedia.length}</span></button>
      <div className="reader-list">{visible.map(talk => <button key={talk.id} className="reader-record-button" onClick={() => onSelect(talk.id)}>
        <span className="studio-paper-meta"><span>{talk.date}</span><span>{talk.date > today ? 'Upcoming' : talkMedia.some(media => media.id === talk.id) ? 'View slides' : 'View details'}</span></span>
        <strong>{talk.title}</strong><span>{talk.topic}</span><span className="reader-row-arrow" aria-hidden="true">↗</span>
      </button>)}</div>
      {visible.length === 0 && <div className="studio-empty"><p>No presentations match these filters.</p><button className="studio-text-link" onClick={() => { setYear('all'); setSlidesOnly(false); }}>Clear filters ↗</button></div>}
      <p className="folio-snapshot">Presentation record from Notion · {updatedAt}</p>
    </>}
  </div>;
}
