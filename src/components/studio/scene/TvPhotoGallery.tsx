import { useLayoutEffect, useRef, useState } from 'react';
import type { TalkSlide } from '../types';
import type { TvPhotoPage } from '../tvPhotoGallery';
import { setWallTvInspectionEdges } from './hoverReactions';
import { sampleTvImageEdges } from './tvBacklightColor';
import '../tv-photo-gallery.css';

type Props = { readonly page: TvPhotoPage; readonly thumbnail?: boolean };

export function TvPhotoGallery({ page, thumbnail = false }: Props) {
  const [expanded, setExpanded] = useState<TalkSlide | null>(null);
  const [failedSources, setFailedSources] = useState<readonly string[]>([]);
  const origin = useRef<HTMLButtonElement | null>(null);
  const expandedImage = useRef<HTMLImageElement | null>(null);
  useLayoutEffect(() => {
    const element = expandedImage.current;
    if (thumbnail || !expanded || !element) return;
    const sync = () => {
      if (element.complete && element.naturalWidth) setWallTvInspectionEdges(sampleTvImageEdges(element, expanded.src));
    };
    element.addEventListener('load', sync);
    sync();
    return () => { element.removeEventListener('load', sync); setWallTvInspectionEdges(null); };
  }, [expanded, thumbnail]);
  const restore = () => { setExpanded(null); requestAnimationFrame(() => origin.current?.focus({ preventScroll: true })); };
  const image = (slide: TalkSlide, enlarged = false) => <>
    <img ref={enlarged ? expandedImage : undefined} src={thumbnail ? slide.thumbnail ?? slide.src : slide.src} alt={thumbnail ? '' : slide.caption}
      width={slide.width} height={slide.height} draggable={false} decoding="async" loading={thumbnail ? 'lazy' : 'eager'}
      onError={() => setFailedSources(sources => sources.includes(slide.src) ? sources : [...sources, slide.src])} />
    {!thumbnail && failedSources.includes(slide.src) && <small className="tv-photo-unavailable">Photo unavailable</small>}
  </>;
  return <div className="tv-photo-gallery" data-enlarged={!!expanded} data-thumbnail={thumbnail} onKeyDown={event => {
    if (!expanded) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); restore(); }
    if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) event.stopPropagation();
  }}>
    <div className="tv-photo-board" inert={!!expanded}>
      {page.photos.map(photo => {
        const style = { left: `${photo.frame.x * 100}%`, top: `${photo.frame.y * 100}%`,
          width: `${photo.frame.width * 100}%`, height: `${photo.frame.height * 100}%` };
        return thumbnail ? <span key={photo.slide.src} className="tv-photo-tile" style={style}>{image(photo.slide)}</span>
          : <button key={photo.slide.src} className="tv-photo-tile" style={style} aria-label={`Enlarge photo: ${photo.slide.caption}`}
            onClick={event => { origin.current = event.currentTarget; setExpanded(photo.slide); }}>{image(photo.slide)}</button>;
      })}
    </div>
    {expanded && <div className="tv-photo-expanded" role="group" aria-label={expanded.caption}>
      {image(expanded, true)}
      <button ref={button => button?.focus({ preventScroll: true })} onClick={restore} aria-label="Back to gallery">← Gallery</button>
    </div>}
  </div>;
}
