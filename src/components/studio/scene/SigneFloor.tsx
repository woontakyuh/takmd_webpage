import { useMemo } from 'react';
import { Color } from 'three';
import type { RoomLightPalette } from '../lightingPresets';
import { Block } from './Primitives';
import { ROOM } from './config';

export function SigneFloor({ power, palette }: { readonly power: number; readonly palette: RoomLightPalette }) {
  const colors = useMemo(() => Array.from({ length: 6 }, (_, i) => new Color(palette.gradient[0]).lerp(new Color(palette.gradient[1]), i / 5).getStyle()), [palette]);
  return <group name="Philips Hue Signe gradient floor black" position={[...ROOM.signe.position]} rotation={[0, -Math.PI / 4, 0]}>
    <mesh position={[0, 0.11, 0]} castShadow receiveShadow><cylinderGeometry args={[ROOM.signe.radius, ROOM.signe.radius, 0.22, 48]} /><meshStandardMaterial color="#282b27" metalness={0.6} roughness={0.38} /></mesh>
    <Block size={[0.019, 1.438, 0.022]} position={[0, 0.739, 0]} radius={0.009} color="#30332e" metalness={0.6} roughness={0.35} />
    {colors.map((color, i) => <SigneSegment key={i} y={0.26 + i * 0.218} power={power} color={color} />)}
  </group>;
}

function SigneSegment({ y, power, color }: { readonly y: number; readonly power: number; readonly color: string }) {
  return <>
    <mesh position={[0, y, 0.012]}><planeGeometry args={[0.013, 0.219]} /><meshStandardMaterial color="#ece9df" emissive={color} emissiveIntensity={power * 2} /></mesh>
    <rectAreaLight rotation={[0, Math.PI, 0]} name="Signe gradient wall wash" position={[0, y, 0.027]} width={0.04} height={0.22} intensity={power * 16} color={color} />
  </>;
}
