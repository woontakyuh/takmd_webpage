import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import { Mesh } from 'three';
import type { Point } from './config';

const MODEL_URL = '/models/mx-master-4/mouse.glb?v=20260907-thumbwheel-2' as const;

export function MxMasterMouse({ position }: { readonly position: Point }) {
  const { scene } = useGLTF(MODEL_URL);
  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if (!(child instanceof Mesh)) return;
      child.castShadow = true;
      child.receiveShadow = true;
    });
    return clone;
  }, [scene]);

  return <group name="Logitech MX Master 4" position={[...position]} rotation={[0, 0.08, 0]}>
    <primitive object={model} dispose={null} />
  </group>;
}

useGLTF.preload(MODEL_URL);
