import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import { Box3, Mesh, Vector3 } from 'three';

const DESK_URL = '/models/furniture/desk-executive-oak.glb' as const;
const TARGET_SIZE = new Vector3(2.2, 0.7775, 0.85);
const SOURCE_YAW = Math.PI / 2;

export function ExecutiveDesk() {
  const { scene } = useGLTF(DESK_URL);
  const fitted = useMemo(() => {
    const model = scene.clone(true);
    model.rotation.y = SOURCE_YAW;
    model.updateMatrixWorld(true);
    model.traverse((child) => {
      if (!(child instanceof Mesh)) return;
      child.castShadow = true;
      child.receiveShadow = true;
    });

    const bounds = new Box3().setFromObject(model);
    const size = bounds.getSize(new Vector3());
    const center = bounds.getCenter(new Vector3());
    const scale = new Vector3(
      TARGET_SIZE.x / Math.max(size.x, 0.000_001),
      TARGET_SIZE.y / Math.max(size.y, 0.000_001),
      TARGET_SIZE.z / Math.max(size.z, 0.000_001),
    );

    model.position.set(
      -center.x,
      -bounds.min.y,
      -center.z,
    );

    return { model, scale };
  }, [scene]);

  return (
    <group scale={fitted.scale}>
      <primitive object={fitted.model} dispose={null} />
    </group>
  );
}

useGLTF.preload(DESK_URL);
