import { useGLTF } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { Box3, Euler, Mesh, Vector3 } from 'three';

const SURFBOARD_HEIGHT = 1.85;
const SURFBOARD_LEAN = new Euler(0.035, 0, -0.065);

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
    const bounds = new Box3().setFromObject(model);
    const size = bounds.getSize(new Vector3());
    const center = bounds.getCenter(new Vector3());
    const scale = SURFBOARD_HEIGHT / Math.max(size.y, 0.000_001);
    model.position.set(-center.x, -center.y, -center.z);
    const rotatedY = [bounds.min.x, bounds.max.x].flatMap((x) =>
      [bounds.min.y, bounds.max.y].flatMap((y) =>
        [bounds.min.z, bounds.max.z].map((z) => new Vector3(x - center.x, y - center.y, z - center.z)
          .multiplyScalar(scale).applyEuler(SURFBOARD_LEAN).y)));
    return {
      model,
      groundOffset: -Math.min(...rotatedY),
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
    <group position={[0, fitted.groundOffset, 0]} rotation={SURFBOARD_LEAN} scale={fitted.scale}>
      <primitive object={fitted.model} dispose={null} />
    </group>
  );
}

useGLTF.preload('/models/surfboard.glb');
