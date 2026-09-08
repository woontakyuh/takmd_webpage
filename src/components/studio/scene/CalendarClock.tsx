import { useEffect, useMemo } from 'react';
import { ExtrudeGeometry, Shape } from 'three';
import { useLocalDate } from '../OfficeTime';
import { CLOCK, ROOM, type Point } from './config';
import { FlipCard } from './FlipCard';

const CLOCK_FRONT_LAYERS = {
  face: 0.041,
  card: 0.047,
  indicator: 0.048,
} as const;

function ClockPlate({ size, radius, z = 0, color, roughness, metalness = 0 }: {
  readonly size: Point; readonly radius: number; readonly z?: number; readonly color: string;
  readonly roughness: number; readonly metalness?: number;
}) {
  const [width, height, depth] = size;
  const geometry = useMemo(() => {
    const bevel = Math.min(0.005, depth / 4);
    const x = width / 2 - bevel, y = height / 2 - bevel, r = radius - bevel;
    const shape = new Shape();
    shape.moveTo(-x + r, -y);
    shape.lineTo(x - r, -y); shape.absarc(x - r, -y + r, r, -Math.PI / 2, 0, false);
    shape.lineTo(x, y - r); shape.absarc(x - r, y - r, r, 0, Math.PI / 2, false);
    shape.lineTo(-x + r, y); shape.absarc(-x + r, y - r, r, Math.PI / 2, Math.PI, false);
    shape.lineTo(-x, -y + r); shape.absarc(-x + r, -y + r, r, Math.PI, Math.PI * 1.5, false);
    shape.closePath();
    const plate = new ExtrudeGeometry(shape, { depth: depth - 2 * bevel, steps: 1, curveSegments: 12,
      bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3 });
    plate.translate(0, 0, -depth / 2 + bevel);
    return plate;
  }, [width, height, depth, radius]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} position={[0, 0, z]} castShadow receiveShadow>
    <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
  </mesh>;
}

export function CalendarClock({ reducedMotion }: { readonly reducedMotion: boolean }) {
  const date = useLocalDate();

  return <group name="Calendar flip clock" position={[...ROOM.clock.position]} rotation={[0, ROOM.clock.rotation, 0]}>
    <ClockPlate size={[0.706, 0.386, 0.008]} z={-0.035} color={CLOCK.back} radius={0.038} roughness={0.8} />
    <ClockPlate size={[0.78, 0.46, 0.078]} color={CLOCK.case} radius={0.07} roughness={0.3} metalness={0.08} />
    <ClockPlate size={[0.724, 0.404, 0.006]} z={0.037} color={CLOCK.rim} radius={0.045} roughness={0.28} metalness={0.74} />
    <ClockPlate size={[0.704, 0.384, 0.003]} z={CLOCK_FRONT_LAYERS.face} color={CLOCK.face} radius={0.032} roughness={0.84} />
    {date && <>
      <FlipCard value={date.weekday} size={[0.165, 0.115]} position={[-0.23, 0.102, CLOCK_FRONT_LAYERS.card]} reducedMotion={reducedMotion} />
      <FlipCard value={date.day} size={[0.165, 0.115]} position={[0, 0.102, CLOCK_FRONT_LAYERS.card]} reducedMotion={reducedMotion} />
      <FlipCard value={date.month} size={[0.165, 0.115]} position={[0.23, 0.102, CLOCK_FRONT_LAYERS.card]} reducedMotion={reducedMotion} />
      <FlipCard value={date.hours} size={[0.225, 0.175]} position={[-0.13, -0.093, CLOCK_FRONT_LAYERS.card]} reducedMotion={reducedMotion} />
      <FlipCard value={date.minutes} size={[0.225, 0.175]} position={[0.13, -0.093, CLOCK_FRONT_LAYERS.card]} reducedMotion={reducedMotion} />
    </>}
    {[-0.018, 0.018].map(y => <mesh key={y} position={[0, y - 0.093, CLOCK_FRONT_LAYERS.indicator]}>
      <circleGeometry args={[0.0042, 16]} /><meshStandardMaterial color={CLOCK.numeral} emissive={CLOCK.numeral} emissiveIntensity={0.42} roughness={0.85} />
    </mesh>)}
  </group>;
}
