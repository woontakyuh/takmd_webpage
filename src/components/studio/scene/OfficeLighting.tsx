import { useLayoutEffect, useMemo, useRef } from 'react';
import { Object3D } from 'three';
import type { RectAreaLight } from 'three';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { AJ_LAMP, AjLamp } from './AjLamp';
import { Block } from './Primitives';
import { LIGHTING, PALETTE, ROOM } from './config';
import type { Point } from './config';

RectAreaLightUniformsLib.init();

export function OfficeLighting({ power }: { readonly power: number }) {
  return <group name="warm-office-lighting">
    <group name="reading-lamp-placement" position={[-0.13, 0.0185, 2.18]} rotation={[0, -Math.PI / 2, 0]}>
      <AjLamp variant="floor" powered={power} />
      <TaskLight name="Reading lamp pool" power={power} position={AJ_LAMP.floor.aperture}
        target={AJ_LAMP.floor.lightTarget} intensity={1.8} distance={3} angle={0.8} />
    </group>
    <group name="desk-lamp-placement" position={[-0.70, 0.0185 + ROOM.desk.height, -1.66]} rotation={[0, Math.PI / 2, 0]}>
      <AjLamp variant="table" powered={power} />
      <TaskLight name="Desk lamp pool" power={power} position={AJ_LAMP.table.aperture}
        target={AJ_LAMP.table.lightTarget} intensity={0.8} distance={1.8} angle={0.92} />
    </group>
    <ShelfWash power={power} />
  </group>;
}

function TaskLight({ name, power, position, target, intensity, distance, angle }: {
  readonly name: string; readonly power: number; readonly position: Point; readonly target: Point;
  readonly intensity: number; readonly distance: number; readonly angle: number;
}) {
  const aim = useMemo(() => new Object3D(), []);
  return <>
    <primitive object={aim} position={[...target]} />
    <spotLight name={name} position={[...position]} target={aim} color={LIGHTING.warm}
      intensity={intensity * power} distance={distance} decay={2} angle={angle} penumbra={0.8}
      castShadow shadow-mapSize={[512, 512]} shadow-camera-near={0.02}
      shadow-normalBias={0.003} shadow-bias={-0.0001} shadow-radius={3} />
  </>;
}

function ShelfWash({ power }: { readonly power: number }) {
  return <group name="concealed-amber-to-warm-white-shelf-strip">
    {[-1, 1].map(side => <group key={side}>
      <Block size={[1.09, 0.015, 0.018]} position={[side * 0.57, 0.80, 3.283]}
        color={PALETTE.aluminium} radius={0.002} metalness={0.75} roughness={0.4} />
      <WallWash x={side * 0.57} color={side < 0 ? LIGHTING.amber : LIGHTING.warmWhite} power={power} />
    </group>)}
  </group>;
}

function WallWash({ x, color, power }: { readonly x: number; readonly color: string; readonly power: number }) {
  const light = useRef<RectAreaLight>(null);
  useLayoutEffect(() => { light.current?.lookAt(x, 1.22, 3.32); }, [x]);
  return <>
    <mesh position={[x, 0.809, 3.288]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[1.075, 0.009]} />
      <meshStandardMaterial color={LIGHTING.reflector} emissive={color} emissiveIntensity={power * 2} />
    </mesh>
    <rectAreaLight ref={light} name={x < 0 ? 'Shelf amber wash' : 'Shelf warm-white wash'}
      position={[x, 0.83, 3.277]} color={color} intensity={power * 20} width={1.075} height={0.028} />
  </>;
}
