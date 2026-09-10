import { Html } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useCallback, useEffect, useRef, useState } from 'react';
import { talkMedia } from '../collection';
import { publicHighResolutionSlide } from '../publicSlideSource';
import { OfficeIcon } from '../OfficeIcon';
import type { Presentation, TalkSlide } from '../types';
import { tvReadingSize, WALL_TV } from './config';
import { TvLectureTree } from './TvLectureTree';
import '../tv-screen-reader.css';

type Props = {
  readonly talk: Presentation | null;
  readonly slide: TalkSlide | null;
  readonly presentations: readonly Presentation[];
  readonly onTalk: (id: string | null) => void;
  readonly onSlide: (index: number) => void;
  readonly onClose: () => void;
};

export function TvScreenReader({ talk, slide, presentations, onTalk, onSlide, onClose }: Props) {
  const size = useThree(state => state.size);
  const width = tvReadingSize(size.width, size.height);
  const small = width < 700;
  const [treeOpen, setTreeOpen] = useState(false);
  const [railOpen, setRailOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [loadedSource, setLoadedSource] = useState('');
  const [failedSource, setFailedSource] = useState('');
  const reader = useRef<HTMLElement>(null);
  const focusClose = useCallback((button: HTMLButtonElement | null) => {
    if (!button) return;
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      button.focus({ preventScroll: true });
      observer.disconnect();
    });
    observer.observe(button);
    return () => observer.disconnect();
  }, []);
  const media = talkMedia.find(item => item.id === talk?.id);
  const slides = media?.slides ?? [];
  const current = Math.max(0, slides.findIndex(item => item.src === slide?.src));
  const activeSlide = slides[current];
  const source = activeSlide && (media?.kind === 'full' ? publicHighResolutionSlide(activeSlide) ?? activeSlide.src : activeSlide.src);
  const photos = media?.kind === 'photos';
  const close = onClose;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key === 'Escape') { event.preventDefault(); close(); return; }
      if (event.target instanceof HTMLElement && event.target.closest('select, input, textarea, .tv-lecture-tree')) return;
      const next = event.key === 'ArrowRight' ? current + 1 : event.key === 'ArrowLeft' ? current - 1
        : event.key === 'Home' ? 0 : event.key === 'End' ? slides.length - 1 : null;
      if (next === null) return;
      event.preventDefault();
      if (next >= 0 && next < slides.length) onSlide(next);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close, current, onSlide, slides.length]);

  useEffect(() => {
    reader.current?.querySelector('.tv-screen-thumbnails [aria-current="page"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [current, railOpen, talk?.id]);

  return <Html transform distanceFactor={400 * WALL_TV.screenWidth / width}
    position={[0, .003, WALL_TV.depth / 2 + .0012]} zIndexRange={[20, 16]} occlude>
    <section ref={reader} className="tv-screen-reader" aria-label="Wall TV reader" data-small={small} data-rail={railOpen} data-tree={treeOpen} data-info={infoOpen} data-short-wide={size.width > size.height && size.height < 560}
      data-talk={talk?.id} style={{ width, height: width * WALL_TV.screenHeight / WALL_TV.screenWidth }}
      onPointerDown={event => event.stopPropagation()} onWheel={event => event.stopPropagation()}>
      <header className="tv-screen-header">
        <button ref={focusClose} onClick={close} aria-label="Close and return to office"><OfficeIcon name="close" /></button>
        {small && <button aria-label="Browse lectures" aria-expanded={treeOpen} onClick={() => { setTreeOpen(value => !value); setRailOpen(false); setInfoOpen(false); }}>Lectures</button>}
        <span className="tv-screen-title">{talk?.title || 'Talks & teaching'}</span>
        <button aria-label="Show lecture information" aria-expanded={infoOpen} onClick={() => { setInfoOpen(value => !value); setRailOpen(false); setTreeOpen(false); }}>About</button>
      </header>
      <div className="tv-screen-content">
        <TvLectureTree presentations={presentations} selected={talk?.id} onSelect={id => { onTalk(id); setTreeOpen(false); setRailOpen(false); setInfoOpen(false); }} />
        <div className="tv-screen-stage">
        <div className="tv-screen-image" data-photos={photos}>
          {activeSlide && source ? <>
            <img key={source} src={source} alt={activeSlide.caption} width={activeSlide.width ?? 1920} height={activeSlide.height ?? 1080}
              draggable={false} decoding="async" fetchPriority="high" onLoad={() => setLoadedSource(source)} onError={() => setFailedSource(source)} />
            {loadedSource !== source && <span className="tv-screen-loading" role="status">{failedSource === source ? 'Image unavailable. Please try another slide.' : 'Loading image…'}</span>}
          </> : <div className="tv-screen-record"><p>{talk?.date}</p><h2>{talk?.topic || talk?.title}</h2><p>{talk?.title} · {talk?.venue}</p><small>Event record · Slides have not been added yet.</small></div>}
          {slides.length > 1 && <>
            <button className="tv-page-arrow tv-page-arrow-previous" aria-label={photos ? 'Previous event photo' : 'Previous presentation slide'}
              disabled={current === 0} onClick={() => onSlide(current - 1)}>‹</button>
            <button className="tv-page-arrow tv-page-arrow-next" aria-label={photos ? 'Next event photo' : 'Next presentation slide'}
              disabled={current >= slides.length - 1} onClick={() => onSlide(current + 1)}>›</button>
          </>}
        </div>
        {railOpen && slides.length > 1 && <nav className="tv-screen-thumbnails" aria-label={photos ? 'Event photos' : 'Presentation slides'}>
          {slides.map((item, index) => <button key={item.src} aria-label={`${photos ? 'Show event photo' : 'Show presentation slide'} ${index + 1}`}
            aria-current={index === current ? 'page' : undefined} onClick={() => { onSlide(index); setRailOpen(false); }}>
            <img src={item.thumbnail ?? item.src} alt="" width={160} height={90} loading="lazy" decoding="async" /><span>{index + 1}</span>
          </button>)}
        </nav>}
        {infoOpen && <article className="tv-screen-details" aria-label="Lecture information">
          <p>{[talk?.date, media?.role].filter(Boolean).join(' · ')}</p>
          <h2>{talk?.topic || talk?.title}</h2><p>{talk?.title}</p><p>{talk?.venue}</p>
          {activeSlide && <p>{activeSlide.caption}</p>}
          {!slides.length && <p>Event record. Slides have not been added yet.</p>}
        </article>}
        <footer className="tv-screen-context">
          <div><strong>{talk?.topic || talk?.title}</strong><span>{[talk?.date, talk?.venue].filter(Boolean).join(' · ')}</span></div>
          <button disabled={slides.length < 2} aria-label="Toggle slide thumbnails" aria-expanded={railOpen}
            onClick={() => { setRailOpen(value => !value); setInfoOpen(false); }}>
            <span role="status">{slides.length ? `${current + 1} / ${slides.length}` : 'Record'}</span><small>{photos ? 'Photos' : 'Slides'}</small>
          </button>
        </footer>
        </div>
      </div>
      <a className="tv-screen-teaching-link" href="/education#overview">Teaching & training</a>
    </section>
  </Html>;
}
