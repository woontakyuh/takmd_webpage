import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import { Mesh } from 'three';

const MODEL_URL = '/models/noguchi/table.glb';

type NoguchiTableProps = {
  readonly position?: [number, number, number];
  readonly rotation?: [number, number, number];
};

export function NoguchiTable({ position, rotation }: NoguchiTableProps) {
  const { scene } = useGLTF(MODEL_URL);
  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse(object => {
      if (!(object instanceof Mesh)) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      const transparent = materials.some(material => material.transparent);
      object.castShadow = !transparent;
      object.receiveShadow = !transparent;
    });
    return clone;
  }, [scene]);

  return <group name="Noguchi coffee table" position={position} rotation={rotation}>
    <primitive object={model} dispose={null} />
  </group>;
}
