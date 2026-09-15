import { Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import { Vector3 } from 'three';
import type { Group } from 'three';
import { BEOSOUND_ALBUMS } from './BeosoundAlbums';
import type { AlbumId } from './BeosoundAlbums';
import { cdPosition, BEOSOUND_9000 as B } from './Beosound9000State';
import type { BeosoundState, CdSlot } from './Beosound9000State';
import { screenOrigin } from './BeosoundRack';

type Point = { readonly x: number; readonly y: number; readonly size: number };
export function BeosoundScreenExchange({ exchange, elapsed }: {
  readonly exchange: NonNullable<BeosoundState['exchange']>;
  readonly elapsed: { readonly current: number };
}) {
  const group = useRef<Group>(null), outgoing = useRef<HTMLDivElement>(null), incoming = useRef<HTMLDivElement>(null);
  const { camera, gl } = useThree();
  const slotPoint = (slot: CdSlot): Point => {
    const local = new Vector3(cdPosition(slot), B.discY * Math.cos(B.tilt) - .045 * Math.sin(B.tilt) + B.bracketHeight,
      B.discY * Math.sin(B.tilt) + .045 * Math.cos(B.tilt));
    const edge = local.clone().add(new Vector3(.12, 0, 0));
    group.current?.localToWorld(local); group.current?.localToWorld(edge);
    local.project(camera); edge.project(camera);
    const bounds = gl.domElement.getBoundingClientRect();
    return { x: bounds.left + (local.x + 1) * bounds.width / 2, y: bounds.top + (1 - local.y) * bounds.height / 2,
      size: Math.hypot((local.x - edge.x) * bounds.width / 2, (local.y - edge.y) * bounds.height / 2) };
  };
  const coverPoint = (album: AlbumId): Point | null => {
    const cover = document.querySelector<HTMLElement>(`.cd-case-rail button[data-cd-album="${album}"] img`);
    if (!cover) return null;
    const bounds = cover.getBoundingClientRect();
    return { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2, size: bounds.height * .82 };
  };
  const move = (disc: HTMLDivElement | null, from: Point, to: Point, progress: number, returning: boolean) => {
    if (!disc) return;
    const t = Math.min(1, Math.max(0, progress)), ease = t * t * (3 - 2 * t);
    const x = from.x + (to.x - from.x) * ease, y = from.y + (to.y - from.y) * ease - Math.sin(t * Math.PI) * 32;
    const size = from.size + (to.size - from.size) * ease;
    disc.style.transform = `translate3d(${x - 60}px, ${y - 60}px, 0) scale(${size / 120}) rotate(${Math.sin(t * Math.PI) * 16}deg)`;
    disc.style.opacity = String(returning ? Math.min(1, (1 - t) * 7) : Math.min(1, t * 7));
  };
  useFrame(() => {
    if (!document.querySelector('.cd-booklet:not([inert])')) {
      if (outgoing.current) outgoing.current.style.opacity = '0';
      if (incoming.current) incoming.current.style.opacity = '0';
      return;
    }
    const t = elapsed.current;
    if (exchange.outgoing) {
      const cover = coverPoint(exchange.outgoing);
      if (cover) move(outgoing.current, slotPoint(exchange.slot), cover, (t - .25) / .4, true);
    }
    if (exchange.album) {
      const cover = coverPoint(exchange.album);
      if (cover) {
        if (exchange.source && t < .7) move(incoming.current, slotPoint(exchange.source), cover, (t - .25) / .4, true);
        else move(incoming.current, cover, slotPoint(exchange.slot), (t - .7) / .4, false);
      }
    }
  });
  const disc = (album: AlbumId, ref: typeof outgoing) => <div ref={ref} className="cd-transfer-disc" data-transfer-album={album}
    style={{ backgroundImage: `url("${BEOSOUND_ALBUMS[album].cover}")` }} />;
  return <group ref={group}><Html calculatePosition={screenOrigin} zIndexRange={[62, 60]} style={{ pointerEvents: 'none' }}>
    <div className="cd-transfer" aria-hidden="true">{exchange.outgoing && disc(exchange.outgoing, outgoing)}{exchange.album && disc(exchange.album, incoming)}</div>
  </Html></group>;
}
