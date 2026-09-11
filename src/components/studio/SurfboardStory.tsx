import { useEffect, useRef } from 'react';
import { OfficeIcon } from './OfficeIcon';
import { SURFBOARD_STORY } from './personal';
import { surfboardReadingLayout } from './scene/surfboardReading';
import './scene/collection-inspection.css';
import './surfboard-story.css';

export function SurfboardPurchasePhoto() {
  return <figure className="surfboard-purchase-photo">
    <img src={SURFBOARD_STORY.photo} alt={SURFBOARD_STORY.photoAlt}
      width={SURFBOARD_STORY.photoWidth} height={SURFBOARD_STORY.photoHeight} decoding="async" />
    <figcaption>{SURFBOARD_STORY.caption}</figcaption>
  </figure>;
}

export function SurfboardStory({ onClose }: { readonly onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const place = () => {
      const layout = surfboardReadingLayout(window.innerWidth, window.innerHeight);
      element.style.width = `${layout.copyWidth}px`;
      element.style.maxHeight = `${layout.copyHeight}px`;
    };
    place();
    element.show();
    element.querySelector('button')?.focus({ preventScroll: true });
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || document.querySelector('dialog:modal')) return;
      event.preventDefault();
      onClose();
    };
    window.addEventListener('resize', place);
    window.addEventListener('keydown', escape);
    return () => {
      element.close();
      window.removeEventListener('resize', place);
      window.removeEventListener('keydown', escape);
    };
  }, [onClose]);
  return <dialog ref={dialog} className="collection-inspection-copy surfboard-story" aria-labelledby="surfboard-story-title"
    aria-modal="false" lang="en" onCancel={event => { event.preventDefault(); onClose(); }}>
    <button type="button" className="surfboard-story-close" onClick={onClose} aria-label="Close surfing story"><OfficeIcon name="close" /></button>
    <p className="collection-inspection-label">{SURFBOARD_STORY.edition}</p>
    <h2 id="surfboard-story-title">{SURFBOARD_STORY.title}</h2>
    <p className="collection-inspection-date"><time dateTime={SURFBOARD_STORY.dateTime}>{SURFBOARD_STORY.dateLabel}</time> · {SURFBOARD_STORY.place}</p>
    <div className="surfboard-story-memory"><SurfboardPurchasePhoto /><p>{SURFBOARD_STORY.description}</p></div>
  </dialog>;
}
