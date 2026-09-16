import { Html } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { talkMedia, talkNavigation } from '../collection';
import { publicHighResolutionSlide } from '../publicSlideSource';
import { SlideViewer } from '../SlideViewer';
import { OfficeIcon } from '../OfficeIcon';
import type { Presentation, TalkSlide } from '../types';
import { tvReadingSize, WALL_TV } from './config';
import '../tv-screen-reader.css';

type Props = {
  readonly active: boolean;
  readonly hovered: boolean;
  readonly talk: Presentation | null;
  readonly slide: TalkSlide | null;
  readonly presentations: readonly Presentation[];
  readonly onTalk: (id: string | null) => void;
  readonly onSlide: (index: number) => void;
  readonly onClose: () => void;
};

// The television behaves like a television: it shows one lecture, and its arrows change lecture.
// Reading a deck is a separate, full-screen job, so the slides open in the shared viewer.
export function TvScreenReader({ active, hovered, talk, slide, presentations, onTalk, onSlide, onClose }: Props) {
  const size = useThree(state => state.size);
  const width = tvReadingSize(size.width, size.height);
  const small = width < 700;
  const contentStyle: CSSProperties & { readonly '--tv-control-scale': number } = {
    width: 1600, height: 900, transform: `scale(${width / 1600})`, transformOrigin: 'top left', '--tv-control-scale': 1600 / width,
  };
  const [viewerOpen, setViewerOpen] = useState(false);
  const [loadedSource, setLoadedSource] = useState('');
  const [failedSource, setFailedSource] = useState('');
  const reader = useRef<HTMLElement>(null);
  const focusClose = useCallback((button: HTMLButtonElement | null) => {
    if (!button || !active) return;
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      button.focus({ preventScroll: true });
      observer.disconnect();
    });
    observer.observe(button);
    return () => observer.disconnect();
  }, [active]);
  const media = talkMedia.find(item => item.id === talk?.id);
  const slides = media?.slides ?? [];
  const photos = media?.kind === 'photos';
  const index = Math.max(0, slides.findIndex(item => item.src === slide?.src));
  const showing = slides[index];
  const source = showing && (active && media?.kind === 'full' ? publicHighResolutionSlide(showing) ?? showing.src : showing.src);
  const lectures = talkNavigation(presentations, talk?.id);
  const openViewer = () => { if (slides.length) setViewerOpen(true); };

  useEffect(() => setViewerOpen(false), [talk?.id]);
  useEffect(() => { if (!active) setViewerOpen(false); }, [active]);

  useEffect(() => {
    if (!active) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [active]);

  useEffect(() => {
    if (!active || viewerOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return; }
      const lecture = event.key === 'ArrowRight' ? lectures.next : event.key === 'ArrowLeft' ? lectures.previous : null;
      if (!lecture) return;
      event.preventDefault();
      onTalk(lecture.id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, viewerOpen, lectures.next, lectures.previous, onTalk, onClose]);

  return <Html wrapperClass="tv-screen-portal" center pointerEvents={active ? 'auto' : 'none'} style={{ pointerEvents: active ? 'auto' : 'none' }}
    distanceFactor={WALL_TV.screenWidth * size.height / width} position={[0, .003, WALL_TV.depth / 2 + .0012]} zIndexRange={[20, 16]} occlude>
    <section ref={reader} className="tv-screen-reader" aria-label="Wall TV" data-small={small} data-active={active} data-hovered={hovered}
      inert={!active} data-talk={talk?.id} style={{ width, height: width * WALL_TV.screenHeight / WALL_TV.screenWidth }}
      onPointerDown={event => event.stopPropagation()} onWheel={event => event.stopPropagation()}>
      {active && <header className="tv-screen-header">
        <button ref={focusClose} onClick={onClose} aria-label="Close and return to office"><OfficeIcon name="close" /></button>
        <span className="tv-screen-title">{talk?.title || 'Talks & teaching'}</span>
      </header>}
      <div className="tv-screen-content" style={contentStyle}>
        <div className="tv-screen-stage">
          <div className="tv-screen-image" data-photos={photos}>
            {showing && source
              ? <button className="tv-screen-open" onClick={openViewer} aria-label={photos ? 'Open the event photos full screen' : 'Open the slides full screen'}>
                <img key={source} src={source} alt={showing.caption} width={showing.width ?? 1920} height={showing.height ?? 1080}
                  draggable={false} decoding="async" fetchPriority="high" onLoad={() => setLoadedSource(source)} onError={() => setFailedSource(source)} />
                {loadedSource !== source && <span className="tv-screen-loading" role="status">{failedSource === source ? 'Image unavailable.' : 'Loading image…'}</span>}
              </button>
              : <div className="tv-screen-record"><p>{talk?.date}</p><h2>{talk?.topic || talk?.title}</h2><p>{talk?.title} · {talk?.venue}</p><small>Event record · Slides have not been added yet.</small></div>}
            {lectures.total > 1 && <>
              <button className="tv-page-arrow tv-page-arrow-previous" aria-label="Previous lecture"
                disabled={!lectures.previous} onClick={() => { if (lectures.previous) onTalk(lectures.previous.id); }}>‹</button>
              <button className="tv-page-arrow tv-page-arrow-next" aria-label="Next lecture"
                disabled={!lectures.next} onClick={() => { if (lectures.next) onTalk(lectures.next.id); }}>›</button>
            </>}
          </div>
          <footer className="tv-screen-context">
            <div><strong>{talk?.topic || talk?.title}</strong><span>{[talk?.date, talk?.venue].filter(Boolean).join(' · ')}</span></div>
            <button disabled={!slides.length} onClick={openViewer}
              aria-label={photos ? 'Open the event photos full screen' : 'Open the slides full screen'}>
              <span role="status">{lectures.index >= 0 ? `${lectures.index + 1} / ${lectures.total}` : 'Record'}</span>
              <small>{slides.length ? `${slides.length} ${photos ? 'photos' : 'slides'}` : 'Record'}</small>
            </button>
          </footer>
        </div>
      </div>
      {viewerOpen && showing && <SlideViewer title={talk?.topic || talk?.title || 'Presentation'} slides={slides} index={index}
        onSlide={onSlide} onClose={() => setViewerOpen(false)} mediaLabel={photos ? 'photo' : 'slide'}
        highResolutionSource={media?.kind === 'full' ? publicHighResolutionSlide : undefined} />}
    </section>
  </Html>;
}
