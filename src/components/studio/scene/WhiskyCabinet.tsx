import { Html } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Group, Texture } from 'three';
import { OfficeIcon } from '../OfficeIcon';
import { useArrangement } from '../arrangement';
import { PALETTE } from './config';
import { IsidoroBarware } from './IsidoroBarware';
import { IsidoroFixedHalf } from './IsidoroCabinetGeometry';
import { IsidoroWorktop, WhiskyCabinetDoor, useCabinetAction, useIsidoroMotion } from './WhiskyCabinetDoor';
import { WHISKY_CABINET } from './WhiskyCabinetLayout';
import { WhiskyCollection } from './WhiskyCollection';
import { WhiskyBottleInspector } from './WhiskyBottleInspector';
import { finishWhiskyReturn, returnWhiskyBottle, selectWhiskyBottle } from './WhiskyInspectionState';
import type { WhiskyBottleId, WhiskyInspectionState } from './WhiskyInspectionState';
import { whiskyCabinetPose, whiskyInspectionPose } from './WhiskyInspectionMotion';
import { useSceneInspection } from './SceneInspection';
import { IsidoroInteriorLighting } from './IsidoroInteriorLighting';

type WhiskyCabinetProps = {
  readonly wood: Texture;
  readonly reducedMotion: boolean;
  readonly lamp: number;
};

const stopInteriorClick = (event: ThreeEvent<PointerEvent | MouseEvent>) => event.stopPropagation();

export function WhiskyCabinet({ wood, reducedMotion, lamp }: WhiskyCabinetProps) {
  const { editing } = useArrangement();
  const size = useThree(state => state.size);
  const narrow = size.width < 760;
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [selection, setSelection] = useState<WhiskyInspectionState>(null);
  const cabinet = useRef<Group>(null);
  const closing = useRef(false);
  const { inspection, setInspection } = useSceneInspection();
  const doorPivot = useRef<Group>(null);
  const worktopPivot = useRef<Group>(null);
  const ready = useIsidoroMotion(doorPivot, worktopPivot, open, reducedMotion, editing);
  const approached = inspection?.id === 'whisky-cabinet' || inspection?.id.startsWith('whisky:') === true;
  const approachCabinet = useCallback(() => {
    if (cabinet.current) setInspection({ id: 'whisky-cabinet', ...whiskyCabinetPose(cabinet.current, size) });
  }, [size, setInspection]);
  const toggle = useCallback(() => {
    if (editing) return;
    if (!open) {
      approachCabinet();
      if (approached) setOpen(true);
      return;
    }
    if (open && selection) {
      closing.current = true;
      setSelection(current => returnWhiskyBottle(current, true));
      approachCabinet();
    } else setOpen(value => !value);
  }, [approached, approachCabinet, editing, open, selection]);
  const { hovered, handlers } = useCabinetAction({ disabled: editing, onActivate: toggle });
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
  }, [selection]);
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
    const pose = inspection.id.startsWith('whisky:') ? whiskyInspectionPose(cabinet.current, size) : whiskyCabinetPose(cabinet.current, size);
    setInspection({ id: inspection.id, ...pose });
  }, [approached, inspection, setInspection, size]);
  const controlsVisible = !editing && (hovered || focused || open || approached);
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
      <IsidoroBarware />
      <IsidoroInteriorLighting lowerShelf={0.905} open={open && !editing} power={lamp} reducedMotion={reducedMotion} />
    </IsidoroFixedHalf>
    <WhiskyCabinetDoor open={open} pivot={doorPivot} wood={wood}
      disabled={editing} onActivate={toggle}>
      <group name="complete seven-bottle whisky and Armagnac collection">
        <Suspense fallback={null}><WhiskyCollection cabinet={cabinet} selection={selection}
          enabled={ready && !editing} reducedMotion={reducedMotion || editing} onSelect={chooseBottle} onReturned={returned} /></Suspense>
        <IsidoroInteriorLighting lowerShelf={0.705} open={open && !editing} power={lamp} reducedMotion={reducedMotion} />
      </group>
    </WhiskyCabinetDoor>
    <IsidoroWorktop open={open} pivot={worktopPivot} wood={wood} disabled={editing} />
    <Html center position={[0, narrow ? -0.12 : 1.25, -0.31]} zIndexRange={[17, 11]}>
      <div className="whisky-cabinet-controls" role="group" aria-label="Poltrona Frau Isidoro drinks cabinet"
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
        onPointerEnter={() => setFocused(true)} onPointerLeave={() => setFocused(false)}
        onPointerDown={event => event.stopPropagation()} onDoubleClick={event => event.stopPropagation()}
        style={{
          padding: 4,
          borderRadius: 4,
          background: PALETTE.paperLight,
          opacity: controlsVisible ? 1 : 0,
          pointerEvents: controlsVisible ? 'auto' : 'none',
          transition: reducedMotion ? 'none' : 'opacity 180ms',
          boxShadow: '0 2px 12px #202d2a1a',
        }}>
        <button type="button" disabled={editing} aria-label={`${open ? 'Close' : 'Open'} Isidoro drinks cabinet`}
          aria-expanded={open} onClick={toggle} style={CONTROL_STYLE}>{open ? 'Close bar' : approached ? 'Open bar' : 'View bar'}</button>
        {approached && !selection && <button type="button" onClick={leaveCabinet} aria-label="Close cabinet view"
          style={{ ...CONTROL_STYLE, minWidth: 44, width: 44, display: 'grid', placeItems: 'center' }}><OfficeIcon name="close" /></button>}
      </div>
    </Html>
    {selection && <WhiskyBottleInspector bottleId={selection.bottle} returning={selection.returning}
      onReturn={returnBottle} />}
  </group>;
}

const CONTROL_STYLE = {
  minWidth: 76,
  minHeight: 44,
  padding: 4,
  border: `1px solid ${PALETTE.line}`,
  borderRadius: 4,
  color: PALETTE.ink,
  background: 'transparent',
  font: '500 11px Manrope, sans-serif',
  cursor: 'pointer',
} satisfies CSSProperties;
