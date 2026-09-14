import { Movable } from './Movable';
import type { RoomLightPalette } from '../lightingPresets';
import type { BlindLift } from '../types';
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color } from 'three';
import type { MeshStandardMaterial, RectAreaLight } from 'three';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { MantisFloor } from './MantisFloor';
import { SigneFloor } from './SigneFloor';
import { Block } from './Primitives';
import { LIGHTING, PALETTE, ROOM, WALL_TV } from './config';
import { useWallTvBacklight } from './hoverReactions';
import { tvBacklightMix, TV_WARM_WHITE } from './tvBacklightColor';
import type { TvEdgeLight } from './tvBacklightColor';

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

export function OfficeLighting({ power, palette, tvFocused, reducedMotion }: {
  readonly power: number; readonly palette: RoomLightPalette; readonly tvFocused: boolean; readonly reducedMotion: boolean;
}) {
  return <group name="warm-office-lighting">
    <Movable id="mantis"><MantisFloor power={power} color={palette.color} /></Movable>
    <Movable id="signe"><SigneFloor power={power} palette={palette} /></Movable>
    <UnderStorageWash power={power} color={palette.gradient[0]} />
    <ShelfWash palette={palette} power={power} />
    <TvBacklight power={power} focused={tvFocused} reducedMotion={reducedMotion} />
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

function TvBacklight({ power, focused, reducedMotion }: { readonly power: number; readonly focused: boolean; readonly reducedMotion: boolean }) {
  const inset = 0.04;
  const { hovered, edges } = useWallTvBacklight();
  const brightness = Math.max(power, 0.18) * (hovered || focused ? 1.55 : 1);
  const strips = [
    { edge: 'left', position: [WALL_TV.width / 2 - inset, 0, 0.025], width: 0.012, height: WALL_TV.height - inset * 2 },
    { edge: 'top', position: [0, WALL_TV.height / 2 - inset, 0.025], width: WALL_TV.width - inset * 2, height: 0.012 },
    { edge: 'right', position: [-WALL_TV.width / 2 + inset, 0, 0.025], width: 0.012, height: WALL_TV.height - inset * 2 },
    { edge: 'bottom', position: [0, -WALL_TV.height / 2 + inset, 0.025], width: WALL_TV.width - inset * 2, height: 0.012 },
  ] as const;
  return <group name="TV rear four-edge gradient lightstrip" position={[...ROOM.gallery.position]}>
    {strips.map(strip => <RearStrip key={strip.edge} {...strip} sample={edges[strip.edge]} power={brightness} reducedMotion={reducedMotion} />)}
  </group>;
}

function RearStrip({ position, width, height, sample, power, edge, reducedMotion }: {
  readonly position: readonly [number, number, number]; readonly width: number; readonly height: number;
  readonly sample: TvEdgeLight; readonly power: number; readonly edge: string; readonly reducedMotion: boolean;
}) {
  const light = useRef<RectAreaLight>(null);
  const material = useRef<MeshStandardMaterial>(null);
  const target = useMemo(() => new Color(sample.color), [sample.color]);
  useFrame((_, delta) => {
    if (!light.current || !material.current) return;
    const mix = tvBacklightMix(delta, reducedMotion);
    light.current.color.lerp(target, mix);
    light.current.intensity += (power * sample.intensity * 24 - light.current.intensity) * mix;
    material.current.emissive.copy(light.current.color);
    material.current.emissiveIntensity = light.current.intensity / 12;
  });
  return <group position={[...position]} rotation={[0, Math.PI, 0]}>
    <mesh><planeGeometry args={[width, height]} /><meshStandardMaterial ref={material} color={LIGHTING.reflector} emissive={TV_WARM_WHITE} emissiveIntensity={0} /></mesh>
    <rectAreaLight ref={light} name={`TV rear ${edge} wall wash`} position={[0, 0, 0.001]} color={TV_WARM_WHITE} intensity={0} width={width} height={height} />
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
