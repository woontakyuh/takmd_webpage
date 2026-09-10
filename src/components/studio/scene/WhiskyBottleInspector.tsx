import { Html } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { OfficeIcon } from '../OfficeIcon';
import { useEffect, useRef } from 'react';
import { WHISKY_BOTTLE_INFO } from './WhiskyBottleInfo';
import type { WhiskyBottleId } from './WhiskyInspectionState';
import { whiskyCabinetScreenBounds, whiskyInspectionLayout } from './WhiskyInspectionMotion';
import './whisky-inspector.css';

export function WhiskyBottleInspector({ bottleId, returning, onReturn }: {
  readonly bottleId: WhiskyBottleId;
  readonly returning: boolean;
  readonly onReturn: () => void;
}) {
  const size = useThree(state => state.size);
  const layout = whiskyInspectionLayout(size);
  const panel = useRef<HTMLElement>(null);
  const presented = useRef(false);
  const button = useRef<HTMLButtonElement>(null);
  const info = WHISKY_BOTTLE_INFO[bottleId];
  useEffect(() => {
    const previous = document.activeElement;
    button.current?.focus({ preventScroll: true });
    return () => { if (previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true }); };
  }, []);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || document.querySelector('dialog:modal')) return;
      event.preventDefault();
      onReturn();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onReturn]);
  return <Html fullscreen zIndexRange={[35, 30]} style={{ pointerEvents: 'none' }}
    calculatePosition={(object, camera, viewport) => {
      if (object.parent && panel.current) {
        const bounds = whiskyCabinetScreenBounds(object.parent, camera, viewport);
        const desiredLeft = layout.stacked ? layout.inset : bounds.right + layout.gap;
        const desiredTop = layout.stacked ? bounds.bottom + layout.gap
          : Math.max(panel.current.offsetHeight / 2 + layout.inset, Math.min(viewport.height - panel.current.offsetHeight / 2 - layout.inset, (bounds.top + bounds.bottom) / 2));
        const fits = desiredLeft + layout.panel.width <= viewport.width - layout.inset + 1 && (!layout.stacked || desiredTop <= viewport.height - layout.inset - 160);
        presented.current ||= fits;
        const left = Math.max(layout.inset, Math.min(desiredLeft, viewport.width - layout.inset - layout.panel.width));
        const top = layout.stacked ? Math.max(layout.inset, Math.min(desiredTop, viewport.height - layout.inset - 160)) : desiredTop;
        const height = viewport.height - (layout.stacked ? top : layout.inset) - layout.inset;
        panel.current.style.left = `${left}px`;
        panel.current.style.top = `${top}px`;
        panel.current.style.maxHeight = `${Math.max(0, height)}px`;
        panel.current.style.visibility = presented.current ? 'visible' : 'hidden';
      }
      return [viewport.width / 2, viewport.height / 2];
    }}>
    <section ref={panel} className="whisky-inspector" data-layout={layout.stacked ? 'below' : 'beside'}
      style={{ left: layout.panel.left, top: layout.stacked ? layout.panel.top : '50%', width: layout.panel.width, maxHeight: layout.panel.maxHeight }}
      role="dialog" aria-modal="false" aria-labelledby="whisky-title" lang="en"
      onPointerDown={event => event.stopPropagation()} onDoubleClick={event => event.stopPropagation()}>
      <div className="whisky-inspector-top"><span>{info.origin} · {info.volume}</span><button type="button" onClick={onReturn} disabled={returning} aria-label="Close bottle information"><OfficeIcon name="close" /></button></div>
      <h2 id="whisky-title">{info.brand}</h2>
      <p className="whisky-expression">{info.expression}</p>
      <dl><div><dt>Type</dt><dd>{info.style}</dd></div>
        <div><dt>Age</dt><dd>{info.age}</dd></div><div><dt>ABV</dt><dd>{info.strength}</dd></div></dl>
      <p>{info.story}</p><p>{info.character}</p>
      <a href={info.source} target="_blank" rel="noreferrer">Source <span aria-hidden="true">↗</span></a>
      <div className="whisky-inspector-actions">
        <button ref={button} type="button" onClick={onReturn} disabled={returning} aria-label="Return bottle to cabinet">
          {returning ? 'Returning bottle…' : 'Return bottle'}
        </button>
      </div>
    </section>
  </Html>;
}
