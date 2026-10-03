import { useThree } from '@react-three/fiber';
import { useLayoutEffect } from 'react';
import { Mesh, MeshStandardMaterial } from 'three';
import type { Material, Object3D } from 'three';
import { useRoomReady } from './DeferredAssets';

const FURNITURE = /^(Eames lounge chair|Eames ottoman|Eames Soft Pad Executive chair|Florence Knoll Relaxed two-seater|Noguchi coffee table|bodil-kjaer-office-desk|usm-haller-lowboard)$/;

function furnitureRoot(object: Object3D): boolean {
  for (let node: Object3D | null = object; node; node = node.parent) if (FURNITURE.test(node.name)) return true;
  return false;
}

function soften(source: MeshStandardMaterial, surfaceName: string): MeshStandardMaterial {
  const finish = new MeshStandardMaterial().copy(source);
  finish.name = `${source.name} soft finish`;
  finish.map = null;
  finish.normalMap = null;
  finish.bumpMap = null;
  finish.roughnessMap = null;
  finish.metalnessMap = null;
  finish.aoMap = null;

  if (source.transparent) {
    finish.roughness = 0.22;
    finish.metalness = 0;
    finish.envMapIntensity = 0.5;
  } else if (/alumini?um|chrome|steel|metal/i.test(surfaceName) || source.metalness >= 0.2) {
    finish.roughness = 0.4;
    finish.metalness = 0.7;
    finish.envMapIntensity = 0.55;
  } else {
    finish.roughness = /leather/i.test(surfaceName) ? 0.64
      : /wood|oak|ash|veneer|timber|walnut/i.test(surfaceName) ? 0.72 : 0.88;
    finish.metalness = 0;
    finish.envMapIntensity = 0.22;
  }
  finish.needsUpdate = true;
  return finish;
}

export function SoftSurfaceFinish() {
  const scene = useThree(state => state.scene);
  const ready = useRoomReady();
  useLayoutEffect(() => {
    const finishes = new Map<Material, MeshStandardMaterial>();
    const originals = new Map<Mesh, Material | Material[]>();
    scene.traverse(object => {
      if (!(object instanceof Mesh) || object.userData.staticMerge === 'merged' || !furnitureRoot(object)) return;
      const surfaces = Array.isArray(object.material) ? object.material : [object.material];
      const adapted = surfaces.map(source => {
        if (!(source instanceof MeshStandardMaterial)) return source;
        const cached = finishes.get(source);
        if (cached) return cached;
        const finish = soften(source, `${source.name} ${object.name}`);
        finishes.set(source, finish);
        return finish;
      });
      originals.set(object, object.material);
      object.material = Array.isArray(object.material) ? adapted : adapted[0];
    });
    return () => {
      originals.forEach((material, mesh) => { mesh.material = material; });
      finishes.forEach(material => material.dispose());
    };
  }, [scene, ready]);
  return null;
}
