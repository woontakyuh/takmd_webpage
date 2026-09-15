import { Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import { Vector3 } from 'three';
import type { Group } from 'three';
import { BEOSOUND_ALBUMS } from './BeosoundAlbums';
import type { AlbumId } from './BeosoundAlbums';
import { BEOSOUND_9000 as B, CD_SLOTS, cdPosition } from './Beosound9000State';
import type { BeosoundState, CdSlot } from './Beosound9000State';

export function BeosoundSlotPicker({ state, album, highlighted, onHighlight, onChoose }: {
  readonly state: BeosoundState; readonly album: AlbumId; readonly highlighted: CdSlot | null;
  readonly onHighlight: (slot: CdSlot | null) => void; readonly onChoose: (slot: CdSlot) => void;
}) {
  const group = useRef<Group>(null), buttons = useRef(new Map<CdSlot, HTMLButtonElement>());
  const { camera, size } = useThree();
  const center = useRef(new Vector3()), edge = useRef(new Vector3());
  useFrame(() => {
    if (!group.current) return;
    for (const slot of CD_SLOTS) {
      center.current.set(cdPosition(slot), B.discY, .085);
      edge.current.copy(center.current); edge.current.x += B.discRadius;
      group.current.localToWorld(center.current).project(camera);
      group.current.localToWorld(edge.current).project(camera);
      const diameter = Math.abs(edge.current.x - center.current.x) * size.width;
      const button = buttons.current.get(slot);
      if (button) { button.style.width = `${diameter}px`; button.style.height = `${diameter}px`; }
    }
  });
  return <group ref={group} name="Choose a physical CD slot">
    {CD_SLOTS.map(slot => {
      const id = state.slots[slot - 1], current = id ? BEOSOUND_ALBUMS[id] : null;
      return <Html key={slot} position={[cdPosition(slot), B.discY, .085]} center zIndexRange={[58, 56]}>
        <button ref={element => { if (element) buttons.current.set(slot, element); else buttons.current.delete(slot); }} type="button"
          className="cd-physical-slot" data-slot={slot} data-highlighted={highlighted === slot} disabled={id === album}
          aria-label={`Place ${BEOSOUND_ALBUMS[album].album} in CD ${slot}`} aria-describedby={`cd-slot-info-${slot}`}
          onPointerDown={event => event.stopPropagation()} onPointerUp={event => event.stopPropagation()}
          onPointerEnter={event => { if (event.pointerType !== 'touch') onHighlight(slot); }}
          onPointerLeave={event => { if (event.pointerType !== 'touch') onHighlight(null); }}
          onFocus={() => onHighlight(slot)} onBlur={() => onHighlight(null)}
          onClick={event => { event.stopPropagation(); onChoose(slot); }}>
          <span id={`cd-slot-info-${slot}`} className="cd-physical-slot-label"><b>CD {slot}</b>{current ? `${current.artist} · ${current.album}` : 'Empty slot'}</span>
        </button>
      </Html>;
    })}
  </group>;
}
