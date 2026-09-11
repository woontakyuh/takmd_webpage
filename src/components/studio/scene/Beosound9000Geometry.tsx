import { useFrame, useThree } from '@react-three/fiber';
import { useLayoutEffect, useRef } from 'react';
import type { Group, Texture } from 'three';
import { Block, Rod } from './Primitives';
import { BEOSOUND_9000 as B, CD_SLOTS, cdPosition, moveClamper } from './Beosound9000State';
import type { BeosoundState, CdSlot } from './Beosound9000State';
import { useBeosoundPanelTexture, useCompactDiscTexture } from './Beosound9000Textures';
import { useCabinetAction } from './WhiskyCabinetDoor';

const SILVER = '#BBC2C2';
const BLACK = '#141716';
const GLASS_OPEN_ANGLE = 1.18;
const ignoreRaycast = () => undefined;

function CompactDisc({ disc, texture, disabled, selected, onSelect }: {
  readonly disc: CdSlot; readonly texture: Texture; readonly disabled: boolean;
  readonly selected: boolean; readonly onSelect: (disc: CdSlot) => void;
}) {
  const { hovered, handlers } = useCabinetAction({ disabled, onActivate: () => onSelect(disc) });
  return <group name={`Beosound CD ${disc} selector`} position={[cdPosition(disc), B.discY, .042]} {...handlers}>
    <mesh position={[0, 0, -.003]}><circleGeometry args={[.063, 64]} />
      <meshStandardMaterial color="#171b1a" roughness={.48} metalness={.24} /></mesh>
    <mesh name={`120 mm compact disc ${disc}`} rotation={[0, 0, disc * .29]}>
      <ringGeometry args={[.016, B.discRadius, 96]} />
      <meshPhysicalMaterial map={texture} color="#e1e4df" metalness={.8} roughness={.25} clearcoat={.22} /></mesh>
    <mesh position={[0, 0, .0002]}><ringGeometry args={[.0075, .016, 48]} />
      <meshStandardMaterial color="#959f9c" metalness={.42} roughness={.31} /></mesh>
    <mesh position={[0, 0, .001]}><circleGeometry args={[.0075, 32]} />
      <meshStandardMaterial color="#181c19" roughness={.6} /></mesh>
    <mesh position={[0, -.087, .004]}><boxGeometry args={[.037, .011, .003]} />
      <meshStandardMaterial color={hovered ? '#e8eee6' : SILVER} metalness={.7} roughness={.35} /></mesh>
    <mesh position={[.023, -.087, .006]}><circleGeometry args={[.0018, 12]} />
      <meshBasicMaterial color={selected ? '#c8704c' : '#414641'} toneMapped={false} /></mesh>
    <mesh name={`CD ${disc} touch target`} position={[0, -.043, .012]}>
      <boxGeometry args={[.125, .142, .012]} /><meshBasicMaterial transparent opacity={0} colorWrite={false} depthWrite={false} />
    </mesh>
  </group>;
}

function Clamper({ texture }: { readonly texture: Texture }) {
  return <>
    <Block size={[.081, .105, .009]} position={[0, -.049, 0]} radius={.004} color={SILVER} metalness={.84} roughness={.3} />
    <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
      <cylinderGeometry args={[.054, .057, .012, 64]} /><meshStandardMaterial color="#222724" metalness={.45} roughness={.35} />
    </mesh>
    <mesh position={[0, 0, .009]}><circleGeometry args={[.049, 64]} />
      <meshPhysicalMaterial map={texture} color="#ccd1ce" metalness={.9} roughness={.24} clearcoat={.12} />
    </mesh>
    <mesh position={[0, 0, .010]}><circleGeometry args={[.004, 24]} />
      <meshStandardMaterial color="#b9bfbb" metalness={.85} roughness={.3} />
    </mesh>
    <Block size={[.012, .005, .001]} position={[-.025, -.077, .006]} radius={.001} color="#313632" roughness={.6} />
  </>;
}

export function Beosound9000Bracket() {
  return <group name="Beosound 9000 near-upright shelf bracket">
    {[-.272, .272].map(x => <group key={x}>
      <Block size={[.055, .008, .173]} position={[x, .004, -.03]} radius={.003} color="#232825" metalness={.4} roughness={.52} />
      <Block size={[.019, .105, .009]} position={[x, .058, -.087]} rotation={[-.2, 0, 0]} radius={.002} color={SILVER} metalness={.82} roughness={.35} />
      <Rod from={[x, .011, .023]} to={[x, .043, -.056]} radius={.004} color={SILVER} metalness={.8} />
    </group>)}
  </group>;
}

export function Beosound9000Geometry({ state, active, disabled, reducedMotion, onSelect }: {
  readonly state: BeosoundState; readonly active: boolean;
  readonly disabled: boolean; readonly reducedMotion: boolean; readonly onSelect: (disc: CdSlot) => void;
}) {
  const carriage = useRef<Group>(null), glass = useRef<Group>(null);
  const moving = useRef(false);
  const invalidate = useThree(current => current.invalidate);
  const discTexture = useCompactDiscTexture(), panelTexture = useBeosoundPanelTexture(state);
  const target = cdPosition(state.disc), glassTarget = state.doorOpen ? GLASS_OPEN_ANGLE : 0;
  useLayoutEffect(() => {
    moving.current = true;
    if (reducedMotion) {
      if (carriage.current) carriage.current.position.x = target;
      if (glass.current) glass.current.rotation.x = glassTarget;
      moving.current = false;
    }
    invalidate();
  }, [glassTarget, invalidate, reducedMotion, target]);
  useFrame((_, delta) => {
    if (!moving.current || !carriage.current || !glass.current) return;
    carriage.current.position.x = moveClamper(carriage.current.position.x, target, Math.min(delta, .1), reducedMotion);
    const gap = glassTarget - glass.current.rotation.x, step = Math.min(delta, .1) * 1.55;
    glass.current.rotation.x = Math.abs(gap) <= step ? glassTarget : glass.current.rotation.x + Math.sign(gap) * step;
    moving.current = carriage.current.position.x !== target || glass.current.rotation.x !== glassTarget;
    if (moving.current) invalidate();
  });
  return <group name="Beosound 9000 869 × 301 × 70 mm chassis">
    <Block size={[B.width, B.height, B.depth]} position={[0, B.height / 2, 0]} radius={.003} color="#373d39" roughness={.45} metalness={.6} />
    <Block size={[B.width, B.height, .005]} position={[0, B.height / 2, .034]} radius={.002} color={SILVER} metalness={.84} roughness={.32} />
    <Block size={[.842, .099, .012]} position={[0, .064, .042]} radius={.002} color={BLACK} metalness={.18} roughness={.21} />
    {!active && <mesh position={[0, .064, .0485]} raycast={ignoreRaycast}>
      <planeGeometry args={[.818, .093]} /><meshBasicMaterial map={panelTexture} toneMapped={false} />
    </mesh>}
    <Block size={[.817, .007, .009]} position={[0, .144, .045]} radius={.001} color="#323a35" metalness={.75} roughness={.3} />
    {CD_SLOTS.map(disc => <CompactDisc key={disc} disc={disc} selected={state.disc === disc && state.display !== 'standby'}
      texture={discTexture} disabled={disabled} onSelect={onSelect} />)}
    <group ref={carriage} name="Beosound 9000 moving CD clamper" position={[cdPosition(1), B.discY, .057]}>
      <Clamper texture={discTexture} />
    </group>
    <group ref={glass} name="Beosound 9000 motorized glass cover" position={[0, .119, .08]}>
      <mesh position={[0, .089, 0]} raycast={ignoreRaycast}>
        <boxGeometry args={[.858, .178, .0024]} />
        <meshPhysicalMaterial color="#dce6df" transparent opacity={.075} roughness={.14} metalness={.06}
          clearcoat={.65} clearcoatRoughness={.16} depthWrite={false} />
      </mesh>
      {[-.428, .428].map(x => <mesh key={x} position={[x, .089, 0]} raycast={ignoreRaycast}>
        <boxGeometry args={[.0015, .178, .0025]} /><meshStandardMaterial color="#b7ccc5" transparent opacity={.32} roughness={.2} depthWrite={false} />
      </mesh>)}
      <mesh position={[0, .178, 0]} raycast={ignoreRaycast}>
        <boxGeometry args={[.858, .0015, .0025]} /><meshStandardMaterial color="#b7ccc5" transparent opacity={.32} depthWrite={false} />
      </mesh>
    </group>
    {[-.407, .407].map(x => <mesh key={x} position={[x, .119, .066]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[.007, .007, .015, 16]} /><meshStandardMaterial color={SILVER} metalness={.8} roughness={.3} />
    </mesh>)}
  </group>;
}
