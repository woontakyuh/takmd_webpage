import { useGLTF } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { FrontSide, Mesh, MeshPhysicalMaterial } from 'three';

const MODEL_URL = '/models/noguchi/table.glb';

type NoguchiTableProps = {
  readonly position?: [number, number, number];
  readonly rotation?: [number, number, number];
};

export function createNoguchiGlassMaterials() {
  const face = new MeshPhysicalMaterial({
    name: 'Clear glass faces', color: '#c0ccd0', roughness: 0.1, metalness: 0,
    transparent: true, opacity: 0.42, side: FrontSide, depthWrite: false,
    ior: 1.52, envMapIntensity: 1.8, specularIntensity: 1,
  });
  face.onBeforeCompile = shader => {
    shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
      float glassFacing = abs(dot(normal, normalize(vViewPosition)));
      diffuseColor.a = mix(opacity, 0.83, pow(1.0 - glassFacing, 3.0));
      #include <opaque_fragment>
    `);
  };
  face.customProgramCacheKey = () => 'noguchi-glass-facing-v1';
  const edge = new MeshPhysicalMaterial({
    name: 'Green glass cut edge', color: '#304039', roughness: 0.18, metalness: 0,
    transparent: true, opacity: 0.92, side: FrontSide, depthWrite: false,
    ior: 1.52, envMapIntensity: 0.7,
  });
  return { face, edge };
}

export function NoguchiTable({ position, rotation }: NoguchiTableProps) {
  const { scene } = useGLTF(MODEL_URL);
  const glass = useMemo(createNoguchiGlassMaterials, []);
  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse(object => {
      if (!(object instanceof Mesh)) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      const transparent = materials.some(material => material.transparent);
      const surface = materials[0]?.name;
      if (surface === glass.face.name) object.material = glass.face;
      if (surface === glass.edge.name) object.material = glass.edge;
      object.castShadow = !transparent;
      object.receiveShadow = !transparent;
    });
    return clone;
  }, [scene, glass]);
  useEffect(() => () => { glass.face.dispose(); glass.edge.dispose(); }, [glass]);

  return <group name="Noguchi coffee table" position={position} rotation={rotation}>
    <primitive object={model} dispose={null} />
  </group>;
}
