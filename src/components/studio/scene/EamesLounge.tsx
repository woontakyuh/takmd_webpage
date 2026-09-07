import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import { Mesh } from 'three';

const LOUNGE_URL = '/models/eames/lounge.glb';
const OTTOMAN_URL = '/models/eames/ottoman.glb';
const YAW = Math.PI - 0.32;

export function EamesLounge() {
  const lounge = useGLTF(LOUNGE_URL);
  const ottoman = useGLTF(OTTOMAN_URL);
  const models = useMemo(() => [lounge.scene, ottoman.scene].map(scene => {
    const model = scene.clone(true);
    model.traverse(object => {
      if (!(object instanceof Mesh)) return;
      object.castShadow = true;
      object.receiveShadow = true;
    });
    return model;
  }), [lounge.scene, ottoman.scene]);

  return <>
    <group name="Eames lounge chair" position={[-0.9, 0.0185, 2.12]} rotation={[0, YAW, 0]}>
      <primitive object={models[0]} dispose={null} />
    </group>
    <group name="Eames ottoman" position={[-0.58, 0.0185, 1.15]} rotation={[0, YAW, 0]}>
      <primitive object={models[1]} dispose={null} />
    </group>
  </>;
}
