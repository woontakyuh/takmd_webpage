import { useEffect, useState } from 'react';
import { SlideViewer } from './SlideViewer';
import { presentationNavigation, talkMedia } from './collection';
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
  const [viewerOpen, setViewerOpen] = useState(false);
  const [year, setYear] = useState('all');
  const [slidesOnly, setSlidesOnly] = useState(false);
  const years = [...new Set(presentations.map(talk => talk.date.slice(0, 4)))].sort().reverse();
  const media = talkMedia.find(media => media.id === selected?.id);
  const photos = media?.kind === 'photos';
  const slides = media?.slides ?? [];
  const slide = slides[slideIndex];
  const nextPage = slides[slideIndex + 1]?.src;
  useEffect(() => {
    if (nextPage) { const image = new Image(); image.src = nextPage; }
  }, [nextPage]);
  useEffect(() => setViewerOpen(false), [selected?.id]);
  const visible = presentations.filter(talk => (year === 'all' || talk.date.startsWith(year)) && (!slidesOnly || talkMedia.some(media => media.id === talk.id)));
  const navigation = presentationNavigation(presentations, selected?.id);
  const today = new Date().toISOString().slice(0, 10);
  return <div className="teaching-reader" data-active-talk={selected?.id}>
    {selected ? <>
      <nav className="folio-paging" aria-label="Browse presentations"><span>Event {navigation.index + 1} / {navigation.total}</span><div>
        <button aria-label="Previous presentation" disabled={!navigation.previous} onClick={() => { if (navigation.previous) onSelect(navigation.previous.id); }}>←</button>
        <button aria-label="Next presentation" disabled={!navigation.next} onClick={() => { if (navigation.next) onSelect(navigation.next.id); }}>→</button>
      </div></nav>
      <button className="reader-back" onClick={() => onSelect(null)}>← All events</button>
      <div className="studio-paper-meta"><span>{selected.date}</span>{selected.date > today && <span>Upcoming</span>}</div>
      <h3 className="reader-detail-title">{(selected.topic || selected.title).split(' · ').map((topic, index) => <span className="reader-topic" key={index}>{topic}</span>)}</h3>
      <p className="studio-panel-intro">{photos && media.role ? `${media.role} · ` : ''}{selected.title}{selected.venue && ' · ' + selected.venue}</p>
      {slide ? <>
        <div className="folio-paging"><span role="status">{slideIndex + 1} / {slides.length} · {photos ? 'Event photos' : 'On the wall TV'}</span><div>
          <button aria-label={photos ? 'Previous event photo' : 'Previous presentation slide'} disabled={slideIndex === 0} onClick={() => onSlide(slideIndex - 1)}>←</button>
          <button aria-label={photos ? 'Next event photo' : 'Next presentation slide'} disabled={slideIndex === slides.length - 1} onClick={() => onSlide(slideIndex + 1)}>→</button>
        </div></div>
        <figure className="talk-slide" key={slide.src}><button className="slide-open" onClick={() => setViewerOpen(true)} aria-label={photos ? 'Open event photo viewer' : 'Open presentation slide viewer'}><img src={slide.src} alt={slide.caption} width={slide.width ?? 1280} height={slide.height ?? 720} decoding="async" /><span>View larger ↗</span></button><figcaption>{slide.caption}</figcaption></figure>
        {slides.length > 1 && <nav className="slide-strip" aria-label={photos ? 'Event photos' : 'Presentation slides'}>{slides.map((item, index) => <button key={item.src} aria-label={(photos ? 'Show event photo ' : 'Show presentation slide ') + (index + 1)} aria-pressed={index === slideIndex} onClick={() => onSlide(index)}><img src={item.thumbnail ?? item.src} alt="" width={160} height={90} loading="lazy" decoding="async" /><span>{String(index + 1).padStart(2, '0')}</span></button>)}</nav>}
        <p className="studio-meta">{photos ? 'Event photo record' : media?.kind === 'full' ? 'Complete presentation' : 'Selected slides'} · The wall TV follows your selection.</p>
      </> : <div className="reader-record"><span className="studio-kicker">Presentation record</span><p>The wall TV shows the topic and event details. Slide previews are not available for this presentation.</p></div>}
    </> : <>
      <p className="studio-panel-intro">Select an event to put its slides or photos on the wall TV.</p>
      <div className="reader-filter"><label htmlFor="talk-year">Year</label><select id="talk-year" value={year} onChange={event => setYear(event.target.value)}><option value="all">All years</option>{years.map(value => <option key={value}>{value}</option>)}</select><span>{visible.length} presentations</span></div>
      <button className="reader-preview-filter" aria-pressed={slidesOnly} onClick={() => setSlidesOnly(value => !value)}>With slides or photos <span>{talkMedia.length}</span></button>
      <div className="reader-list">{visible.map(talk => <button key={talk.id} className="reader-record-button" onClick={() => onSelect(talk.id)}>
        <span className="studio-paper-meta"><span>{talk.date}</span><span>{talk.date > today ? 'Upcoming' : talkMedia.some(media => media.id === talk.id) ? 'View slides' : 'View details'}</span></span>
        <strong>{talk.title}</strong><span>{talk.topic}</span><span className="reader-row-arrow" aria-hidden="true">↗</span>
      </button>)}</div>
      {visible.length === 0 && <div className="studio-empty"><p>No presentations match these filters.</p><button className="studio-text-link" onClick={() => { setYear('all'); setSlidesOnly(false); }}>Clear filters ↗</button></div>}
      <p className="folio-snapshot">Presentation record from Notion · {updatedAt}</p>
    </>}
    {viewerOpen && selected && <SlideViewer title={selected.topic || selected.title} slides={slides} index={slideIndex} onSlide={onSlide} onClose={() => setViewerOpen(false)} mediaLabel={photos ? 'photo' : 'slide'} />}
  </div>;
}
