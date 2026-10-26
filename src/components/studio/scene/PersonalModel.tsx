import { useGLTF } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { Box3, Mesh, Vector3 } from 'three';

type PersonalModelProps = {
  readonly url: '/models/keyboard.glb' | '/models/computer.glb';
  readonly width: number;
};

export function PersonalModel({ url, width }: PersonalModelProps) {
  const { scene } = useGLTF(url);
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
    const scale = width / Math.max(size.x, 0.000_001);
    return {
      model,
      offset: [-center.x * scale, -bounds.min.y * scale, -center.z * scale] as const,
      scale,
    };
  }, [scene, width]);

  useEffect(() => () => {
    fitted.model.traverse((child) => {
      if (!(child instanceof Mesh)) return;
      child.geometry.dispose();
      if (Array.isArray(child.material)) child.material.forEach((material) => material.dispose());
      else child.material.dispose();
    });
  }, [fitted]);

  return (
    <group position={[...fitted.offset]} scale={fitted.scale}>
      <primitive object={fitted.model} dispose={null} />
    </group>
  );
}

useGLTF.preload('/models/keyboard.glb');
useGLTF.preload('/models/computer.glb');
