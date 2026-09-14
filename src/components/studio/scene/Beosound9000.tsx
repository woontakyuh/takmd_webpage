import { Html } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useCallback, useEffect, useState } from 'react';
import { Vector3 } from 'three';
import type { Group } from 'three';
import { focusFov } from './config';
import { useArrangement } from '../arrangement';
import { BeosoundRack } from './BeosoundRack';
import { BeosoundExchange } from './BeosoundExchange';
import { BeosoundMiniPlayer } from './BeosoundMiniPlayer';
import { Beosound9000Controls } from './Beosound9000Controls';
import { Beosound9000Bracket, Beosound9000Geometry } from './Beosound9000Geometry';
import { BEOSOUND_9000 as B } from './Beosound9000State';
import { useBeosoundAudio } from './Beosound9000Audio';
import type { CdSlot } from './Beosound9000State';
import { useSceneInspection } from './SceneInspection';
import { cancelSceneSingleAction } from './sceneGesture';
import { useCabinetAction } from './WhiskyCabinetDoor';

export function Beosound9000({ reducedMotion }: { readonly reducedMotion: boolean }) {
  const [mode, setMode] = useState<'overview' | 'rack'>('overview');
  const libraryOpen = mode === 'rack';
  const [body, setBody] = useState<Group | null>(null);
  const { state, dispatch, onCarriageReady } = useBeosoundAudio();
  const { size, camera, gl } = useThree();
  const { editing } = useArrangement();
  const { inspection, setInspection } = useSceneInspection();
  const active = inspection?.id === 'beosound-9000', compact = size.width < 760;
  const pose = useCallback(() => {
    if (!body) return null;
    const fov = focusFov(null, compact, size.width, size.height);
    const short = libraryOpen && size.height < 600 && size.width >= 600;
    const frameWidth = short ? 3 : 1.4;
    const distance = Math.max(.82, frameWidth / (2 * Math.tan(fov * Math.PI / 360) * size.width / size.height));
    const eyeY = libraryOpen ? (short ? .15 : compact ? -.48 : -.065) : (compact ? .04 : .15);
    const eyeX = short ? .88 : .14;
    const target = body.localToWorld(new Vector3(eyeX, eyeY, .02));
    const position = body.localToWorld(new Vector3(eyeX, eyeY + .09, distance));
    return { id: 'beosound-9000', position: position.toArray(), target: target.toArray() };
  }, [body, camera, compact, libraryOpen, size.height, size.width]);
  const open = useCallback(() => {
    const next = pose();
    if (next) setInspection(next);
  }, [pose, setInspection]);
  const showPlayer = () => {
    if (!active) { open(); return; }
    setMode('overview');
  };
  const expandLibrary = useCallback((expanded: boolean) => setMode(expanded ? 'rack' : 'overview'), []);
  const close = useCallback(() => {
    cancelSceneSingleAction(gl.domElement);
    setInspection(null);
  }, [gl.domElement, setInspection]);
  const back = useCallback(() => {
    if (mode === 'overview') close();
    else setMode('overview');
  }, [close, mode]);
  const select = (disc: CdSlot) => {
    if (!active) { open(); return; }
    dispatch({ type: 'disc', disc });
  };
  const { handlers } = useCabinetAction({ disabled: editing, onActivate: showPlayer });
  useEffect(() => { if (!active) setMode('overview'); }, [active]);
  useEffect(() => {
    if (!active) return;
    const next = pose();
    if (next) setInspection(next);
  }, [active, pose, setInspection]);
  useEffect(() => { if (editing && active) setInspection(null); }, [active, editing, setInspection]);
  return <group name="Bang & Olufsen Beosound 9000" userData={{ sceneControl: true, active, selectedDisc: state.disc }}>
    <Beosound9000Bracket />
    <BeosoundMiniPlayer state={state} dispatch={dispatch} />
    <BeosoundRack state={state} active={active} expanded={libraryOpen} showTrigger={false} disabled={editing} reducedMotion={reducedMotion} onOpen={open} onExpanded={expandLibrary} dispatch={dispatch} />
    {state.exchange && <BeosoundExchange key={state.transportRequest} onSettle={() => dispatch({ type: 'exchange-settle' })} exchange={state.exchange} reducedMotion={reducedMotion} onComplete={() => dispatch({ type: 'exchange-complete' })} />}
    <group ref={setBody} position={[0, B.bracketHeight, 0]} rotation={[B.tilt, 0, 0]} {...handlers}>
      <Beosound9000Geometry state={state} disabled={editing || state.exchange !== null} reducedMotion={reducedMotion} onSelect={select} onCarriageReady={onCarriageReady} />
      <Beosound9000Controls active={active && !libraryOpen} disabled={editing || state.exchange !== null || libraryOpen}
        dispatch={dispatch} onApproach={open} onClose={back} />
      {!active && !editing && <Html position={[-.416, .04, .079]} center occlude={body ? [{ current: body }] : undefined} zIndexRange={[30, 26]}>
        <button className="beosound-entry" type="button" aria-label="Inspect Beosound 9000 CD system"
          onPointerDown={event => event.stopPropagation()} onPointerUp={event => event.stopPropagation()}
          onClick={event => { event.stopPropagation(); open(); }} />
      </Html>}
    </group>
  </group>;
}
