import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import type { Group } from 'three';
import { BEOSOUND_ALBUMS } from './BeosoundAlbums';
import { cdPosition, BEOSOUND_9000 as B } from './Beosound9000State';
import type { BeosoundState, CdSlot } from './Beosound9000State';
import { BeosoundDiscArt } from './BeosoundDiscArt';
import { rackPosition } from './BeosoundCase';
import { BeosoundScreenExchange } from './BeosoundScreenExchange';

export function BeosoundExchange({ exchange, reducedMotion, onSettle, onComplete, onInsert }: {
  readonly onInsert: () => void;
  readonly exchange: NonNullable<BeosoundState['exchange']>; readonly reducedMotion: boolean; readonly onSettle: () => void; readonly onComplete: () => void;
}) {
  const [screenTransfer] = useState(() => Boolean(document.querySelector('.cd-booklet:not([inert])')));
  const invalidate = useThree(state => state.invalidate);
  useEffect(() => invalidate(), [invalidate]);
  const settled = useRef(false), inserting = useRef(false);
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
    if (exchange.outgoing) travel(outgoing.current, slotPoint(exchange.slot), rackPosition(exchange.outgoing), (t - .45) / .65);
    if (exchange.album) travel(incoming.current, exchange.source ? slotPoint(exchange.source) : rackPosition(exchange.album), slotPoint(exchange.slot), (t - 1.65) / .7);
    if (outgoing.current) outgoing.current.visible = t < 1.1;
    if (incoming.current) incoming.current.visible = Boolean(exchange.source) || t >= 1.65;
    if (t >= 1.15 && !inserting.current) { inserting.current = true; onInsert(); }
    if (t >= 2.35 && !settled.current) { settled.current = true; onSettle(); }
    if (t >= 2.7) { finished.current = true; onComplete(); }
    else invalidate();
  });
  return <group name="Physical CD exchange">
    {screenTransfer && !reducedMotion && <BeosoundScreenExchange exchange={exchange} elapsed={elapsed} />}
    {!screenTransfer && exchange.outgoing && <group ref={outgoing} position={slotPoint(exchange.slot)}><mesh><BeosoundDiscArt src={BEOSOUND_ALBUMS[exchange.outgoing]?.cover ?? ''} /></mesh></group>}
    {!screenTransfer && exchange.album && <group ref={incoming} visible={false}><mesh><BeosoundDiscArt src={BEOSOUND_ALBUMS[exchange.album]?.cover ?? ''} /></mesh></group>}
  </group>;
}
