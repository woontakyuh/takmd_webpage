import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { MathUtils } from 'three';
import type { MeshStandardMaterial, RectAreaLight } from 'three';
import { LIGHTING } from './config';

function InteriorStrip({ y, open, power, reducedMotion }: {
  readonly y: number; readonly open: boolean; readonly power: number; readonly reducedMotion: boolean;
}) {
  const light = useRef<RectAreaLight>(null);
  const diffuser = useRef<MeshStandardMaterial>(null);
  useFrame((state, delta) => {
    if (!light.current || !diffuser.current) return;
    const target = open ? 0.8 + power * 1.4 : 0;
    const next = reducedMotion ? target : MathUtils.damp(light.current.intensity, target, 8, delta);
    if (Math.abs(next - light.current.intensity) > 0.0001) state.invalidate();
    light.current.intensity = Math.abs(next - target) < 0.001 ? target : next;
    diffuser.current.emissiveIntensity = light.current.intensity * 0.6;
  });
  return <group name="concealed warm cabinet shelf light" position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
    <mesh><planeGeometry args={[0.54, 0.009]} />
      <meshStandardMaterial ref={diffuser} color={LIGHTING.reflector} emissive={LIGHTING.warm} emissiveIntensity={0} />
    </mesh>
    <rectAreaLight ref={light} position={[0, 0, 0.002]} width={0.54} height={0.035} color={LIGHTING.warm} intensity={0} />
  </group>;
}

export function IsidoroInteriorLighting({ lowerShelf, ...props }: {
  readonly lowerShelf: number; readonly open: boolean; readonly power: number; readonly reducedMotion: boolean;
}) {
  return <group name="Isidoro interior lighting">
    <InteriorStrip y={1.14} {...props} />
    <InteriorStrip y={lowerShelf} {...props} />
  </group>;
}
