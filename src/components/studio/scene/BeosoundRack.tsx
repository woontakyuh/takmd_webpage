import { Html } from '@react-three/drei';
import { Suspense, useEffect, useRef, useState } from 'react';
import type { Dispatch } from 'react';
import { ALBUM_IDS } from './BeosoundAlbums';
import type { AlbumId } from './BeosoundAlbums';
import type { BeosoundState, BeosoundAction } from './Beosound9000State';
import { BeosoundBooklet } from './BeosoundBooklet';
import { BeosoundCase } from './BeosoundCase';
import { usePrintedTexture } from './Textures';
import { Block } from './Primitives';

export const screenOrigin = () => [0, 0];
export function BeosoundRack({ state, active, disabled, reducedMotion, onOpen, onExpanded, dispatch }: {
  readonly state: BeosoundState; readonly active: boolean; readonly disabled: boolean; readonly reducedMotion: boolean;
  readonly onOpen: () => void; readonly onExpanded: (expanded: boolean) => void; readonly dispatch: Dispatch<BeosoundAction>;
}) {
  const trigger = useRef<HTMLButtonElement>(null), previouslyOpen = useRef(false);
  const wood = usePrintedTexture('wood');
  const [expanded, setExpanded] = useState(false), [album, setAlbum] = useState<AlbumId>(1);
  useEffect(() => { if (previouslyOpen.current && !expanded) trigger.current?.focus({ preventScroll: true }); previouslyOpen.current = expanded; onExpanded(expanded); }, [expanded, onExpanded]);
  useEffect(() => { if (!active) setExpanded(false); }, [active]);
  const choose = (id: AlbumId) => { setAlbum(id); setExpanded(true); onOpen(); };
  return <group name="Slanted walnut tabletop CD holder">
    <Block size={[.28, .018, .16]} position={[.59, .009, -.02]} radius={.003} color="#77503A" texture={wood} roughness={.7} />
    <Block size={[.28, .06, .012]} position={[.59, .045, -.094]} rotation={[-.15, 0, 0]} radius={.002} color="#77503A" texture={wood} roughness={.7} />
    <Block size={[.018, .13, .15]} position={[.456, .077, -.018]} rotation={[0, 0, -.13]} radius={.002} color="#463729" texture={wood} roughness={.7} />
    <Block size={[.018, .055, .15]} position={[.724, .037, -.018]} radius={.002} color="#463729" texture={wood} roughness={.7} />
    {ALBUM_IDS.map(id => <Suspense key={id} fallback={null}><BeosoundCase album={id} disabled={disabled}
      selected={album === id} browsing={active && expanded} reducedMotion={reducedMotion} onOpen={choose} /></Suspense>)}
    {active && <Html wrapperClass="cd-screen-ui" calculatePosition={screenOrigin} zIndexRange={[46, 44]} style={{ pointerEvents: 'none' }}>
      {expanded ? <BeosoundBooklet state={state} album={album} onAlbum={setAlbum} onClose={() => setExpanded(false)} dispatch={dispatch} />
        : <button ref={trigger} className="cd-collection-trigger" type="button" aria-expanded={false}
          onPointerDown={event => event.stopPropagation()} onClick={event => { event.stopPropagation(); setExpanded(true); }}>Explore CD collection · {ALBUM_IDS.length}</button>}
    </Html>}
  </group>;
}
