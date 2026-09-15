import { Html } from '@react-three/drei';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import type { Group } from 'three';
import type { Dispatch } from 'react';
import { ALBUM_IDS } from './BeosoundAlbums';
import type { AlbumId } from './BeosoundAlbums';
import type { BeosoundState, BeosoundAction } from './Beosound9000State';
import { BeosoundBooklet } from './BeosoundBooklet';
import { BeosoundCase } from './BeosoundCase';
import { usePrintedTexture } from './Textures';
import { Block } from './Primitives';
import { useCabinetAction } from './WhiskyCabinetDoor';

export const screenOrigin = () => [0, 0];
export function BeosoundRack({ state, active, expanded, showTrigger, disabled, reducedMotion, onOpen, onExpanded, dispatch }: {
  readonly state: BeosoundState; readonly active: boolean; readonly expanded: boolean; readonly showTrigger: boolean; readonly disabled: boolean; readonly reducedMotion: boolean;
  readonly onOpen: () => void; readonly onExpanded: (expanded: boolean) => void; readonly dispatch: Dispatch<BeosoundAction>;
}) {
  const trigger = useRef<HTMLButtonElement>(null), previouslyOpen = useRef(false);
  const rack = useRef<Group>(null);
  const { camera, gl } = useThree();
  const [present, setPresent] = useState(expanded);
  useEffect(() => { if (!active) setPresent(false); else if (expanded) setPresent(true); }, [active, expanded]);
  const origin = useCallback(() => {
    const point = new Vector3(.59, .089, -.015);
    rack.current?.localToWorld(point);
    point.project(camera);
    const bounds = gl.domElement.getBoundingClientRect();
    return { x: bounds.left + (point.x + 1) * bounds.width / 2, y: bounds.top + (1 - point.y) * bounds.height / 2 };
  }, [camera, gl]);
  const finishClose = useCallback(() => setPresent(false), []);
  const wood = usePrintedTexture('wood');
  const [album, setAlbum] = useState<AlbumId>(1);
  useEffect(() => { if (previouslyOpen.current && !expanded) trigger.current?.focus({ preventScroll: true }); previouslyOpen.current = expanded; }, [expanded]);
  const choose = (id: AlbumId) => { if (!active) { onOpen(); return; } setAlbum(id); onExpanded(true); };
  const { handlers } = useCabinetAction({ visualAccent: true, disabled, onActivate: () => active ? onExpanded(true) : onOpen() });
  return <group ref={rack} name="Slanted walnut tabletop CD holder" {...handlers}>
    <Block size={[.28, .018, .16]} position={[.59, .009, -.02]} radius={.003} color="#876b52" texture={wood} roughness={.7} />
    <Block size={[.28, .06, .012]} position={[.59, .045, -.094]} rotation={[-.15, 0, 0]} radius={.002} color="#876b52" texture={wood} roughness={.7} />
    <Block size={[.018, .075, .15]} position={[.456, .0495, -.018]} rotation={[0, 0, -.13]} radius={.002} color="#71573f" texture={wood} roughness={.7} />
    <Block size={[.018, .055, .15]} position={[.724, .037, -.018]} radius={.002} color="#71573f" texture={wood} roughness={.7} />
    {ALBUM_IDS.map(id => <Suspense key={id} fallback={null}><BeosoundCase album={id} disabled={disabled}
      selected={album === id} browsing={active && expanded} reducedMotion={reducedMotion} onOpen={choose} /></Suspense>)}
    {active && (expanded || present || showTrigger) && <Html wrapperClass="cd-screen-ui" calculatePosition={screenOrigin} zIndexRange={[46, 44]} style={{ pointerEvents: 'none' }}>
      {(expanded || present) ? <BeosoundBooklet expanded={expanded} reducedMotion={reducedMotion} origin={origin} onClosed={finishClose} state={state} album={album} onAlbum={setAlbum} onClose={() => onExpanded(false)} dispatch={dispatch} />
        : <button ref={trigger} className="cd-collection-trigger" type="button" aria-expanded={false}
          onPointerDown={event => event.stopPropagation()} onClick={event => { event.stopPropagation(); onExpanded(true); }}>Explore CD collection · {ALBUM_IDS.length}</button>}
    </Html>}
  </group>;
}
