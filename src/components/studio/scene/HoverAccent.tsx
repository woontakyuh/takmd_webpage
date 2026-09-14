import { useLayoutEffect, useRef } from 'react';
import type { ReactNode, RefObject } from 'react';
import { Color, Group, Object3D, Material, Mesh, MeshStandardMaterial } from 'three';

/** A local material accent: no extra lights, geometry, or idle animation. */
export function useMaterialAccent(group: RefObject<Object3D | null>, active: boolean) {
  useLayoutEffect(() => {
    if (!active || !group.current) return;
    const originals = new Map<Mesh, Material | Material[]>();
    const copies = new Map<Material, Material>();
    const tint = new Color('#fff0d7');
    const accent = (source: Material) => {
      if (!(source instanceof MeshStandardMaterial)) return source;
      const existing = copies.get(source);
      if (existing) return existing;
      const copy = source.clone();
      copy.onBeforeCompile = source.onBeforeCompile;
      copy.customProgramCacheKey = source.customProgramCacheKey.bind(source);
      copy.emissive.multiplyScalar(copy.emissiveIntensity).add(tint.clone().multiplyScalar(.12));
      copy.emissiveIntensity = 1;
      copies.set(source, copy);
      return copy;
    };
    group.current.traverseVisible(object => {
      if (!(object instanceof Mesh)) return;
      originals.set(object, object.material);
      object.material = Array.isArray(object.material) ? object.material.map(accent) : accent(object.material);
    });
    return () => {
      originals.forEach((material, mesh) => { mesh.material = material; });
      copies.forEach(material => material.dispose());
    };
  }, [active, group]);
}

export function HoverAccent({ active, children }: { readonly active: boolean; readonly children: ReactNode }) {
  const group = useRef<Group>(null);
  useMaterialAccent(group, active);
  return <group ref={group}>{children}</group>;
}
