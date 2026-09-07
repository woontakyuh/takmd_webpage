import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import { Box3, Mesh, Vector3 } from 'three';

const MODEL_URL = '/models/florence-knoll/relaxed-two-seater-ivory.glb';
const WIDTH = 1.6002;

export function LoungeSofa() {
  const { scene } = useGLTF(MODEL_URL);
  const fitted = useMemo(() => {
    const model = scene.clone(true);
    const bounds = new Box3().setFromObject(model);
    const center = bounds.getCenter(new Vector3());
    const scale = WIDTH / bounds.getSize(new Vector3()).x;
    model.position.set(-center.x, -bounds.min.y, -center.z);
    model.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      object.castShadow = true;
      object.receiveShadow = true;
    });
    return { model, scale };
  }, [scene]);

  return <group name="Florence Knoll Relaxed two-seater" position={[2, 0.0185, 1.14]} rotation={[0, -Math.PI / 2, 0]}>
    <group scale={fitted.scale}><primitive object={fitted.model} dispose={null} /></group>
  </group>;
}
