import { Html } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef } from 'react';
import { ExtrudeGeometry, Shape, Vector3 } from 'three';
import type { Group } from 'three';
import { useArrangement } from '../arrangement';
import { useLocalDate } from '../OfficeTime';
import { CLOCK, ROOM, type Point } from './config';
import { FlipCard } from './FlipCard';
import { useSceneInspection } from './SceneInspection';
import { useCabinetAction } from './WhiskyCabinetDoor';

const LazyConferenceCalendar = lazy(() => import('./ConferenceCalendarPaper'));

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
  const clock = useRef<Group>(null);
  const size = useThree(state => state.size);
  const { editing } = useArrangement();
  const { inspection, setInspection } = useSceneInspection();
  const active = inspection?.id === 'conference-calendar';
  const pose = useCallback(() => {
    if (!clock.current) return null;
    const compact = size.width < 760;
    const target = clock.current.localToWorld(new Vector3(compact ? -.12 : .68, compact ? -.68 : 0, 0));
    const position = target.clone().add(clock.current.localToWorld(new Vector3(0, 0, 1.45))
      .sub(clock.current.localToWorld(new Vector3(0, 0, 0))).normalize().multiplyScalar(compact ? 1.45 : 1.25));
    return { position: position.toArray(), target: target.toArray() };
  }, [size.width]);
  const open = useCallback(() => {
    const next = pose();
    if (next) setInspection({ id: 'conference-calendar', ...next });
  }, [pose, setInspection]);
  const close = useCallback(() => setInspection(null), [setInspection]);
  const { handlers } = useCabinetAction({ disabled: editing || active, onActivate: open });

  useEffect(() => {
    if (!active) return;
    const next = pose();
    if (next) setInspection({ id: 'conference-calendar', ...next });
  }, [active, pose, setInspection, size.height]);

  return <group ref={clock} name="Calendar flip clock" position={[...ROOM.clock.position]}
    rotation={[0, ROOM.clock.rotation, 0]} scale={ROOM.clock.scale} userData={{ active }} {...handlers}>
    <mesh name="Calendar clock interaction surface" position={[0, 0, 0.105]}>
      <boxGeometry args={[0.78, 0.46, 0.02]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
    </mesh>
    <ClockPlate size={[0.752, 0.432, 0.102]} z={-0.044} color={CLOCK.case} radius={0.055} roughness={0.48} />
    <ClockPlate size={[0.706, 0.386, 0.004]} z={-0.097} color={CLOCK.back} radius={0.038} roughness={0.8} />
    <ClockPlate size={[0.78, 0.46, 0.078]} color={CLOCK.case} radius={0.055} roughness={0.42} />
    {[-0.26, 0.26].map(x => <mesh key={x} position={[x, -0.234, -0.03]} castShadow receiveShadow>
      <boxGeometry args={[0.1, 0.008, 0.085]} /><meshStandardMaterial color={CLOCK.back} roughness={0.92} />
    </mesh>)}
    <ClockPlate size={[0.724, 0.404, 0.006]} z={0.037} color={CLOCK.rim} radius={0.045} roughness={0.28} metalness={0.74} />
    <ClockPlate size={[0.704, 0.384, 0.003]} z={CLOCK_FRONT_LAYERS.face} color={CLOCK.face} radius={0.032} roughness={0.84} />
    {date && <>
      <FlipCard value={date.year} size={[0.16, 0.115]} position={[-0.255, 0.102, CLOCK_FRONT_LAYERS.card]} reducedMotion={reducedMotion} />
      <FlipCard value={date.month} size={[0.14, 0.115]} position={[-0.073, 0.102, CLOCK_FRONT_LAYERS.card]} reducedMotion={reducedMotion} />
      <FlipCard value={date.day} size={[0.12, 0.115]} position={[0.09, 0.102, CLOCK_FRONT_LAYERS.card]} reducedMotion={reducedMotion} />
      <FlipCard value={date.weekday} size={[0.13, 0.115]} position={[0.25, 0.102, CLOCK_FRONT_LAYERS.card]} reducedMotion={reducedMotion} />
      <FlipCard value={date.hours} size={[0.195, 0.175]} position={[-0.23, -0.093, CLOCK_FRONT_LAYERS.card]} reducedMotion={reducedMotion} />
      <FlipCard value={date.minutes} size={[0.195, 0.175]} position={[0, -0.093, CLOCK_FRONT_LAYERS.card]} reducedMotion={reducedMotion} />
      <FlipCard value={date.seconds} size={[0.195, 0.175]} position={[0.23, -0.093, CLOCK_FRONT_LAYERS.card]} reducedMotion={reducedMotion} />
    </>}
    {[-0.115, 0.115].flatMap(x => [-0.018, 0.018].map(y => <mesh key={`${x}:${y}`} position={[x, y - 0.093, CLOCK_FRONT_LAYERS.indicator]}>
      <circleGeometry args={[0.0042, 16]} /><meshStandardMaterial color={CLOCK.numeral} emissive={CLOCK.numeral} emissiveIntensity={0.42} roughness={0.85} />
    </mesh>))}
    {active && <Html fullscreen zIndexRange={[44, 40]} style={{ pointerEvents: 'none' }}
      calculatePosition={(_object, _camera, viewport) => [viewport.width / 2, viewport.height / 2]}>
      <Suspense fallback={null}><LazyConferenceCalendar onClose={close} /></Suspense>
    </Html>}
  </group>;
}
