import { useEffect, useMemo } from 'react';
import { CanvasTexture, SRGBColorSpace } from 'three';
import { useLocalDate } from '../OfficeTime';
import { Block } from './Primitives';
import { PALETTE, ROOM } from './config';
import { FlipCard } from './FlipCard';

export function CalendarClock({ reducedMotion }: { readonly reducedMotion: boolean }) {
  const date = useLocalDate();
  const calendarLabel = date ? `${date.weekday}   ${date.day} ${date.month}   ${date.year}` : '';
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 128;
    const result = new CanvasTexture(canvas);
    result.colorSpace = SRGBColorSpace;
    result.anisotropy = 4;
    return result;
  }, []);

  useEffect(() => {
    const canvas = texture.image;
    if (!(canvas instanceof HTMLCanvasElement)) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = PALETTE.paper; ctx.fillRect(0, 0, 1024, 128);
    ctx.fillStyle = PALETTE.ink; ctx.textAlign = 'center';
    ctx.font = '600 83px Arial, sans-serif';
    ctx.fillText(calendarLabel, 512, 94, 985);
    texture.needsUpdate = true;
  }, [calendarLabel, texture]);

  useEffect(() => () => texture.dispose(), [texture]);

  return <group position={[...ROOM.clock.position]} rotation={[0, ROOM.clock.rotation, 0]} scale={ROOM.clock.scale}>
    <Block size={[0.34, 0.035, 0.035]} position={[0, 0.13, -0.067]}
      color={PALETTE.steel} radius={0.006} metalness={0.64} roughness={0.4} />
    {[-0.14, 0.14].map(x => <Block key={x} size={[0.035, 0.16, 0.055]} position={[x, 0.13, -0.073]}
      color={PALETTE.steel} radius={0.006} metalness={0.64} roughness={0.4} />)}
    <Block size={[0.46, 0.26, 0.095]} position={[0, 0.135, 0]} color={PALETTE.paper}
      radius={0.019} metalness={0.08} roughness={0.65} />
    <Block size={[0.447, 0.238, 0.014]} position={[0, 0.135, -0.048]} color={PALETTE.ink}
      radius={0.016} roughness={0.78} />
    {date && <>
      <FlipCard value={date.hours} size={[0.128, 0.14]} position={[-0.145, 0.166, 0.049]} reducedMotion={reducedMotion} />
      <FlipCard value={date.minutes} size={[0.128, 0.14]} position={[0, 0.166, 0.049]} reducedMotion={reducedMotion} />
      <FlipCard value={date.seconds} size={[0.128, 0.14]} position={[0.145, 0.166, 0.049]} reducedMotion={reducedMotion} />
    </>}
    {[-0.0725, 0.0725].flatMap(x => [0.153, 0.18].map(y => <mesh key={`${x}-${y}`} position={[x, y, 0.048]}>
      <circleGeometry args={[0.002, 12]} /><meshStandardMaterial color={PALETTE.ink} roughness={0.9} />
    </mesh>))}
    <mesh position={[0, 0.05, 0.048]}>
      <planeGeometry args={[0.408, 0.051]} />
      <meshStandardMaterial map={texture} roughness={0.92} />
    </mesh>
  </group>;
}
