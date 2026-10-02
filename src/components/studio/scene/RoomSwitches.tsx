import { useCursor } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useRef, useState, type RefObject } from 'react';
import type { RoomControl } from '../OfficeRoomControls';
import { Block, Rod } from './Primitives';
import { ROOM, type Point } from './config';
import { useArrangement } from '../arrangement';
import { scheduleSceneSingleAction } from './sceneGesture';
import { useRoomControlPanelAnchor } from './useRoomControlPanelAnchor';

const SWITCH_HEIGHT = 1.46;

export function RoomSwitches({ onControl, panel }: {
  readonly onControl: (control: RoomControl) => void;
  readonly panel?: RefObject<HTMLDivElement | null>;
}) {
  return <>
    <WallButton position={[2.57, SWITCH_HEIGHT, 3.305]} rotation={Math.PI} label="Room lights" control="room" panel={panel} onClick={() => onControl('room')} />
    <WallButton position={[ROOM.architecture.leftX + 0.055, SWITCH_HEIGHT, ROOM.architecture.window.centerZ + ROOM.architecture.window.width / 2 + 0.13]} rotation={Math.PI / 2} label="Roller blinds" control="shades" panel={panel} double onClick={() => onControl('shades')} />
  </>;
}

function WallButton({ position, rotation, label, control, panel, double = false, onClick }: {
  readonly position: Point; readonly rotation: number; readonly label: string; readonly double?: boolean; readonly onClick: () => void;
  readonly control: 'room' | 'shades'; readonly panel?: RefObject<HTMLDivElement | null>;
}) {
  const { editing } = useArrangement();
  const { gl } = useThree();
  const switchGroup = useRoomControlPanelAnchor(control, panel);
  const [hovered, setHovered] = useState(false);
  const start = useRef<{ x: number; y: number; id: number } | null>(null);
  useCursor(hovered && !editing);
  return <group ref={switchGroup} name={`${label} wall switch`} position={[...position]} rotation={[0, rotation, 0]}
    onPointerOver={event => { event.stopPropagation(); setHovered(true); }} onPointerOut={() => setHovered(false)}
    onPointerDown={event => {
      event.stopPropagation();
      start.current = !editing && event.button === 0 && !event.shiftKey
        ? { x: event.clientX, y: event.clientY, id: event.pointerId } : null;
    }}
    onPointerCancel={() => { start.current = null; }}
    onPointerUp={event => {
      event.stopPropagation();
      const down = start.current; start.current = null;
      if (editing || !down || event.pointerId !== down.id || Math.hypot(event.clientX - down.x, event.clientY - down.y) > 5) return;
      scheduleSceneSingleAction(gl.domElement, onClick);
    }} onClick={event => event.stopPropagation()} onDoubleClick={event => event.stopPropagation()}>
    <Block size={[double ? 0.147 : 0.086, 0.126, 0.012]} color="#827e73" radius={0.005} roughness={0.74} />
    {(double ? [-0.032, 0.032] : [0]).map(x => <group key={x} position={[x, 0, 0.008]}>
      <Block size={[0.056, 0.105, 0.004]} color="#65645c" radius={0.004} roughness={0.76} />
      {[-1, 1].map(side => <group key={side} position={[0, side * 0.027, 0.003]}>
        <Block size={[0.052, 0.049, 0.004]} color={hovered && !editing ? '#c7bfb0' : '#aaa294'} radius={0.002} roughness={0.76} />
        <Rod from={[-0.007, -side * 0.003, 0.003]} to={[0, side * 0.003, 0.003]} radius={0.0007} color="#45473f" />
        <Rod from={[0, side * 0.003, 0.003]} to={[0.007, -side * 0.003, 0.003]} radius={0.0007} color="#45473f" />
      </group>)}
    </group>)}
  </group>;
}
