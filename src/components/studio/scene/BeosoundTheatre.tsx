import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import { Mesh } from 'three';

const MODEL_URL = '/models/beosound-theatre/beosound-theatre-table.glb' as const;

export function BeosoundTheatre() {
  const { scene } = useGLTF(MODEL_URL);
  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.name = 'Bang and Olufsen Beosound Theatre silver aluminium natural oak table placement';
    clone.traverse((child) => {
      if (!(child instanceof Mesh)) return;
      child.castShadow = true;
      child.receiveShadow = true;
    });
    return clone;
  }, [scene]);

  return <primitive object={model} dispose={null} />;
}

useGLTF.preload(MODEL_URL);
