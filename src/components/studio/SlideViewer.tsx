import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { TalkSlide } from './types';

type Props = {
  readonly title: string;
  readonly slides: readonly TalkSlide[];
  readonly index: number;
  readonly onSlide: (index: number) => void;
  readonly onClose: () => void;
  readonly mediaLabel?: 'slide' | 'photo';
  readonly highResolutionSource?: (slide: TalkSlide) => string | undefined;
};

export function SlideViewer({ title, slides, index, onSlide, onClose, mediaLabel = 'slide', highResolutionSource }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  const slide = slides[index];
  if (!slide) return null;
  const highResolutionSlide = highResolutionSource?.(slide);
  return createPortal(<dialog ref={dialog} className="slide-viewer" aria-labelledby="slide-viewer-title"
    onCancel={event => { event.preventDefault(); event.stopPropagation(); onClose(); }}
    onKeyDown={event => {
      event.stopPropagation();
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
      if (event.key === 'ArrowLeft' && index > 0) { event.preventDefault(); onSlide(index - 1); }
      if (event.key === 'ArrowRight' && index < slides.length - 1) { event.preventDefault(); onSlide(index + 1); }
    }}>
    <header><h2 id="slide-viewer-title">{title}</h2><button onClick={onClose} aria-label={`Close ${mediaLabel} viewer`}>×</button></header>
    <figure><img src={slide.src} srcSet={highResolutionSlide ? `${slide.src} 1920w, ${highResolutionSlide} 3840w` : undefined} sizes="calc(100vw - 72px)" alt={slide.caption} width={slide.width ?? 1920} height={slide.height ?? 1080} decoding="async" /></figure>
    <footer><button disabled={index === 0} onClick={() => onSlide(index - 1)} aria-label={`Previous ${mediaLabel} in viewer`}>←</button>
      <span role="status">{index + 1} / {slides.length}</span>
      <button disabled={index === slides.length - 1} onClick={() => onSlide(index + 1)} aria-label={`Next ${mediaLabel} in viewer`}>→</button></footer>
  </dialog>, document.body);
}
