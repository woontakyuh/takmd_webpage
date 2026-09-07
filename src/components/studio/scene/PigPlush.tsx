import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import { Box3, Mesh, Vector3 } from 'three';

const PLUSH_LENGTH = 0.36;

export function PigPlush() {
  const { scene } = useGLTF('/models/workshop/plush-pig.glb');
  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.name = 'Reference pale-pink plush pig';
    clone.rotation.y = Math.PI / 2;
    clone.traverse((node) => {
      if (!(node instanceof Mesh)) return;
      node.castShadow = true;
      node.receiveShadow = true;
    });
    const bounds = new Box3().setFromObject(clone);
    const size = bounds.getSize(new Vector3());
    const center = bounds.getCenter(new Vector3());
    const scale = PLUSH_LENGTH / Math.max(size.x, size.z);
    clone.scale.setScalar(scale);
    clone.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
    return clone;
  }, [scene]);

  return <primitive object={model} dispose={null} />;
}
