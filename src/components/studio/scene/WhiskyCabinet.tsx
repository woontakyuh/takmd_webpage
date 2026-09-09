import { Html } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Group, Texture } from 'three';
import { useArrangement } from '../arrangement';
import { PALETTE } from './config';
import { IsidoroBarware } from './IsidoroBarware';
import { IsidoroFixedHalf } from './IsidoroCabinetGeometry';
import { IsidoroWorktop, WhiskyCabinetDoor, useCabinetAction, useIsidoroMotion } from './WhiskyCabinetDoor';
import { WHISKY_CABINET } from './WhiskyCabinetLayout';
import { WhiskyCollection } from './WhiskyCollection';
import { WhiskyBottleChooser, WhiskyBottleInspector } from './WhiskyBottleInspector';
import { finishWhiskyReturn, returnWhiskyBottle, selectWhiskyBottle } from './WhiskyInspectionState';
import type { WhiskyBottleId, WhiskyInspectionState } from './WhiskyInspectionState';
import { whiskyInspectionPose } from './WhiskyInspectionMotion';
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
  const narrow = useThree(state => state.size.width < 760);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [selection, setSelection] = useState<WhiskyInspectionState>(null);
  const cabinet = useRef<Group>(null);
  const { inspection, setInspection } = useSceneInspection();
  const doorPivot = useRef<Group>(null);
  const worktopPivot = useRef<Group>(null);
  const ready = useIsidoroMotion(doorPivot, worktopPivot, open, reducedMotion, editing);
  const toggle = useCallback(() => {
    if (editing) return;
    if (open && selection) setSelection(current => returnWhiskyBottle(current, true));
    else setOpen(value => !value);
  }, [editing, open, selection]);
  const { hovered, handlers } = useCabinetAction({ disabled: editing, onActivate: toggle });
  const chooseBottle = useCallback((id: WhiskyBottleId) => {
    if (!ready || !cabinet.current) return;
    setSelection(current => selectWhiskyBottle(current, id));
    setInspection({ id: `whisky:${id}`, ...whiskyInspectionPose(cabinet.current, narrow) });
  }, [narrow, ready, setInspection]);
  const returnBottle = useCallback(() => setSelection(current => returnWhiskyBottle(current, false)), []);
  const returned = useCallback(() => {
    if (!selection?.returning) return;
    if (selection.closing) setOpen(false);
    if (!selection.next) setInspection(null);
    setSelection(finishWhiskyReturn(selection));
  }, [selection, setInspection]);
  useEffect(() => {
    if (editing) { setOpen(false); setSelection(null); }
  }, [editing]);
  useEffect(() => { if (!inspection) returnBottle(); }, [inspection, returnBottle]);
  const controlsVisible = !editing && (hovered || focused || open);
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
          aria-expanded={open} onClick={toggle} style={CONTROL_STYLE}>{open ? 'Close bar' : 'Open bar'}</button>
        {open && !selection && <WhiskyBottleChooser selected={null} disabled={!ready} onSelect={chooseBottle} />}
      </div>
    </Html>
    {selection && <WhiskyBottleInspector bottleId={selection.bottle} returning={selection.returning}
      onReturn={returnBottle} onSelect={chooseBottle} />}
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
