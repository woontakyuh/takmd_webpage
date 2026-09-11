import { Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import type { Group, Texture } from 'three';
import { OfficeIcon } from '../OfficeIcon';
import { useArrangement } from '../arrangement';
import { IsidoroBarware } from './IsidoroBarware';
import { IsidoroFixedHalf } from './IsidoroCabinetGeometry';
import { IsidoroWorktop, WhiskyCabinetDoor, useCabinetAction, useIsidoroMotion } from './WhiskyCabinetDoor';
import { WHISKY_CABINET } from './WhiskyCabinetLayout';
import { WhiskyCollection } from './WhiskyCollection';
import { WhiskyBottleInspector } from './WhiskyBottleInspector';
import { finishWhiskyReturn, returnWhiskyBottle, selectWhiskyBottle } from './WhiskyInspectionState';
import type { WhiskyBottleId, WhiskyInspectionState } from './WhiskyInspectionState';
import { whiskyCabinetPose, whiskyClosedCabinetPose, whiskyInspectionPose } from './WhiskyInspectionMotion';
import { useSceneInspection } from './SceneInspection';
import { IsidoroInteriorLighting } from './IsidoroInteriorLighting';
import { WhiskyLectureCard } from './WhiskyLectureCard';

type WhiskyCabinetProps = {
  readonly wood: Texture;
  readonly reducedMotion: boolean;
  readonly lamp: number;
};

const stopInteriorClick = (event: ThreeEvent<PointerEvent | MouseEvent>) => event.stopPropagation();

export function WhiskyCabinet({ wood, reducedMotion, lamp }: WhiskyCabinetProps) {
  const { editing } = useArrangement();
  const size = useThree(state => state.size);
  const camera = useThree(state => state.camera);
  const [open, setOpen] = useState(false);
  const [selection, setSelection] = useState<WhiskyInspectionState>(null);
  const cabinet = useRef<Group>(null);
  const closing = useRef(false);
  const { inspection, setInspection } = useSceneInspection();
  const lectureActive = inspection?.id === 'whisky-lecture';
  const doorPivot = useRef<Group>(null);
  const worktopPivot = useRef<Group>(null);
  const ready = useIsidoroMotion(doorPivot, worktopPivot, open, reducedMotion, editing);
  const barware = useRef<Group>(null);
  const bottles = useRef<Group>(null);
  useFrame(() => {
    const exposed = (open && !editing) || (doorPivot.current?.rotation.y ?? 0) !== 0;
    if (barware.current) barware.current.visible = exposed;
    if (bottles.current) bottles.current.visible = exposed;
  });
  const approached = inspection?.id === 'whisky-cabinet' || inspection?.id.startsWith('whisky:') === true;
  const approachCabinet = useCallback((opened = open) => {
    if (cabinet.current) setInspection({ id: 'whisky-cabinet',
      ...(opened ? whiskyCabinetPose : whiskyClosedCabinetPose)(cabinet.current, size) });
  }, [open, size, setInspection]);
  const visitClosedCabinet = useCallback(() => {
    if (!cabinet.current) return false;
    const pose = whiskyClosedCabinetPose(cabinet.current, size);
    if (inspection?.id === 'whisky-cabinet'
      && Math.hypot(...pose.position.map((value, index) => value - camera.position.getComponent(index))) < 0.08) return true;
    approachCabinet(false);
    return false;
  }, [approachCabinet, camera, inspection, size]);
  const toggle = useCallback(() => {
    if (editing) return;
    if (!open) {
      if (!visitClosedCabinet()) return;
      setOpen(true);
      approachCabinet(true);
      return;
    }
    if (open && selection) {
      closing.current = true;
      setSelection(current => returnWhiskyBottle(current, true));
      approachCabinet();
    } else {
      setOpen(false);
      approachCabinet(false);
    }
  }, [approachCabinet, editing, open, selection, visitClosedCabinet]);
  const { handlers } = useCabinetAction({ disabled: editing, onActivate: toggle });
  const chooseBottle = useCallback((id: WhiskyBottleId) => {
    if (!ready || !cabinet.current) return;
    closing.current = false;
    setSelection(current => selectWhiskyBottle(current, id));
    setInspection({ id: `whisky:${id}`, ...whiskyInspectionPose(cabinet.current, size) });
  }, [size, ready, setInspection]);
  const returnBottle = useCallback(() => {
    setSelection(current => returnWhiskyBottle(current, false));
    approachCabinet();
  }, [approachCabinet]);
  const returned = useCallback((id: WhiskyBottleId) => {
    setSelection(current => finishWhiskyReturn(current, id));
  }, []);
  const leaveCabinet = useCallback(() => {
    closing.current = true;
    setSelection(current => returnWhiskyBottle(current, true));
    setInspection(null);
  }, [setInspection]);
  useEffect(() => {
    if (editing) { closing.current = false; setOpen(false); setSelection(null); }
  }, [editing]);
  useEffect(() => {
    if (selection || !closing.current) return;
    closing.current = false;
    setOpen(false);
    if (approached) approachCabinet(false);
  }, [selection, approached, approachCabinet]);
  useEffect(() => {
    if (approached) return;
    closing.current = true;
    setSelection(current => returnWhiskyBottle(current, true));
    if (!selection) setOpen(false);
  }, [approached, selection]);
  useEffect(() => {
    if (!approached || selection) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || document.querySelector('dialog:modal')) return;
      event.preventDefault();
      leaveCabinet();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [approached, leaveCabinet, selection]);
  const previousViewport = useRef(size);
  useEffect(() => {
    if (previousViewport.current.width === size.width && previousViewport.current.height === size.height) return;
    previousViewport.current = size;
    if (!approached || !inspection || !cabinet.current) return;
    const pose = (inspection.id.startsWith('whisky:') ? whiskyInspectionPose : open ? whiskyCabinetPose : whiskyClosedCabinetPose)(cabinet.current, size);
    setInspection({ id: inspection.id, ...pose });
  }, [approached, inspection, open, setInspection, size]);
  return <group ref={cabinet} name="Poltrona Frau Isidoro drinks cabinet"
    userData={{
      product: 'Poltrona Frau Isidoro',
      width: WHISKY_CABINET.width,
      depth: WHISKY_CABINET.depth,
      height: WHISKY_CABINET.height,
      openWidth: WHISKY_CABINET.openWidth,
      open: open && !editing,
      selectedBottle: selection?.bottle ?? null,
    }} {...(!open ? handlers : {
      onPointerDown: stopInteriorClick, onPointerUp: stopInteriorClick, onClick: stopInteriorClick,
    })}>
    <IsidoroFixedHalf wood={wood}>
      <group ref={barware} name="Enclosed Isidoro barware">
      <IsidoroBarware />
      <IsidoroInteriorLighting lowerShelf={0.973} open={open && !editing} power={lamp} reducedMotion={reducedMotion} />
      </group>
    </IsidoroFixedHalf>
    <WhiskyCabinetDoor open={open} pivot={doorPivot} worktop={worktopPivot} wood={wood}
      exterior={<Suspense fallback={null}><WhiskyLectureCard open={open} disabled={editing}
        onApproach={visitClosedCabinet} onReturn={approachCabinet} /></Suspense>}
      disabled={editing} onActivate={toggle}>
      <group ref={bottles} name="complete seven-bottle whisky and Armagnac collection">
        <Suspense fallback={null}><WhiskyCollection cabinet={cabinet} selection={selection}
          enabled={ready && !editing} reducedMotion={reducedMotion || editing} onSelect={chooseBottle} onReturned={returned} /></Suspense>
        <IsidoroInteriorLighting lowerShelf={0.648} open={open && !editing} power={lamp} reducedMotion={reducedMotion} />
      </group>
    </WhiskyCabinetDoor>
    <IsidoroWorktop open={open} pivot={worktopPivot} wood={wood} disabled={editing} />
    <Html fullscreen zIndexRange={[17, 11]} style={{ pointerEvents: 'none' }}
      calculatePosition={(_object, _camera, viewport) => [viewport.width / 2, viewport.height / 2]}>
      <button className="office-secret-trigger" type="button" disabled={editing || lectureActive}
        aria-expanded={open} onClick={toggle}>{open ? 'Close' : approached ? 'Open' : 'View'} Isidoro drinks cabinet</button>
    </Html>
    {approached && !selection && <Html fullscreen zIndexRange={[18, 12]} style={{ pointerEvents: 'none' }}
      calculatePosition={(_object, _camera, viewport) => [viewport.width / 2, viewport.height / 2]}>
      <button className="whisky-cabinet-exit" type="button" onClick={leaveCabinet} aria-label="Close cabinet view"
        onPointerDown={event => event.stopPropagation()} onDoubleClick={event => event.stopPropagation()}><OfficeIcon name="close" /></button>
    </Html>}
    {selection && <WhiskyBottleInspector bottleId={selection.bottle} returning={selection.returning}
      onReturn={returnBottle} />}
  </group>;
}
