import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import { DoubleSide, MathUtils, Mesh, Vector2 } from 'three';
import { INTERIOR, PALETTE } from './config';
import { useInteriorMaterial } from './InteriorMaterials';
import { Block } from './Primitives';

type PalladiomShadeProps = {
  readonly centerZ: number;
  readonly width: number;
  readonly leftX: number;
  readonly top: number;
  readonly bottom: number;
  readonly blindLift: number;
  readonly bracketSides?: readonly (-1 | 1)[];
};

const CORE_RADIUS = 0.016;
const ROLL_RADIUS = 0.043;
const HEMBAR_RADIUS = 0.011;
const LINEN_NORMAL = new Vector2(0.035, 0.035);

export function PalladiomShade({ centerZ, width, leftX, top, bottom, blindLift, bracketSides = [-1, 1] }: PalladiomShadeProps) {
  const roll = useRef<Mesh>(null);
  const cloth = useRef<Mesh>(null);
  const hembar = useRef<Mesh>(null);
  const lift = useRef(blindLift);
  const gl = useThree(state => state.gl);
  const linen = useInteriorMaterial('linen', [1, 5]);
  const rollerX = leftX + 0.105;
  const rollerY = top;
  const drop = rollerY - bottom - HEMBAR_RADIUS;
  const target = MathUtils.clamp(blindLift, 0, 1);

  useFrame(() => {
    const previousLift = lift.current;
    lift.current = target;
    const fabricLength = drop * (1 - lift.current);
    const rollRadius = CORE_RADIUS + (ROLL_RADIUS - CORE_RADIUS) * Math.sqrt(lift.current);
    const scale = rollRadius / ROLL_RADIUS;
    roll.current?.scale.set(scale, 1, scale);
    if (roll.current) roll.current.rotation.y = lift.current * Math.PI * 1.4;
    cloth.current?.position.set(rollerX + rollRadius + 0.004, rollerY - fabricLength / 2, centerZ);
    cloth.current?.scale.set(1, Math.max(fabricLength, 0.001), 1);
    hembar.current?.position.set(rollerX + rollRadius + 0.006, rollerY - Math.max(fabricLength, HEMBAR_RADIUS), centerZ);
    if (Math.abs(previousLift - lift.current) > 0.0001) gl.shadowMap.needsUpdate = true;
  });

  return <group name="Palladiom roller shade">
    <mesh name="satin-nickel roller axis" position={[rollerX, rollerY, centerZ]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[CORE_RADIUS, CORE_RADIUS, width + 0.07, 24]} />
      <meshStandardMaterial color={PALETTE.aluminiumEdge} metalness={0.88} roughness={0.28} />
    </mesh>
    <mesh ref={roll} name="warm-greige woven fabric roll" position={[rollerX, rollerY, centerZ]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[ROLL_RADIUS, ROLL_RADIUS, width, 28]} />
      <meshStandardMaterial {...linen} color={INTERIOR.sand} roughness={0.9} normalScale={LINEN_NORMAL} />
    </mesh>
    {bracketSides.map(side => <group key={side} position={[rollerX + 0.004, rollerY, centerZ + side * (width / 2 + 0.037)]}>
      <Block size={[0.052, 0.105, 0.044]} position={[0.014, 0, 0]}
        color={PALETTE.aluminiumEdge} radius={0.022} roughness={0.3} metalness={0.88} />
      <mesh position={[0.045, 0, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.018, 0.018, 0.024, 20]} />
        <meshStandardMaterial color={PALETTE.aluminium} metalness={0.9} roughness={0.24} />
      </mesh>
    </group>)}
    <mesh ref={cloth} name="lowered woven shade fabric" rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
      <planeGeometry args={[width, 1]} />
      <meshStandardMaterial {...linen} color={INTERIOR.sand} roughness={0.94} normalScale={LINEN_NORMAL} side={DoubleSide} />
    </mesh>
    <mesh ref={hembar} name="curved Palladiom hembar" rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[HEMBAR_RADIUS, HEMBAR_RADIUS, width - 0.012, 20]} />
      <meshStandardMaterial {...linen} color={INTERIOR.sand} roughness={0.78} normalScale={LINEN_NORMAL} />
    </mesh>
  </group>;
}
