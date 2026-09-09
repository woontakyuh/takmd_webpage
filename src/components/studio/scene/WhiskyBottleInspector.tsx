import { Html } from '@react-three/drei';
import { OfficeIcon } from '../OfficeIcon';
import { useEffect, useRef } from 'react';
import { WHISKY_BOTTLE_INFO } from './WhiskyBottleInfo';
import { WHISKY_BOTTLES } from './WhiskyBottleSpecs';
import type { WhiskyBottleId } from './WhiskyInspectionState';
import './whisky-inspector.css';

export function WhiskyBottleChooser({ selected, disabled = false, onSelect }: {
  readonly selected: WhiskyBottleId | null;
  readonly disabled?: boolean;
  readonly onSelect: (id: WhiskyBottleId) => void;
}) {
  return <select aria-label="Choose a bottle" value={selected ?? ''} disabled={disabled}
    onChange={event => {
      const bottle = WHISKY_BOTTLES.find(item => item.image === event.target.value);
      if (bottle) onSelect(bottle.image);
    }}>
    <option value="" disabled>Choose a bottle</option>
    {WHISKY_BOTTLES.map(bottle => <option key={bottle.image} value={bottle.image}>
      {WHISKY_BOTTLE_INFO[bottle.image].brand} · {WHISKY_BOTTLE_INFO[bottle.image].expression}
    </option>)}
  </select>;
}

export function WhiskyBottleInspector({ bottleId, returning, onReturn, onSelect }: {
  readonly bottleId: WhiskyBottleId;
  readonly returning: boolean;
  readonly onReturn: () => void;
  readonly onSelect: (id: WhiskyBottleId) => void;
}) {
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
    calculatePosition={(_object, _camera, size) => [size.width / 2, size.height / 2]}>
    <section className="whisky-inspector" role="dialog" aria-modal="false" aria-labelledby="whisky-title" lang="ko"
      onPointerDown={event => event.stopPropagation()} onDoubleClick={event => event.stopPropagation()}>
      <div className="whisky-inspector-top"><span>{info.origin} · {info.volume}</span><button type="button" onClick={onReturn} disabled={returning} aria-label="Close bottle information"><OfficeIcon name="close" /></button></div>
      <h2 id="whisky-title">{info.brand}</h2>
      <p className="whisky-expression">{info.expression}</p>
      <dl><div><dt>종류</dt><dd>{info.style}</dd></div>
        <div><dt>숙성</dt><dd>{info.age}</dd></div><div><dt>도수</dt><dd>{info.strength}</dd></div></dl>
      <p>{info.story}</p><p>{info.character}</p>
      <a href={info.source} target="_blank" rel="noreferrer">제품 소개 <span aria-hidden="true">↗</span></a>
      <div className="whisky-inspector-actions">
        <WhiskyBottleChooser selected={bottleId} onSelect={onSelect} />
        <button ref={button} type="button" onClick={onReturn} disabled={returning} aria-label="Return bottle to cabinet">
          {returning ? 'Returning bottle…' : 'Return bottle'}
        </button>
      </div>
    </section>
  </Html>;
}
