import { Movable } from './Movable';
import type { RoomLightPalette } from '../lightingPresets';
import type { BlindLift } from '../types';
import { useLayoutEffect, useRef } from 'react';
import type { RectAreaLight } from 'three';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { MantisFloor } from './MantisFloor';
import { SigneFloor } from './SigneFloor';
import { Block } from './Primitives';
import { LIGHTING, PALETTE, ROOM, WALL_TV } from './config';
import { useWallTvBacklight } from './hoverReactions';

RectAreaLightUniformsLib.init();

export function WindowDaylight({ daylight, blindLift }: { readonly daylight: number; readonly blindLift: BlindLift }) {
  const { leftX, window: opening } = ROOM.architecture;
  return <group name="diffuse-window-daylight">
    {blindLift.map((lift, side) => {
      const height = (opening.top - opening.bottom) * lift;
      return <rectAreaLight key={side} name={`Window daylight ${side}`}
        position={[leftX + 0.2, opening.bottom + height / 2, opening.centerZ + (side === 0 ? 1 : -1) * opening.width / 4]}
        rotation={[0, -Math.PI / 2, 0]} width={opening.width / 2 - 0.045} height={Math.max(height, 0.001)}
        color="#FFF5E6" intensity={height > 0 ? daylight * 3 : 0} />;
    })}
  </group>;
}

export function OfficeLighting({ power, palette, tvFocused }: { readonly power: number; readonly palette: RoomLightPalette; readonly tvFocused: boolean }) {
  return <group name="warm-office-lighting">
    <Movable id="mantis"><MantisFloor power={power} color={palette.color} /></Movable>
    <Movable id="signe"><SigneFloor power={power} palette={palette} /></Movable>
    <UnderStorageWash power={power} color={palette.gradient[0]} />
    <ShelfWash palette={palette} power={power} />
    <TvBacklight power={power} focused={tvFocused} />
  </group>;
}

function ShelfWash({ power, palette }: { readonly power: number; readonly palette: RoomLightPalette }) {
  return <group name="continuous-4.8m-shelf-lightstrip">
    {[{ x: -1.2, width: 2.4 }, { x: 1.2, width: 2.4 }].map(({ x, width }) => <group key={x}>
      <Block size={[width, 0.015, 0.018]} position={[x, 0.80, 3.283]}
        color={PALETTE.aluminium} radius={0.002} metalness={0.75} roughness={0.4} />
      <WallWash x={x} width={width} color={palette.color} power={power} />
    </group>)}
  </group>;
}

function WallWash({ x, width, color, power }: { readonly x: number; readonly width: number; readonly color: string; readonly power: number }) {
  const light = useRef<RectAreaLight>(null);
  useLayoutEffect(() => { light.current?.lookAt(x, 1.22, 3.32); }, [x]);
  return <>
    <mesh position={[x, 0.809, 3.288]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[width, 0.009]} />
      <meshStandardMaterial color={LIGHTING.reflector} emissive={color} emissiveIntensity={power * 2} />
    </mesh>
    <rectAreaLight ref={light} name={x < 0 ? 'Shelf left wash' : 'Shelf right wash'}
      position={[x, 0.83, 3.277]} color={color} intensity={power * 15} width={width} height={0.028} />
  </>;
}

function TvBacklight({ power, focused }: { readonly power: number; readonly focused: boolean }) {
  const inset = 0.04;
  const { hovered, colors } = useWallTvBacklight();
  const brightness = Math.max(power, 0.18) * (hovered || focused ? 1.55 : 1);
  return <group name="TV rear four-edge gradient lightstrip" position={[...ROOM.gallery.position]}>
    {([-1, 1] as const).map(side => <group key={side}>
      <RearStrip position={[0, side * (WALL_TV.height / 2 - inset), 0.025]}
        width={WALL_TV.width - inset * 2} height={0.012} color={colors[side < 0 ? 0 : 1]} power={brightness} />
      <RearStrip position={[side * (WALL_TV.width / 2 - inset), 0, 0.025]}
        width={0.012} height={WALL_TV.height - inset * 2} color={colors[side < 0 ? 0 : 1]} power={brightness} />
    </group>)}
  </group>;
}

function RearStrip({ position, width, height, color, power }: {
  readonly position: readonly [number, number, number]; readonly width: number; readonly height: number; readonly color: string; readonly power: number;
}) {
  return <group position={[...position]} rotation={[0, Math.PI, 0]}>
    <mesh><planeGeometry args={[width, height]} /><meshStandardMaterial color={LIGHTING.reflector} emissive={color} emissiveIntensity={power * 2} /></mesh>
    <rectAreaLight name="TV rear wall wash" position={[0, 0, 0.001]} color={color} intensity={power * 24} width={width} height={height} />
  </group>;
}

function UnderStorageWash({ power, color }: { readonly power: number; readonly color: string }) {
  const { width, height, depth } = ROOM.credenza;
  const length = width - 0.13;
  const sourceY = height - 0.35 - 0.0105;
  return <group name="USM concealed underside lightstrip" position={[...ROOM.credenza.position]}>
    <Block size={[0.022, 0.008, length]} position={[0, sourceY + 0.0045, 0]}
      color={PALETTE.aluminium} radius={0.002} metalness={0.7} roughness={0.5} />
    <mesh name="USM warm diffusing strip" position={[0, sourceY, 0]} rotation={[Math.PI / 2, 0, Math.PI / 2]}>
      <planeGeometry args={[length, 0.014]} />
      <meshStandardMaterial color={LIGHTING.reflector} emissive={color} emissiveIntensity={power * 2.8} roughness={0.7} />
    </mesh>
    <rectAreaLight name="USM downward floor wash" position={[0, sourceY - 0.001, 0]}
      rotation={[-Math.PI / 2, 0, Math.PI / 2]} width={length} height={0.014} intensity={power * 22} color={color} />
    <rectAreaLight name="USM floor reflected underside fill" position={[0, 0.015, 0]}
      rotation={[Math.PI / 2, 0, Math.PI / 2]} width={length} height={depth - 0.07} intensity={power * 0.34} color={color} />
  </group>;
}
