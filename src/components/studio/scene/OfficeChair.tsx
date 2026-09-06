import { useGLTF, useTexture } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { Box3, Mesh, MeshStandardMaterial, NoColorSpace, SRGBColorSpace, Vector3 } from 'three';
import type { Material } from 'three';

const MODEL_URL = '/models/office-chair/chair.glb' as const;
const TARGET_HEIGHT = 1.02;

export function OfficeChair() {
  const { scene } = useGLTF(MODEL_URL);
  const sourceTextures = useTexture({
    baseColor: '/models/office-chair/base-color.webp',
    metallic: '/models/office-chair/metallic.png',
    normal: '/models/office-chair/normal.png',
    roughness: '/models/office-chair/roughness.jpg',
  });
  const textures = useMemo(() => {
    const baseColor = sourceTextures.baseColor.clone();
    const metallic = sourceTextures.metallic.clone();
    const normal = sourceTextures.normal.clone();
    const roughness = sourceTextures.roughness.clone();
    baseColor.colorSpace = SRGBColorSpace;
    for (const texture of [baseColor, metallic, normal, roughness]) {
      texture.flipY = false;
      texture.anisotropy = 4;
      texture.needsUpdate = true;
    }
    metallic.colorSpace = NoColorSpace;
    normal.colorSpace = NoColorSpace;
    roughness.colorSpace = NoColorSpace;
    return { baseColor, metallic, normal, roughness };
  }, [
    sourceTextures.baseColor,
    sourceTextures.metallic,
    sourceTextures.normal,
    sourceTextures.roughness,
  ]);
  const fitted = useMemo(() => {
    const model = scene.clone(true);
    model.traverse((child) => {
      if (!(child instanceof Mesh)) return;
      child.geometry = child.geometry.clone();
      const hasMaterialArray = Array.isArray(child.material);
      const sourceMaterials: Material[] = hasMaterialArray ? child.material : [child.material];
      const materials = sourceMaterials.map((sourceMaterial) => {
        const material = sourceMaterial.clone();
        if (material instanceof MeshStandardMaterial) {
          material.map = textures.baseColor;
          material.metalnessMap = textures.metallic;
          material.normalMap = textures.normal;
          material.roughnessMap = textures.roughness;
          material.metalness = 0.82;
          material.roughness = 0.72;
          material.normalScale.set(0.58, 0.58);
        }
        return material;
      });
      child.material = hasMaterialArray ? materials : (materials[0] ?? child.material);
      child.castShadow = true;
      child.receiveShadow = true;
    });
    const bounds = new Box3().setFromObject(model);
    const size = bounds.getSize(new Vector3());
    const center = bounds.getCenter(new Vector3());
    const scale = TARGET_HEIGHT / Math.max(size.y, 0.000_001);
    return {
      model,
      offset: [-center.x * scale, -bounds.min.y * scale, -center.z * scale] as const,
      scale,
    };
  }, [scene, textures]);

  useEffect(() => () => {
    fitted.model.traverse((child) => {
      if (!(child instanceof Mesh)) return;
      child.geometry.dispose();
      if (Array.isArray(child.material)) child.material.forEach((material) => material.dispose());
      else child.material.dispose();
    });
    Object.values(textures).forEach((texture) => texture.dispose());
  }, [fitted, textures]);

  return (
    <group position={[...fitted.offset]} scale={fitted.scale}>
      <primitive object={fitted.model} dispose={null} />
    </group>
  );
}

useGLTF.preload(MODEL_URL);
