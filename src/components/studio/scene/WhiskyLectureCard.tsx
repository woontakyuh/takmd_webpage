import { Html, useTexture } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SRGBColorSpace } from 'three';
import type { Group } from 'three';
import { OfficeIcon } from '../OfficeIcon';
import { useSceneInspection } from './SceneInspection';
import { useCabinetAction } from './WhiskyCabinetDoor';
import { WHISKY_LECTURE, whiskyLecturePose } from './WhiskyLectureLayout';
import { advanceLecturePage } from './WhiskyLectureMotion';
import { WhiskyLecturePaper } from './WhiskyLecturePaper';
import { WhiskyLectureStack } from './WhiskyLectureStack';
import { whiskyLecturePages as slides } from './whiskyLecturePages';
import './whisky-lecture.css';

const cover = slides[0];

export function WhiskyLectureCard({ open, disabled, onApproach, onReturn }: {
  readonly open: boolean;
  readonly disabled: boolean;
  readonly onApproach: () => boolean;
  readonly onReturn: () => void;
}) {
  const source = useTexture(cover?.src ?? '');
  const texture = useMemo(() => {
    const copy = source.clone();
    copy.colorSpace = SRGBColorSpace;
    copy.anisotropy = 4;
    copy.needsUpdate = true;
    return copy;
  }, [source]);
  useEffect(() => () => texture.dispose(), [texture]);
  const card = useRef<Group>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const reducedMotion = useReducedMotion() ?? false;
  const size = useThree(state => state.size);
  const { inspection, setInspection } = useSceneInspection();
  const active = inspection?.id === WHISKY_LECTURE.inspection;
  const [index, setIndex] = useState(0);
  const [shownPage, setShownPage] = useState(0);
  const close = useCallback(() => onReturn(), [onReturn]);
  const turn = useCallback((direction: -1 | 1) => {
    setIndex(current => advanceLecturePage(current, direction, slides.length));
  }, []);
  const approach = useCallback(() => {
    if (!card.current || open || disabled) return;
    if (!onApproach()) return;
    setIndex(0);
    setShownPage(0);
    setInspection({ id: WHISKY_LECTURE.inspection, ...whiskyLecturePose(card.current, size) });
  }, [disabled, onApproach, open, setInspection, size]);
  const { hovered, handlers } = useCabinetAction({ disabled: disabled || open || active, onActivate: approach });
  useEffect(() => {
    if (!active || !card.current) return;
    setInspection({ id: WHISKY_LECTURE.inspection, ...whiskyLecturePose(card.current, size) });
  }, [active, size.width, size.height, setInspection]);
  useEffect(() => {
    if (!active) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || document.querySelector('dialog:modal')) return;
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); }
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        event.stopPropagation();
        turn(event.key === 'ArrowRight' ? 1 : -1);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey, true);
      trigger.current?.focus({ preventScroll: true });
    };
  }, [active, close, turn]);
  return <group ref={card} name="Magnetic whisky lecture card" position={[-0.255, 0.865, WHISKY_LECTURE.cabinetFront]}
    rotation={[0, Math.PI, -Math.PI / 45]} userData={{ lectureId: WHISKY_LECTURE.id, active }} {...handlers}>
    <WhiskyLecturePaper texture={texture} focused={active} hovered={hovered} count={slides.length} />
    {!open && !disabled && !active && <Html center position={[0, 0, slides.length * WHISKY_LECTURE.sheetThickness + .004]}
      occlude zIndexRange={[16, 12]} style={{ pointerEvents: 'none' }}>
      <button ref={trigger} type="button" className="whisky-lecture-trigger" aria-label="Read whisky lecture"
        onClick={event => { if (event.detail === 0) approach(); }} />
    </Html>}
    {active && cover && <>
      <WhiskyLectureStack target={index} slides={slides} cover={texture} reducedMotion={reducedMotion}
        onTurn={turn} onPage={setShownPage} />
      <Html fullscreen zIndexRange={[35, 30]} style={{ pointerEvents: 'none' }}
        calculatePosition={(_object, _camera, viewport) => [viewport.width / 2, viewport.height / 2]}>
        <button ref={closeButton} type="button" className="whisky-lecture-close" onClick={close} aria-label="Close whisky lecture"
          onPointerDown={event => event.stopPropagation()}><OfficeIcon name="close" /></button>
        <section className="whisky-lecture-accessibility" aria-label="Whisky lecture pages">
          <button type="button" className="whisky-lecture-keyboard" disabled={index === 0}
            onClick={() => turn(-1)}>Previous whisky lecture slide</button>
          <button type="button" className="whisky-lecture-keyboard" disabled={index === slides.length - 1}
            onClick={() => turn(1)}>Next whisky lecture slide</button>
          <p className="whisky-lecture-instructions" role="status">Page {shownPage + 1} of {slides.length}. {slides[shownPage]?.caption}</p>
          <p className="whisky-lecture-instructions">Click the lower sheet for the next page. Click the turned upper sheet to return. Arrow keys also turn pages.</p>
        </section>
      </Html>
    </>}
  </group>;
}
