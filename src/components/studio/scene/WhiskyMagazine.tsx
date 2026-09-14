import { Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MathUtils } from 'three';
import type { Group } from 'three';
import { EDBM_MAGAZINE } from '../edbmArchive';
import { Magazine } from './Magazine';
import { RoomArchiveCaption } from './RoomArchiveCaption';
import { magazineReadingLayout } from './MagazineReadingLayout';
import { useSceneInspection } from './SceneInspection';
import { useCabinetAction } from './WhiskyCabinetDoor';
import { MAGAZINE_READING, MAGAZINE_REST, whiskyMagazineTransform } from './WhiskyMagazineMotion';

const ID = 'whisky-magazine';
const { width, height } = EDBM_MAGAZINE;

export function WhiskyMagazine({ enabled, reducedMotion, onBusyChange, onReturn }: {
  readonly enabled: boolean; readonly reducedMotion: boolean;
  readonly onBusyChange: (busy: boolean) => void; readonly onReturn: () => void;
}) {
  const { inspection, setInspection } = useSceneInspection();
  const size = useThree(state => state.size);
  const active = inspection?.id === ID;
  const moving = useRef<Group>(null);
  const captionAnchor = useRef<Group>(null);
  const poseAnchor = useRef<Group>(null);
  const progress = useRef(0);
  const pagesClosed = useRef(true);
  const busy = useRef(false);
  const returnToCabinet = useRef(false);
  const motionReturning = useRef(false);
  const [page, setPage] = useState(-1);
  const [settled, setSettled] = useState(false);
  const [returning, setReturning] = useState(false);
  const spread = page >= 0;
  const readingLayout = useMemo(() => magazineReadingLayout(EDBM_MAGAZINE, EDBM_MAGAZINE.spreads, page, size),
    [page, size.width, size.height]);
  const frame = useCallback(() => {
    const anchor = poseAnchor.current;
    if (!anchor) return;
    anchor.updateWorldMatrix(true, false);
    setInspection({ id: ID, position: anchor.localToWorld(readingLayout.position.clone()).toArray(),
      target: anchor.localToWorld(readingLayout.target.clone()).toArray() });
  }, [setInspection, readingLayout]);
  const take = useCallback(() => {
    if (!enabled || busy.current) return;
    motionReturning.current = false;
    busy.current = true;
    onBusyChange(true);
    returnToCabinet.current = false;
    setReturning(false);
    setPage(-1);
    frame();
  }, [enabled, frame, onBusyChange]);
  const close = useCallback(() => {
    returnToCabinet.current = true;
    motionReturning.current = true;
    setReturning(true);
    setPage(-1);
  }, []);
  const step = useCallback((direction: -1 | 1) => {
    if (!settled || returning) return;
    pagesClosed.current = false;
    setPage(value => Math.max(-1, Math.min(EDBM_MAGAZINE.spreads.length - 1, value + direction)));
  }, [returning, settled]);
  const pageChanged = useCallback((index: number) => {
    pagesClosed.current = false;
    setPage(index);
  }, []);
  const { handlers } = useCabinetAction({ disabled: !enabled || active || busy.current, onActivate: take });
  useEffect(() => {
    if (active && busy.current && !returning) frame();
  }, [active, frame, returning]);
  useEffect(() => {
    if (active || !busy.current) return;
    returnToCabinet.current = false;
    motionReturning.current = true;
    setReturning(true);
    setPage(-1);
  }, [active]);
  useFrame((state, delta) => {
    if (!moving.current) return;
    const target = busy.current && (!motionReturning.current || !pagesClosed.current) ? 1 : 0;
    const next = reducedMotion ? target : MathUtils.damp(progress.current, target, 6, Math.min(delta, .05));
    progress.current = Math.abs(next - target) < .0008 ? target : next;
    const transform = whiskyMagazineTransform(progress.current);
    moving.current.position.set(transform.x, transform.y, transform.z);
    moving.current.rotation.set(transform.pitch, transform.yaw, 0, 'YXZ');
    moving.current.userData.progress = progress.current;
    if (progress.current !== target) state.invalidate();
    if ((progress.current === 1) !== settled) setSettled(progress.current === 1);
    if (motionReturning.current && progress.current === 0 && busy.current) {
      busy.current = false;
      onBusyChange(false);
      if (returnToCabinet.current && active) onReturn();
    }
  });
  return <>
    <group position={[MAGAZINE_READING.x, MAGAZINE_READING.y, MAGAZINE_READING.z]}>
      <group ref={poseAnchor} />
    </group>
    <group ref={moving} name="Liquor Journal on the Isidoro shelf" position={[MAGAZINE_REST.x, MAGAZINE_REST.y, MAGAZINE_REST.z]}
      rotation={[MAGAZINE_REST.pitch, MAGAZINE_REST.yaw, 0, 'YXZ']} userData={{ sceneControl: true, active }} {...(!active ? handlers : {})}>
      <group position={[-width / 2, 0, 0]}>
        <Magazine {...EDBM_MAGAZINE} active={active && settled && !returning} pageIndex={page}
          reducedMotion={reducedMotion} onPageChange={pageChanged} onSettled={index => { pagesClosed.current = index === -1; }} />
      </group>
      <group ref={captionAnchor} />
      {enabled && !busy.current && <Html center position={[0, 0, .012]} occlude style={{ pointerEvents: 'none' }}>
        <button className="whisky-lecture-trigger" aria-label="Read Liquor Journal" onClick={event => { if (event.detail === 0) take(); }} />
      </Html>}
    </group>
    {active && busy.current && !returning && <RoomArchiveCaption object={captionAnchor} width={width * (spread ? 2 : 1)} height={height}
      bounds={readingLayout.bounds} side title="A chapter behind the bar" label={`Liquor Journal · October 2017 · No. 217`}
      description={page < 0 ? 'Eat Drink & Be Merry, in print. A few pages from the years I ran a little bar in Seoul.' : EDBM_MAGAZINE.spreads[page]?.label ?? ''}
      onClose={close} onStep={step} previous={settled && page >= 0} next={settled && page < EDBM_MAGAZINE.spreads.length - 1} />}
  </>;
}
