import { useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Group, Mesh, MeshStandardMaterial } from 'three';
import type { BufferGeometry } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Batch static miniature pieces by finish; animation and interaction remain on their parent group. */
export function StaticShapes({ children }: { readonly children: ReactNode }) {
  const source = useRef<Group>(null);
  const [batches, setBatches] = useState<readonly Mesh[]>([]);
  useLayoutEffect(() => {
    const root = source.current;
    if (!root) return;
    root.updateWorldMatrix(true, true);
    const inverse = root.matrixWorld.clone().invert();
    const finishes = new Map<string, { material: MeshStandardMaterial; geometries: BufferGeometry[]; cast: boolean; receive: boolean }>();
    root.traverse(object => {
      if (!(object instanceof Mesh) || !(object.material instanceof MeshStandardMaterial)) return;
      const m = object.material;
      const key = [m.color.getHexString(), m.roughness, m.metalness, m.opacity, m.transparent, m.side, m.depthWrite, object.castShadow, object.receiveShadow].join(':');
      let batch = finishes.get(key);
      if (!batch) {
        batch = { material: m.clone(), geometries: [], cast: object.castShadow, receive: object.receiveShadow };
        finishes.set(key, batch);
      }
      const geometry = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone();
      geometry.applyMatrix4(inverse.clone().multiply(object.matrixWorld));
      batch.geometries.push(geometry);
    });
    const originalRaycasts = new Map<Mesh, Mesh['raycast']>();
    root.traverse(object => {
      if (object instanceof Mesh) { originalRaycasts.set(object, object.raycast); object.raycast = () => {}; }
    });
    const meshes: Mesh[] = [];
    for (const batch of finishes.values()) {
      const geometry = mergeGeometries(batch.geometries);
      batch.geometries.forEach(part => part.dispose());
      if (!geometry) { batch.material.dispose(); continue; }
      const mesh = new Mesh(geometry, batch.material);
      mesh.castShadow = batch.cast; mesh.receiveShadow = batch.receive;
      mesh.name = 'Miniature finish batch';
      meshes.push(mesh);
    }
    root.visible = false;
    setBatches(meshes);
    return () => {
      root.visible = true;
      originalRaycasts.forEach((raycast, mesh) => { mesh.raycast = raycast; });
      meshes.forEach(mesh => { mesh.geometry.dispose(); (mesh.material as MeshStandardMaterial).dispose(); });
    };
  }, []);
  return <group>
    <group ref={source}>{children}</group>
    {batches.map(mesh => <primitive key={mesh.uuid} object={mesh} dispose={null} />)}
  </group>;
}
