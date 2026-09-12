import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import type { ReactNode, RefObject, SyntheticEvent } from 'react';
import { Vector3 } from 'three';
import type { Group } from 'three';
import { OfficeIcon } from '../OfficeIcon';
import { archiveLayout } from './roomArchiveLayout';
import './room-archive.css';

const stopSceneEvent = (event: SyntheticEvent) => event.stopPropagation();

export function RoomArchiveCaption({ object, width, height, side = false, title, label, description, onClose, onStep, previous, next, children }: {
  readonly object: RefObject<Group | null>; readonly width: number; readonly height: number; readonly side?: boolean;
  readonly title: string; readonly label: string; readonly description: string;
  readonly onClose: () => void; readonly onStep?: (direction: -1 | 1) => void; readonly previous?: boolean; readonly next?: boolean;
  readonly children?: ReactNode;
}) {
  const caption = useRef<HTMLElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const point = useRef(new Vector3());
  useEffect(() => {
    close.current?.focus({ preventScroll: true });
    const key = (event: KeyboardEvent) => {
      if (event.defaultPrevented || document.querySelector('dialog:modal')) return;
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
      if (onStep && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
        event.preventDefault(); onStep(event.key === 'ArrowRight' ? 1 : -1);
      }
    };
    window.addEventListener('keydown', key, true);
    return () => window.removeEventListener('keydown', key, true);
  }, [onClose, onStep]);
  useFrame(({ camera, size }) => {
    const el = caption.current, group = object.current;
    if (!el || !group) return;
    const layout = archiveLayout(size, width / height, side);
    let right = -Infinity, bottom = -Infinity, top = Infinity, left = Infinity;
    for (const x of [-width / 2, width / 2]) for (const y of [-height / 2, height / 2]) {
      point.current.set(x, y, .006);
      group.localToWorld(point.current).project(camera);
      const px = (point.current.x + 1) * size.width / 2, py = (1 - point.current.y) * size.height / 2;
      right = Math.max(right, px); left = Math.min(left, px); bottom = Math.max(bottom, py); top = Math.min(top, py);
    }
    const x = layout.stacked ? (left + right - layout.copyWidth) / 2 : right + layout.gap;
    const y = layout.stacked ? bottom + layout.gap : (top + bottom - el.offsetHeight) / 2;
    el.style.width = `${layout.copyWidth}px`;
    el.style.transform = `translate3d(${Math.max(24, Math.min(size.width - layout.copyWidth - 24, x))}px, ${Math.max(64, Math.min(size.height - el.offsetHeight - 24, y))}px, 0)`;
  });
  return <Html fullscreen zIndexRange={[35, 30]} style={{ pointerEvents: 'none' }}
    calculatePosition={(_o, _c, viewport) => [viewport.width / 2, viewport.height / 2]}>
    <button ref={close} className="whisky-lecture-close" type="button" aria-label={`Close ${title}`}
      onPointerDown={stopSceneEvent} onPointerUp={stopSceneEvent} onDoubleClick={stopSceneEvent}
      onClick={event => { event.stopPropagation(); onClose(); }}><OfficeIcon name="close" /></button>
    <section ref={caption} className="room-archive-caption" aria-label={title} lang="en"
      onPointerDown={stopSceneEvent} onPointerUp={stopSceneEvent} onClick={stopSceneEvent} onDoubleClick={stopSceneEvent}>
      <p className="room-archive-label">{label}</p><h2>{title}</h2><p>{description}</p>
      {children}
      {onStep && <nav aria-label={`${title} pages`}>
        <button type="button" aria-label="Previous page" disabled={!previous} onClick={() => onStep(-1)}>‹</button>
        <button type="button" aria-label="Next page" disabled={!next} onClick={() => onStep(1)}>›</button>
      </nav>}
    </section>
  </Html>;
}
