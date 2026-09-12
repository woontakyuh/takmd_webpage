import { useFrame, useThree } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DoubleSide } from 'three';
import type { Texture } from 'three';
import type { WhiskyCardSlide } from './whiskyLecturePages';
import { PALETTE } from './config';
import { WHISKY_LECTURE } from './WhiskyLectureLayout';
import { lectureStackState, stepLectureTurn, visibleLecturePages } from './WhiskyLectureMotion';
import { createLectureSheet, WhiskyLectureSheet } from './WhiskyLectureSheet';
import { useLectureTextures } from './WhiskyLectureTextures';

export function WhiskyLectureStack({ target, slides, cover, reducedMotion, onTurn, onPage }: {
  readonly target: number;
  readonly slides: readonly WhiskyCardSlide[];
  readonly cover: Texture;
  readonly reducedMotion: boolean;
  readonly onTurn: (direction: -1 | 1) => void;
  readonly onPage: (page: number) => void;
}) {
  const cursor = useRef(0);
  const [page, setPage] = useState(0);
  const anisotropy = useThree(state => Math.min(8, state.gl.capabilities.getMaxAnisotropy()));
  const textures = useLectureTextures(page, slides, anisotropy);
  const shapes = useMemo(() => [createLectureSheet(0), createLectureSheet(1)], []);
  useEffect(() => () => shapes.forEach(shape => shape.dispose()), [shapes]);
  useFrame(() => {
    const bucket = lectureStackState(cursor.current, slides.length).page;
    if (page !== bucket) setPage(bucket);
  });
  useFrame((_state, delta) => {
    if (cursor.current === target) return;
    const next = stepLectureTurn(cursor.current, target, delta, reducedMotion);
    const needed = next > cursor.current ? Math.min(slides.length - 1, Math.ceil(next)) : Math.floor(next);
    if (!textures.has(needed) && !reducedMotion) return;
    cursor.current = next;
    if (next === target) onPage(target);
  });
  const visible = visibleLecturePages(page, slides.length);
  const turn = (event: ThreeEvent<MouseEvent>, direction: -1 | 1) => {
    event.stopPropagation();
    if (event.button === 0 && event.delta < 5) onTurn(direction);
  };
  return <group name="Physical whisky lecture and bar photograph sheets" userData={{ leftSheets: page, rightSheets: slides.length - page,
    targetPage: target, cursor: cursor.current, loadedPages: [...textures.keys()] }}
    onPointerDown={event => event.stopPropagation()} onDoubleClick={event => event.stopPropagation()}>
    {slides.map((_slide, leaf) => {
      if (visible.includes(leaf)) return null;
      const parked = leaf < page;
      const depth = (parked ? leaf : slides.length - leaf - 1) * WHISKY_LECTURE.sheetThickness;
      return <mesh key={leaf} name={`${parked ? 'Turned' : 'Remaining'} paper layer ${leaf + 1}`}
        geometry={shapes[parked ? 1 : 0]} position={[0, 0, depth]} receiveShadow castShadow
        onClick={event => turn(event, parked ? -1 : 1)}>
        <meshStandardMaterial color={leaf % 2 ? PALETTE.paperLight : PALETTE.paper} side={DoubleSide} roughness={.97} />
      </mesh>;
    })}
    {visible.map(leaf => <group key={leaf} onClick={event => turn(event, cursor.current - leaf >= .5 ? -1 : 1)}>
      <WhiskyLectureSheet page={leaf} count={slides.length} cursor={cursor} photoAspect={slides[leaf]?.photoAspect}
        texture={textures.get(leaf) ?? (leaf === 0 ? cover : undefined)} />
    </group>)}
  </group>;
}
