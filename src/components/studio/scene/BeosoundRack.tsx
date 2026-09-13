import { Html, useTexture } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useRef, useState } from 'react';
import type { Dispatch, SyntheticEvent } from 'react';
import { SRGBColorSpace } from 'three';
import type { Group } from 'three';
import { ALBUM_IDS, BEOSOUND_ALBUMS } from './BeosoundAlbums';
import type { AlbumId } from './BeosoundAlbums';
import { CD_SLOTS, cdPosition, BEOSOUND_9000 as B } from './Beosound9000State';
import type { BeosoundState, BeosoundAction, CdSlot } from './Beosound9000State';
import { BeosoundDiscArt } from './BeosoundDiscArt';
import { Block } from './Primitives';
import { useCabinetAction } from './WhiskyCabinetDoor';

const stop = (event: SyntheticEvent) => event.stopPropagation();
const rackPosition = (album: AlbumId): [number, number, number] => [.59, .076, -.08 + (ALBUM_IDS.length - 1 - ALBUM_IDS.indexOf(album)) * .018];
function JewelCase({ album, disabled, onOpen }: { readonly album: AlbumId; readonly disabled: boolean; readonly onOpen: (album: AlbumId) => void }) {
  const record = BEOSOUND_ALBUMS[album];
  const map = useTexture(record?.cover ?? '');
  map.colorSpace = SRGBColorSpace;
  const { hovered, handlers } = useCabinetAction({ disabled, onActivate: () => onOpen(album) });
  return <group name={`CD case ${album} ${record?.artist}`} position={rackPosition(album)} rotation={[-.13, -.22, 0]} {...handlers}>
    <Block size={[.142, .125, .01]} radius={.001} color="#424944" metalness={.25} roughness={.32} />
    <mesh position={[.004, 0, .0052]}><planeGeometry args={[.124, .121]} /><meshStandardMaterial map={map} roughness={.52} /></mesh>
    <Block size={[.008, .125, .011]} position={[-.067, 0, 0]} radius={.001} color={hovered ? '#c7cec5' : '#27352f'} roughness={.38} />
  </group>;
}

export function BeosoundRack({ state, active, disabled, compact, onOpen, onExpanded, dispatch }: {
  readonly state: BeosoundState; readonly active: boolean; readonly disabled: boolean; readonly compact: boolean;
  readonly onOpen: () => void; readonly onExpanded: (expanded: boolean) => void; readonly dispatch: Dispatch<BeosoundAction>;
}) {
  const short = useThree(state => state.size.height < 600);
  const [expanded, setExpanded] = useState(false);
  const [album, setAlbum] = useState<AlbumId>(1);
  const [slot, setSlot] = useState<CdSlot>(1);
  const trigger = useRef<HTMLButtonElement>(null);
  const picker = useRef<HTMLSelectElement>(null);
  useEffect(() => { onExpanded(expanded); }, [expanded, onExpanded]);
  useEffect(() => { if (!active) setExpanded(false); }, [active]);
  useEffect(() => { if (expanded) picker.current?.focus({ preventScroll: true }); }, [expanded]);
  const choose = (id: AlbumId) => { setAlbum(id); setExpanded(true); onOpen(); };
  const selected = BEOSOUND_ALBUMS[album];
  const currentSlot = CD_SLOTS.find(id => state.slots[id - 1] === album);
  const busy = state.exchange !== null;
  return <group name="Six jewel cases in graphite CD rack">
    <Block size={[.18, .013, .167]} position={[.59, .0065, -.025]} radius={.002} color="#27352f" metalness={.4} roughness={.46} />
    {[-.086, .086].map(x => <Block key={x} size={[.004, .095, .157]} position={[.59 + x, .049, -.025]} radius={.001} color="#bbc2c2" metalness={.8} roughness={.32} />)}
    {ALBUM_IDS.map(id => <Suspense key={id} fallback={null}><JewelCase album={id} disabled={disabled || busy} onOpen={choose} /></Suspense>)}
    {active && <Html position={compact ? [.10, expanded ? .10 : -.52, .08] : [.10, short && expanded ? .24 : -.03, .08]} zIndexRange={[44, 40]}>
      <div className="beosound-library" data-compact={compact} data-short={short} onPointerDown={stop} onPointerUp={stop} onClick={stop} onDoubleClick={stop} onWheel={stop}
        onKeyDown={event => { if (event.key === 'Escape' && expanded) { event.preventDefault(); event.stopPropagation(); setExpanded(false); trigger.current?.focus(); } }}>
        <button ref={trigger} className="beosound-library-trigger" type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>CD collection <span>{expanded ? '−' : '+'}</span></button>
        {expanded && <div className="beosound-library-content">
          <div className="beosound-library-album"><img src={selected?.cover} alt={`${selected?.album} cover`} /><div><strong>{selected?.artist}</strong><p>{selected?.album}</p><small>{currentSlot ? `In player · CD ${currentSlot}` : 'In the rack'}</small></div></div>
          <label>Album<select aria-label="Album" ref={picker} value={album} disabled={busy} onChange={event => { const id = ALBUM_IDS.find(id => String(id) === event.target.value); if (id) setAlbum(id); }}>
            {ALBUM_IDS.map(id => <option key={id} value={id}>{BEOSOUND_ALBUMS[id]?.artist} — {BEOSOUND_ALBUMS[id]?.track}</option>)}
          </select></label>
          <label>Player slot<select aria-label="Player slot" value={slot} disabled={busy} onChange={event => { const id = CD_SLOTS.find(id => String(id) === event.target.value); if (id) setSlot(id); }}>
            {CD_SLOTS.map(id => <option key={id} value={id}>CD {id} · {state.slots[id - 1] ? BEOSOUND_ALBUMS[state.slots[id - 1] ?? 1]?.artist : 'Empty'}</option>)}
          </select></label>
          <div className="beosound-library-actions"><button type="button" disabled={busy || state.slots[slot - 1] === album} onClick={() => dispatch({ type: 'exchange', slot, album })}>Place in CD {slot}</button>
            <button type="button" disabled={busy || !state.slots[slot - 1]} onClick={() => dispatch({ type: 'exchange', slot, album: null })}>Return to rack</button></div>
          <p className="beosound-library-status" role="status">{busy ? 'Changing disc…' : 'Choose an album and slot. Press CD ▷ to listen.'}</p>
        </div>}
      </div>
    </Html>}
  </group>;
}

export function BeosoundExchange({ exchange, reducedMotion, onComplete }: {
  readonly exchange: NonNullable<BeosoundState['exchange']>; readonly reducedMotion: boolean; readonly onComplete: () => void;
}) {
  const invalidate = useThree(state => state.invalidate);
  useEffect(() => invalidate(), [invalidate]);
  const elapsed = useRef(0), outgoing = useRef<Group>(null), incoming = useRef<Group>(null), finished = useRef(false);
  const slotPoint = (slot: CdSlot): [number, number, number] => [cdPosition(slot), B.discY * Math.cos(B.tilt) - .045 * Math.sin(B.tilt) + B.bracketHeight, B.discY * Math.sin(B.tilt) + .045 * Math.cos(B.tilt)];
  const travel = (object: Group | null, from: readonly number[], to: readonly number[], progress: number) => {
    if (!object) return;
    const t = Math.max(0, Math.min(1, progress));
    const eased = t * t * (3 - 2 * t);
    object.position.set(from[0] + (to[0] - from[0]) * eased, from[1] + (to[1] - from[1]) * eased + Math.sin(t * Math.PI) * .12,
      from[2] + (to[2] - from[2]) * eased + Math.sin(t * Math.PI) * .18);
  };
  useFrame((_, delta) => {
    if (finished.current) return;
    elapsed.current += Math.min(delta, .1);
    const t = reducedMotion ? 3 : elapsed.current;
    if (exchange.outgoing) travel(outgoing.current, slotPoint(exchange.slot), rackPosition(exchange.outgoing), (t - .8) / .6);
    if (exchange.album) travel(incoming.current, exchange.source ? slotPoint(exchange.source) : rackPosition(exchange.album), slotPoint(exchange.slot), (t - 1.5) / .6);
    if (outgoing.current) outgoing.current.visible = t < 1.4;
    if (incoming.current) incoming.current.visible = Boolean(exchange.source) || t >= 1.5;
    if (t >= 2.1) { finished.current = true; onComplete(); }
    else invalidate();
  });
  return <group name="Physical CD exchange">
    {exchange.outgoing && <group ref={outgoing} position={slotPoint(exchange.slot)}><mesh><BeosoundDiscArt src={BEOSOUND_ALBUMS[exchange.outgoing]?.cover ?? ''} /></mesh></group>}
    {exchange.album && <group ref={incoming} visible={false}><mesh><BeosoundDiscArt src={BEOSOUND_ALBUMS[exchange.album]?.cover ?? ''} /></mesh></group>}
  </group>;
}
