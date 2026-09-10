import { Html, useTexture } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SRGBColorSpace } from 'three';
import type { Group } from 'three';
import { OfficeIcon } from '../OfficeIcon';
import { talkMedia } from '../collection';
import { publicHighResolutionSlide } from '../publicSlideSource';
import { useSceneInspection } from './SceneInspection';
import { useCabinetAction } from './WhiskyCabinetDoor';
import { WHISKY_LECTURE, whiskyLecturePose } from './WhiskyLectureLayout';
import { advanceLecturePage, lectureLeafState, visibleLecturePages } from './WhiskyLectureMotion';
import type { LectureLeafState } from './WhiskyLectureMotion';
import { WhiskyLecturePaper } from './WhiskyLecturePaper';
import './whisky-lecture.css';

const slides = talkMedia.find(talk => talk.id === WHISKY_LECTURE.id)?.slides ?? [];
const cover = slides[0];

function leafMotion(state: LectureLeafState, reducedMotion: boolean) {
  const target = state === 'parked'
    ? { x: '-2%', y: '4%', z: 38, rotateX: 7, rotateY: -12, rotateZ: -154 }
    : { x: '0%', y: '0%', z: state === 'current' ? 0 : -4, rotateX: 0, rotateY: 0, rotateZ: 0 };
  return { animate: target, transition: reducedMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 118, damping: 19, mass: .82 } };
}

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
  const close = useCallback(() => onReturn(), [onReturn]);
  const turn = useCallback((direction: -1 | 1) => {
    setIndex(current => advanceLecturePage(current, direction, slides.length));
  }, []);
  const approach = useCallback(() => {
    if (!card.current || open || disabled) return;
    if (!onApproach()) return;
    setIndex(0);
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
      if (event.key === 'Escape') { event.preventDefault(); close(); }
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        turn(event.key === 'ArrowRight' ? 1 : -1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
      trigger.current?.focus({ preventScroll: true });
    };
  }, [active, close, turn]);
  return <group ref={card} name="Magnetic whisky lecture card" position={[-0.255, 0.865, -0.2565]}
    rotation={[0, Math.PI, -Math.PI / 45]} userData={{ lectureId: WHISKY_LECTURE.id, active }} {...handlers}>
    <WhiskyLecturePaper texture={texture} focused={active} hovered={hovered} />
    {!open && !disabled && !active && <Html center position={[0, 0, .002]} occlude zIndexRange={[16, 12]} style={{ pointerEvents: 'none' }}>
      <button ref={trigger} type="button" className="whisky-lecture-trigger" aria-label="Read whisky lecture"
        onClick={event => { if (event.detail === 0) approach(); }} />
    </Html>}
    {active && cover && <>
      <Html transform center distanceFactor={400 * WHISKY_LECTURE.width / 960} position={[0, 0, .0012]}
        zIndexRange={[24, 20]} style={{ pointerEvents: 'auto' }}>
        <section className="whisky-lecture-stack" aria-label="Whisky lecture pages"
          onPointerDown={event => event.stopPropagation()} onWheel={event => event.stopPropagation()}>
          <div className="whisky-lecture-stack-depth" aria-hidden="true" />
          {visibleLecturePages(index, slides.length).map(page => {
            const slide = slides[page];
            if (!slide) return null;
            const state = lectureLeafState(page, index);
            const canTurn = state === 'parked' || (state === 'current' && index < slides.length - 1);
            return <motion.button key={slide.src} type="button" className="whisky-lecture-leaf"
              data-state={state} disabled={!canTurn} aria-label={state === 'parked'
                ? `Previous whisky lecture slide, page ${page + 1}`
                : state === 'current' && canTurn ? `Next whisky lecture slide, page ${page + 2}` : slide.caption}
              onClick={() => { if (state === 'parked') turn(-1); else if (state === 'current') turn(1); }}
              style={{ zIndex: state === 'current' ? 60 : state === 'parked' ? 40 + page : 20 - page }}
              {...leafMotion(state, reducedMotion)}>
              <span className="whisky-lecture-leaf-front">
                <img className="whisky-lecture-slide" src={publicHighResolutionSlide(slide) ?? slide.src}
                  width={960} height={960 * WHISKY_LECTURE.height / WHISKY_LECTURE.width} alt={slide.caption}
                  draggable={false} decoding="async" fetchPriority={state === 'current' ? 'high' : 'auto'} />
              </span>
              <span className="whisky-lecture-leaf-back" aria-hidden="true" />
            </motion.button>;
          })}
          <p className="whisky-lecture-page-count" role="status">{index + 1} / {slides.length}</p>
          <p className="whisky-lecture-instructions">Click the right sheet for the next page. Click the parked left sheet to return. Arrow keys also turn pages.</p>
        </section>
      </Html>
      <Html fullscreen zIndexRange={[35, 30]} style={{ pointerEvents: 'none' }}
        calculatePosition={(_object, _camera, viewport) => [viewport.width / 2, viewport.height / 2]}>
        <button ref={closeButton} type="button" className="whisky-lecture-close" onClick={close} aria-label="Close whisky lecture"
          onPointerDown={event => event.stopPropagation()}><OfficeIcon name="close" /></button>
      </Html>
    </>}
  </group>;
}
