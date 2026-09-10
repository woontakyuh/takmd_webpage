import { Html, useTexture } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SRGBColorSpace } from 'three';
import type { Group } from 'three';
import { OfficeIcon } from '../OfficeIcon';
import { talkMedia } from '../collection';
import { requestOfficePath } from '../officeNavigation';
import { publicHighResolutionSlide } from '../publicSlideSource';
import { useSceneInspection } from './SceneInspection';
import { useCabinetAction } from './WhiskyCabinetDoor';
import { WHISKY_LECTURE, whiskyLectureLayout, whiskyLecturePose } from './WhiskyLectureLayout';
import { WhiskyLecturePaper } from './WhiskyLecturePaper';
import './whisky-lecture.css';

const slides = talkMedia.find(talk => talk.id === WHISKY_LECTURE.id)?.slides ?? [];
const cover = slides[0];

export function WhiskyLectureCard({ open, disabled }: { readonly open: boolean; readonly disabled: boolean }) {
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
  const handingToTv = useRef(false);
  const size = useThree(state => state.size);
  const { inspection, setInspection } = useSceneInspection();
  const active = inspection?.id === WHISKY_LECTURE.inspection;
  const [index, setIndex] = useState(0);
  const slide = slides[index] ?? cover;
  const layout = whiskyLectureLayout(size);
  const close = useCallback(() => setInspection(null), [setInspection]);
  const approach = useCallback(() => {
    if (!card.current || open || disabled) return;
    handingToTv.current = false;
    setIndex(0);
    setInspection({ id: WHISKY_LECTURE.inspection, ...whiskyLecturePose(card.current, size) });
  }, [disabled, open, setInspection, size]);
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
        setIndex(current => Math.max(0, Math.min(slides.length - 1, current + (event.key === 'ArrowRight' ? 1 : -1))));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
      if (!handingToTv.current) trigger.current?.focus({ preventScroll: true });
    };
  }, [active, close]);
  return <group ref={card} name="Magnetic whisky lecture card" position={[-0.285, 0.90, -0.2565]}
    rotation={[0, Math.PI, -Math.PI / 45]} userData={{ lectureId: WHISKY_LECTURE.id, active }} {...handlers}>
    <WhiskyLecturePaper texture={texture} flat={active} hovered={hovered} />
    {!open && !disabled && !active && <Html center position={[0, 0, .002]} occlude zIndexRange={[16, 12]} style={{ pointerEvents: 'none' }}>
      <button ref={trigger} type="button" className="whisky-lecture-trigger" aria-label="Read whisky lecture"
        onClick={event => { if (event.detail === 0) approach(); }} />
    </Html>}
    {active && slide && <>
      <Html transform distanceFactor={400 * WHISKY_LECTURE.width / 960} position={[0, 0, .0006]}
        zIndexRange={[24, 20]} style={{ pointerEvents: 'none' }}>
        <img className="whisky-lecture-slide" src={publicHighResolutionSlide(slide) ?? slide.src}
          width={960} height={960 * WHISKY_LECTURE.height / WHISKY_LECTURE.width} alt={slide.caption}
          draggable={false} decoding="async" fetchPriority="high" />
      </Html>
      <Html fullscreen zIndexRange={[35, 30]} style={{ pointerEvents: 'none' }}
        calculatePosition={(_object, _camera, viewport) => [viewport.width / 2, viewport.height / 2]}>
        <button ref={closeButton} type="button" className="whisky-lecture-close" onClick={close} aria-label="Close whisky lecture"
          onPointerDown={event => event.stopPropagation()}><OfficeIcon name="close" /></button>
        <section className="whisky-lecture-controls" role="region" aria-label="Whisky lecture slides"
          style={{ top: layout.controlsTop }} onPointerDown={event => event.stopPropagation()} onWheel={event => event.stopPropagation()}>
          <p>KOSESS Executive Workshop · 22 February 2025</p>
          <nav aria-label="Navigate whisky lecture slides">
            <button type="button" aria-label="Previous whisky lecture slide" disabled={index === 0} onClick={() => setIndex(value => value - 1)}>‹</button>
            <span role="status">{index + 1} / {slides.length}</span>
            <button type="button" aria-label="Next whisky lecture slide" disabled={index === slides.length - 1} onClick={() => setIndex(value => value + 1)}>›</button>
            <button type="button" className="whisky-lecture-tv" onClick={() => { handingToTv.current = true; close(); requestOfficePath(`/education?talk=${WHISKY_LECTURE.id}`); }}><OfficeIcon name="education" />View on TV</button>
          </nav>
        </section>
      </Html>
    </>}
  </group>;
}
