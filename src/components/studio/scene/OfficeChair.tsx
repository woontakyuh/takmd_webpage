import { useGLTF } from '@react-three/drei';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box3, Mesh, Vector3 } from 'three';
import type { Group } from 'three';

const MODEL_URL = '/models/soft-pad/chair.glb' as const;
const TARGET_HEIGHT = 1.08;

export function OfficeChair({ reducedMotion }: { readonly reducedMotion: boolean }) {
  const swivel = useRef<Group>(null);
  const elapsed = useRef(2);
  useFrame((_, delta) => {
    if (!swivel.current) return;
    elapsed.current = Math.min(2, elapsed.current + delta);
    const t = elapsed.current;
    swivel.current.rotation.y = reducedMotion || t >= 2 ? 0 : Math.sin(t * 8) * Math.exp(-t * 3) * 0.105;
  });
  const { scene } = useGLTF(MODEL_URL);
  const fitted = useMemo(() => {
    const model = scene.clone(true);
    model.traverse((child) => {
      if (!(child instanceof Mesh)) return;
      child.geometry = child.geometry.clone();
      child.material = Array.isArray(child.material)
        ? child.material.map((material) => material.clone())
        : child.material.clone();
      child.castShadow = true;
      child.receiveShadow = true;
    });
    const bounds = new Box3().setFromObject(model);
    const size = bounds.getSize(new Vector3());
    const center = bounds.getCenter(new Vector3());
    const scale = TARGET_HEIGHT / Math.max(size.y, 0.000_001);
    return {
      model,
      offset: [-center.x * scale, -bounds.min.y * scale, -center.z * scale] as const,
      scale,
    };
  }, [scene]);

  useEffect(() => () => {
    fitted.model.traverse((child) => {
      if (!(child instanceof Mesh)) return;
      child.geometry.dispose();
      if (Array.isArray(child.material)) child.material.forEach((material) => material.dispose());
      else child.material.dispose();
    });
  }, [fitted]);

  return (
    <group ref={swivel} name="Desk chair" onPointerOver={() => { if (!reducedMotion && elapsed.current >= 1.5) elapsed.current = 0; }}>
      <group name="Eames Soft Pad Executive chair" position={[...fitted.offset]} scale={fitted.scale}>
        <primitive object={fitted.model} dispose={null} />
      </group>
    </group>
  );
}

useGLTF.preload(MODEL_URL);
