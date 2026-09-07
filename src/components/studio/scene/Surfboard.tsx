import { useGLTF } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { Box3, Euler, Mesh, Vector3 } from 'three';

const SURFBOARD_LENGTH = 2.8956;
const SURFBOARD_LEAN = new Euler(0.035, 0, -0.28);
const FINISHED_FLOOR_TOP = 0.0185;

export function Surfboard() {
  const { scene } = useGLTF('/models/surfboard.glb');
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
    const bounds = new Box3().setFromObject(model, true);
    const size = bounds.getSize(new Vector3());
    const center = bounds.getCenter(new Vector3());
    const scale = SURFBOARD_LENGTH / Math.max(size.y, 0.000_001);
    model.position.set(-center.x, -center.y, -center.z);
    model.updateMatrixWorld(true);
    const vertex = new Vector3();
    let lowestY = Infinity;
    model.traverse(child => {
      if (!(child instanceof Mesh)) return;
      const positions = child.geometry.getAttribute('position');
      for (let index = 0; index < positions.count; index++) {
        vertex.fromBufferAttribute(positions, index).applyMatrix4(child.matrixWorld)
          .multiplyScalar(scale).applyEuler(SURFBOARD_LEAN);
        lowestY = Math.min(lowestY, vertex.y);
      }
    });
    return {
      model,
      groundOffset: FINISHED_FLOOR_TOP - lowestY,
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
    <group name="Bing 9ft6 surfboard" position={[0, fitted.groundOffset, 0]} rotation={SURFBOARD_LEAN} scale={fitted.scale}>
      <primitive object={fitted.model} dispose={null} />
    </group>
  );
}

useGLTF.preload('/models/surfboard.glb');
