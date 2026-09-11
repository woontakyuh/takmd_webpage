import { RoundedBox, useGLTF } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { Box3, Euler, Mesh, Vector3 } from 'three';
import { PALETTE } from './config';

const SURFBOARD_LENGTH = 2.8956;
const SURFBOARD_LEAN = new Euler(-0.12, 0, -0.015);
const FINISHED_FLOOR_TOP = 0.0185;
const FIN_CLEARANCE = 0.065;

export function Surfboard() {
  const { scene } = useGLTF('/models/surfboard.glb?v=20260911-beacon-foil');
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
    const supports = [new Vector3(-0.11, Infinity, 0), new Vector3(0.11, Infinity, 0)];
    model.traverse(child => {
      if (!(child instanceof Mesh)) return;
      const positions = child.geometry.getAttribute('position');
      for (let index = 0; index < positions.count; index++) {
        vertex.fromBufferAttribute(positions, index).applyMatrix4(child.matrixWorld)
          .multiplyScalar(scale).applyEuler(SURFBOARD_LEAN);
        lowestY = Math.min(lowestY, vertex.y);
        const side = vertex.x < 0 ? 0 : 1;
        if (Math.abs(vertex.x) >= 0.085 && Math.abs(vertex.x) <= 0.14 && vertex.y < supports[side].y) {
          supports[side].copy(vertex);
        }
      }
    });
    const groundOffset = FINISHED_FLOOR_TOP + FIN_CLEARANCE - lowestY;
    supports.forEach(support => { support.y += groundOffset; });
    return {
      model,
      groundOffset,
      scale,
      supports,
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
    <group>
      <group name="Bing 9ft6 surfboard" position={[0, fitted.groundOffset, 0]} rotation={SURFBOARD_LEAN} scale={fitted.scale}>
        <primitive object={fitted.model} dispose={null} />
      </group>
      <group name="Padded longboard floor cradle">
        <RoundedBox args={[0.39, 0.022, 0.17]} radius={0.005} smoothness={2}
          position={[0, FINISHED_FLOOR_TOP + 0.011, (fitted.supports[0].z + fitted.supports[1].z) / 2]} castShadow receiveShadow>
          <meshStandardMaterial color={PALETTE.white} roughness={0.7} />
        </RoundedBox>
        {fitted.supports.map((support, index) => {
          const bottom = FINISHED_FLOOR_TOP + 0.022;
          const height = support.y - 0.012 - bottom;
          return (
            <group key={index}>
              <mesh position={[support.x, bottom + height / 2, support.z]} castShadow>
                <boxGeometry args={[0.018, height, 0.018]} />
                <meshStandardMaterial color={PALETTE.white} roughness={0.7} />
              </mesh>
              <RoundedBox args={[0.03, 0.012, 0.065]} radius={0.003} smoothness={2}
                position={[support.x, support.y - 0.006, support.z]} castShadow receiveShadow>
                <meshStandardMaterial color="#4b4a44" roughness={0.95} />
              </RoundedBox>
            </group>
          );
        })}
      </group>
    </group>
  );
}

useGLTF.preload('/models/surfboard.glb?v=20260911-beacon-foil');
