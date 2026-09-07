import { useGLTF } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { Box3, Mesh, MeshStandardMaterial, Vector3 } from 'three';
import { INTERIOR, PALETTE, ROOM } from './config';
import { createPalmPlanterGeometries } from './PalmGeometry';

const MODEL_URL = '/models/plant-dypsis/scene.gltf';
const SOIL_HEIGHT = 0.646;
const FOLIAGE_HEIGHT = 2.05 - SOIL_HEIGHT;

export function Greenery() {
  const { scene } = useGLTF(MODEL_URL);
  const planter = useMemo(createPalmPlanterGeometries, []);
  const foliage = useMemo(() => {
    const model = scene.clone(true);
    model.getObjectByName('DARK_PLASTIC_POT')?.removeFromParent();
    const bounds = new Box3().setFromObject(model);
    const center = bounds.getCenter(new Vector3());
    const scale = FOLIAGE_HEIGHT / bounds.getSize(new Vector3()).y;
    const materials: MeshStandardMaterial[] = [];
    model.traverse(object => {
      if (!(object instanceof Mesh)) return;
      object.castShadow = true;
      object.receiveShadow = true;
      const originals = Array.isArray(object.material) ? object.material : [object.material];
      const clones = originals.map(material => {
        const clone = material.clone();
        if (clone instanceof MeshStandardMaterial) {
          clone.alphaTest = 0.32;
          clone.transparent = false;
          clone.depthWrite = true;
          materials.push(clone);
        }
        return clone;
      });
      const first = clones[0];
      if (Array.isArray(object.material)) object.material = clones;
      else if (first) object.material = first;
    });
    model.scale.setScalar(scale);
    model.position.set(-center.x * scale, SOIL_HEIGHT - bounds.min.y * scale, -center.z * scale);
    model.name = 'AllQuad textured Dypsis lutescens foliage';
    return { model, materials };
  }, [scene]);
  useEffect(() => () => Object.values(planter).forEach(part => part.dispose()), [planter]);
  useEffect(() => () => foliage.materials.forEach(material => material.dispose()), [foliage]);

  return (
    <group name="reference-indoor-palm" position={[...ROOM.plant.position]}>
      <primitive object={foliage.model} dispose={null} />
      <mesh name="matte-white-cylindrical-planter" geometry={planter.pot} castShadow receiveShadow>
        <meshStandardMaterial color={PALETTE.paperLight} roughness={0.88} />
      </mesh>
      <mesh name="planter-soil" geometry={planter.soil} receiveShadow>
        <meshStandardMaterial color="#29241B" roughness={1} />
      </mesh>
      <mesh name="light-wood-four-leg-stand" geometry={planter.stand} castShadow receiveShadow>
        <meshStandardMaterial color={INTERIOR.lightWood} roughness={0.72} />
      </mesh>
    </group>
  );
}

useGLTF.preload(MODEL_URL);
