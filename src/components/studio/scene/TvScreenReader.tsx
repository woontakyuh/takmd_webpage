import { Html } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useCallback, useEffect, useRef, useState } from 'react';
import { presentationNavigation, talkMedia } from '../collection';
import { publicHighResolutionSlide } from '../publicSlideSource';
import type { Presentation, TalkSlide } from '../types';
import { tvReadingSize, WALL_TV } from './config';
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
  const small = width < 560;
  const [railOpen, setRailOpen] = useState(false);
  const [loadedSource, setLoadedSource] = useState('');
  const [failedSource, setFailedSource] = useState('');
  const returnButton = useRef<HTMLButtonElement>(null);
  const media = talkMedia.find(item => item.id === talk?.id);
  const slides = media?.slides ?? [];
  const current = Math.max(0, slides.findIndex(item => item.src === slide?.src));
  const activeSlide = slides[current];
  const source = activeSlide && (media?.kind === 'full' ? publicHighResolutionSlide(activeSlide) ?? activeSlide.src : activeSlide.src);
  const navigation = presentationNavigation(presentations, talk?.id);
  const photos = media?.kind === 'photos';
  const close = useCallback(() => {
    if (window.history.state?.officeTv) window.history.back();
    else onClose();
  }, [onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.history.pushState({ ...window.history.state, officeTv: true }, '', window.location.href);
    const onBack = () => onClose();
    window.addEventListener('popstate', onBack);
    returnButton.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('popstate', onBack);
      if (window.history.state?.officeTv) window.history.back();
    };
  }, [onClose]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key === 'Escape') { event.preventDefault(); close(); return; }
      if (event.target instanceof HTMLElement && event.target.closest('select, input, textarea')) return;
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
    document.querySelector('.tv-screen-thumbnails [aria-current="page"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [current, railOpen, talk?.id]);

  return <Html transform distanceFactor={400 * WALL_TV.screenWidth / width}
    position={[0, .003, WALL_TV.depth / 2 + .0012]} zIndexRange={[20, 16]} occlude>
    <section className="tv-screen-reader" aria-label="Wall TV reader" data-small={small} data-rail={railOpen} data-short-wide={size.width > size.height && size.height < 560}
      data-talk={talk?.id} style={{ width, height: width * WALL_TV.screenHeight / WALL_TV.screenWidth }}
      onPointerDown={event => event.stopPropagation()} onWheel={event => event.stopPropagation()}>
      <header className="tv-screen-header">
        <button ref={returnButton} onClick={close} aria-label="Back to office">← <span>Office</span></button>
        <select aria-label="Choose presentation" value={talk?.id ?? ''} onChange={event => { onTalk(event.target.value); setRailOpen(false); }}>
          {presentations.map(item => <option key={item.id} value={item.id}>{item.date} · {item.title} {item.topic ? `· ${item.topic}` : ''}{talkMedia.some(media => media.id === item.id && media.slides.length) ? '' : ' · Event record only'}</option>)}
        </select>
        <button aria-label="Previous presentation" disabled={!navigation.previous} onClick={() => { if (navigation.previous) onTalk(navigation.previous.id); }}>‹</button>
        <button aria-label="Next presentation" disabled={!navigation.next} onClick={() => { if (navigation.next) onTalk(navigation.next.id); }}>›</button>
      </header>
      <div className="tv-screen-content">
        <div className="tv-screen-image" data-photos={photos}>
          {activeSlide && source ? <>
            <img key={source} src={source} alt={activeSlide.caption} width={activeSlide.width ?? 1920} height={activeSlide.height ?? 1080}
              draggable={false} decoding="async" fetchPriority="high" onLoad={() => setLoadedSource(source)} onError={() => setFailedSource(source)} />
            {loadedSource !== source && <span className="tv-screen-loading" role="status">{failedSource === source ? 'Image unavailable. Please try another slide.' : 'Loading image…'}</span>}
            {photos && <p className="tv-screen-photo-caption">{[media?.role, talk?.date, talk?.venue].filter(Boolean).join(' · ')}</p>}
          </> : <div className="tv-screen-record"><p>{talk?.date}</p><h2>{talk?.topic || talk?.title}</h2><p>{talk?.title} · {talk?.venue}</p><small>Event record · Slides have not been added yet.</small></div>}
          {slides.length > 1 && <>
            <button className="tv-page-arrow tv-page-arrow-previous" aria-label={photos ? 'Previous event photo' : 'Previous presentation slide'}
              disabled={current === 0} onClick={() => onSlide(current - 1)}>‹</button>
            <button className="tv-page-arrow tv-page-arrow-next" aria-label={photos ? 'Next event photo' : 'Next presentation slide'}
              disabled={current >= slides.length - 1} onClick={() => onSlide(current + 1)}>›</button>
          </>}
        </div>
        {slides.length > 1 && <nav className="tv-screen-thumbnails" aria-label={photos ? 'Event photos' : 'Presentation slides'}>
          {slides.map((item, index) => <button key={item.src} aria-label={`${photos ? 'Show event photo' : 'Show presentation slide'} ${index + 1}`}
            aria-current={index === current ? 'page' : undefined} onClick={() => { onSlide(index); setRailOpen(false); }}>
            <img src={item.thumbnail ?? item.src} alt="" width={160} height={90} loading="lazy" decoding="async" /><span>{index + 1}</span>
          </button>)}
        </nav>}
      </div>
      <nav className="tv-screen-paging" aria-label={photos ? 'Navigate event photos' : 'Navigate presentation slides'}>
        {small && slides.length > 1
          ? <button aria-label="Toggle slide thumbnails" aria-expanded={railOpen} onClick={() => setRailOpen(value => !value)}><span role="status">{current + 1}/{slides.length}</span></button>
          : <span role="status">{slides.length ? `${current + 1} / ${slides.length}` : 'Event record'}</span>}
      </nav>
    </section>
  </Html>;
}
