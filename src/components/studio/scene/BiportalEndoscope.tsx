import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import { Mesh } from 'three';

export function BiportalEndoscope() {
  const { scene } = useGLTF('/models/workshop/biportal-endoscope.glb');
  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.name = 'Reference biportal scope and working sheath';
    clone.traverse((node) => {
      if (!(node instanceof Mesh)) return;
      node.castShadow = true;
      node.receiveShadow = true;
    });
    return clone;
  }, [scene]);

  return <primitive object={model} position={[0, 0.0126, 0]} rotation={[0.05, 0, 0]} dispose={null} />;
}
