import { Html } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useCallback, useEffect, useState } from 'react';
import { Vector3 } from 'three';
import type { Group } from 'three';
import { useArrangement } from '../arrangement';
import { Beosound9000Controls } from './Beosound9000Controls';
import { Beosound9000Bracket, Beosound9000Geometry } from './Beosound9000Geometry';
import { BEOSOUND_9000 as B } from './Beosound9000State';
import { useBeosoundAudio } from './Beosound9000Audio';
import type { CdSlot } from './Beosound9000State';
import { useSceneInspection } from './SceneInspection';
import { cancelSceneSingleAction } from './sceneGesture';
import { useCabinetAction } from './WhiskyCabinetDoor';

export function Beosound9000({ reducedMotion }: { readonly reducedMotion: boolean }) {
  const [body, setBody] = useState<Group | null>(null);
  const { state, dispatch, onCarriageReady } = useBeosoundAudio();
  const { size, camera, gl } = useThree();
  const { editing } = useArrangement();
  const { inspection, setInspection } = useSceneInspection();
  const active = inspection?.id === 'beosound-9000', compact = size.width < 760;
  const pose = useCallback(() => {
    if (!body) return null;
    const fov = 'fov' in camera && typeof camera.fov === 'number' ? camera.fov : 42;
    const distance = Math.max(.82, (compact ? .95 : 1.04) / (2 * Math.tan(fov * Math.PI / 360) * size.width / size.height));
    const target = body.localToWorld(new Vector3(0, compact ? .04 : .15, .02));
    const position = body.localToWorld(new Vector3(0, (compact ? .04 : .15) + .045, distance));
    return { id: 'beosound-9000', position: position.toArray(), target: target.toArray() };
  }, [body, camera, compact, size.height, size.width]);
  const open = useCallback(() => {
    const next = pose();
    if (next) setInspection(next);
  }, [pose, setInspection]);
  const close = useCallback(() => {
    cancelSceneSingleAction(gl.domElement);
    setInspection(null);
  }, [gl.domElement, setInspection]);
  const select = (disc: CdSlot) => {
    if (!active) { open(); return; }
    dispatch({ type: 'disc', disc });
  };
  const { handlers } = useCabinetAction({ disabled: editing || active, onActivate: open });
  useEffect(() => {
    if (!active) return;
    const next = pose();
    if (next) setInspection(next);
  }, [active, pose, setInspection]);
  useEffect(() => { if (editing && active) setInspection(null); }, [active, editing, setInspection]);
  return <group name="Bang & Olufsen Beosound 9000" userData={{ sceneControl: true, active, selectedDisc: state.disc }}>
    <Beosound9000Bracket />
    <group ref={setBody} position={[0, B.bracketHeight, 0]} rotation={[B.tilt, 0, 0]} {...(!active ? handlers : {})}>
      <Beosound9000Geometry state={state} active={active} disabled={editing} reducedMotion={reducedMotion} onSelect={select} onCarriageReady={onCarriageReady} />
      {active && <Beosound9000Controls state={state} compact={compact} dispatch={dispatch} onClose={close} />}
      {!active && !editing && <Html position={[-.416, .04, .079]} center occlude={body ? [{ current: body }] : undefined} zIndexRange={[30, 26]}>
        <button className="beosound-entry" type="button" aria-label="Inspect Beosound 9000 CD system"
          onPointerDown={event => event.stopPropagation()} onPointerUp={event => event.stopPropagation()}
          onClick={event => { event.stopPropagation(); open(); }} />
      </Html>}
    </group>
  </group>;
}
