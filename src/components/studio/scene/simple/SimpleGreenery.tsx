import { StaticShapes } from './StaticShapes';
import { useCursor } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BufferGeometry, DoubleSide, Float32BufferAttribute, MathUtils } from 'three';
import type { Group } from 'three';
import { useArrangement } from '../../arrangement';
import { ROOM } from '../config';
import { MAQUETTE as M } from '../OfficeStyle';
import { createPalmPlanterGeometries } from '../PalmGeometry';
import { Rod } from '../Primitives';

function leafGeometry(length: number, width: number) {
  const points: number[] = [], indices: number[] = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const half = Math.pow(Math.sin(Math.PI * t), 0.65) * width;
    const y = length * (t - 0.4 * t * t);
    const z = 0.76 * t * t;
    points.push(-half, y, z, 0, y, z + Math.sin(Math.PI * t) * 0.04, half, y, z);
    if (i < 12) for (let side = 0; side < 2; side++) {
      const a = i * 3 + side;
      indices.push(a, a + 3, a + 1, a + 1, a + 3, a + 4);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(points, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}

export function SimpleGreenery({ reducedMotion }: { readonly reducedMotion: boolean }) {
  const { editing } = useArrangement();
  const [hovered, setHovered] = useState(false);
  const canopy = useRef<Group>(null);
  const planter = useMemo(createPalmPlanterGeometries, []);
  const leaves = useMemo(() => Array.from({ length: 15 }, (_, i) => leafGeometry(0.7 + (i % 4) * 0.1, 0.075 + (i % 3) * 0.015)), []);
  useCursor(hovered && !editing);
  useEffect(() => () => { leaves.forEach(g => g.dispose()); Object.values(planter).forEach(g => g.dispose()); }, [leaves, planter]);
  useFrame(({ clock }, delta) => {
    if (!canopy.current) return;
    const target = hovered && !editing && !reducedMotion ? Math.sin(clock.elapsedTime * 1.25) * Math.PI / 120 : 0;
    canopy.current.rotation.z = MathUtils.damp(canopy.current.rotation.z, target, 8, delta);
    canopy.current.userData.animating = Math.abs(canopy.current.rotation.z) > 0.0001 || (hovered && !editing && !reducedMotion);
  });
  return <group name="reference-indoor-palm" position={[...ROOM.plant.position]}
    onPointerEnter={() => { if (!editing && !reducedMotion) setHovered(true); }} onPointerLeave={() => setHovered(false)}>
    <group name="palm foliage canopy" ref={canopy} position={[0, 0.646, 0]}><StaticShapes>
      {leaves.map((geometry, i) => <group key={i} rotation={[0, i * 2.39996, 0]}>
        <Rod from={[0, 0, 0]} to={[0.04, 0.3 + i % 4 * 0.12, 0]} radius={0.007} color={M.foliage} />
        <mesh geometry={geometry} position={[0.04, 0.3 + i % 4 * 0.12, 0]} rotation={[0.02 + i % 3 * 0.14, 0, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={i % 3 ? M.foliage : M.foliageLight} roughness={0.86} side={DoubleSide} />
        </mesh>
      </group>)}
    </StaticShapes></group>
    <mesh geometry={planter.pot} castShadow receiveShadow><meshStandardMaterial color={M.cream} roughness={0.9} /></mesh>
    <mesh geometry={planter.soil}><meshStandardMaterial color={M.soil} roughness={1} /></mesh>
    <mesh geometry={planter.stand} castShadow receiveShadow><meshStandardMaterial color={M.timber} roughness={0.8} /></mesh>
  </group>;
}
