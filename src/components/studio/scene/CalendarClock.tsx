import { useEffect, useMemo } from 'react';
import { CanvasTexture, SRGBColorSpace } from 'three';
import { useLocalDate } from '../OfficeTime';
import { Block } from './Primitives';
import { CLOCK, ROOM } from './config';
import { FlipCard } from './FlipCard';

export function CalendarClock({ reducedMotion }: { readonly reducedMotion: boolean }) {
  const date = useLocalDate();
  const year = date?.year ?? '';
  const lettering = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200; canvas.height = 680;
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace; texture.anisotropy = 4;
    return texture;
  }, []);
  useEffect(() => {
    const canvas = lettering.image;
    if (!(canvas instanceof HTMLCanvasElement)) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = CLOCK.label; ctx.textAlign = 'center';
    ctx.font = '500 19px Arial';
    ctx.fillText('24 HOUR', 213, 60); ctx.fillText('SECONDS', 936, 141);
    ctx.font = '500 18px Arial';
    ctx.fillText('DAY', 211, 418); ctx.fillText('DATE', 599, 418); ctx.fillText('MONTH', 969, 418);
    ctx.font = '500 20px Arial'; ctx.fillText(`LOCAL TIME  ·  ${year}`, 600, 659);
    lettering.needsUpdate = true;
  }, [lettering, year]);
  useEffect(() => () => lettering.dispose(), [lettering]);

  return <group name="Calendar flip clock" position={[...ROOM.clock.position]} rotation={[0, ROOM.clock.rotation, 0]}>
    <Block size={[0.526, 0.281, 0.008]} position={[0, 0, -0.029]} color={CLOCK.back} radius={0.004} roughness={0.8} />
    {[-0.17, 0.17].flatMap(x => [-0.09, 0.09].map(y => <Block key={`${x}-${y}`} size={[0.015, 0.015, 0.006]}
      position={[x, y, -0.034]} color={CLOCK.back} radius={0.003} roughness={0.9} />))}
    <Block size={[0.6, 0.35, 0.066]} color={CLOCK.case} radius={0.024} roughness={0.43} metalness={0.04} />
    <Block size={[0.56, 0.308, 0.008]} position={[0, 0, 0.029]} color={CLOCK.rim} radius={0.004} roughness={0.38} />
    <Block size={[0.542, 0.29, 0.003]} position={[0, 0, 0.032]} color={CLOCK.face} radius={0.0014} roughness={0.84} />
    {date && <>
      <FlipCard value={date.hours} size={[0.146, 0.123]} position={[-0.167, 0.061, 0.035]} reducedMotion={reducedMotion} />
      <FlipCard value={date.minutes} size={[0.146, 0.123]} position={[0, 0.061, 0.035]} reducedMotion={reducedMotion} />
      <FlipCard value={date.seconds} size={[0.091, 0.081]} position={[0.181, 0.046, 0.035]} reducedMotion={reducedMotion} />
      <FlipCard value={date.weekday} size={[0.15, 0.076]} position={[-0.167, -0.079, 0.035]} reducedMotion={reducedMotion} />
      <FlipCard value={date.day} size={[0.116, 0.076]} position={[0, -0.079, 0.035]} reducedMotion={reducedMotion} />
      <FlipCard value={date.month} size={[0.15, 0.076]} position={[0.167, -0.079, 0.035]} reducedMotion={reducedMotion} />
    </>}
    {[0.045, 0.079].map(y => <mesh key={y} position={[-0.0835, y, 0.036]}>
      <circleGeometry args={[0.002, 12]} /><meshStandardMaterial color={CLOCK.numeral} emissive={CLOCK.numeral} emissiveIntensity={0.65} roughness={0.85} />
    </mesh>)}
    <mesh position={[0, 0, 0.041]}>
      <planeGeometry args={[0.542, 0.29]} />
      <meshBasicMaterial map={lettering} transparent depthWrite={false} />
    </mesh>
  </group>;
}
