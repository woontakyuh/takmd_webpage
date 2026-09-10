import { useCursor } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useRef, useState } from 'react';
import type { RoomControl } from '../OfficeRoomControls';
import { Block, Rod } from './Primitives';
import { ROOM, type Point } from './config';
import { useArrangement } from '../arrangement';
import { scheduleSceneSingleAction } from './sceneGesture';

export function RoomSwitches({ onControl }: { readonly onControl: (control: RoomControl) => void }) {
  return <>
    <WallButton position={[2.57, 1.22, 3.305]} rotation={Math.PI} label="Room lights" onClick={() => onControl('room')} />
    <WallButton position={[ROOM.architecture.leftX + 0.055, 1.90, ROOM.architecture.window.centerZ - ROOM.architecture.window.width / 2 - 0.13]} rotation={Math.PI / 2} label="Roller blinds" double onClick={() => onControl('shades')} />
  </>;
}

function WallButton({ position, rotation, label, double = false, onClick }: {
  readonly position: Point; readonly rotation: number; readonly label: string; readonly double?: boolean; readonly onClick: () => void;
}) {
  const { editing } = useArrangement();
  const { gl } = useThree();
  const [hovered, setHovered] = useState(false);
  const start = useRef<{ x: number; y: number; id: number } | null>(null);
  useCursor(hovered && !editing);
  return <group name={`${label} wall switch`} position={[...position]} rotation={[0, rotation, 0]}
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
    <Block size={[double ? 0.147 : 0.086, 0.126, 0.012]} color="#e8e4da" radius={0.005} roughness={0.64} />
    {(double ? [-0.032, 0.032] : [0]).map(x => <group key={x} position={[x, 0, 0.008]}>
      <Block size={[0.056, 0.105, 0.004]} color="#d1cec5" radius={0.004} roughness={0.7} />
      {[-1, 1].map(side => <group key={side} position={[0, side * 0.027, 0.003]}>
        <Block size={[0.052, 0.049, 0.004]} color={hovered && !editing ? '#eeeae1' : '#e6e2d8'} radius={0.002} roughness={0.68} />
        <Rod from={[-0.007, -side * 0.003, 0.003]} to={[0, side * 0.003, 0.003]} radius={0.0007} color="#6a6b63" />
        <Rod from={[0, side * 0.003, 0.003]} to={[0.007, -side * 0.003, 0.003]} radius={0.0007} color="#6a6b63" />
      </group>)}
    </group>)}
  </group>;
}
