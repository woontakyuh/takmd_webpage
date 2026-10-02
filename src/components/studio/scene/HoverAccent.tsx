import { useLayoutEffect, useRef } from 'react';
import type { ReactNode, RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, Group, Object3D, Material, Mesh, MeshStandardMaterial, MathUtils } from 'three';
import { MOTION } from './config';

type Accent = { originals: Map<Mesh, Material | Material[]>; copies: Map<MeshStandardMaterial, MeshStandardMaterial> };
function restore(accent: Accent | null) {
  if (!accent) return;
  accent.originals.forEach((material, mesh) => { mesh.material = material; });
  accent.copies.forEach(material => material.dispose());
}

/** Match the existing material glow, retaining texture contrast and easing both directions. */
export function useMaterialAccent(group: RefObject<Object3D | null>, active: boolean) {
  const accent = useRef<Accent | null>(null), strength = useRef(0);
  const white = useRef(new Color('#ffffff')), base = useRef(new Color());
  useLayoutEffect(() => {
    if (!active || !group.current || accent.current) return;
    const originals = new Map<Mesh, Material | Material[]>();
    const copies = new Map<MeshStandardMaterial, MeshStandardMaterial>();
    const copyMaterial = (source: Material) => {
      if (!(source instanceof MeshStandardMaterial)) return source;
      const existing = copies.get(source);
      if (existing) return existing;
      const copy = source.clone();
      copy.onBeforeCompile = source.onBeforeCompile;
      copy.customProgramCacheKey = source.customProgramCacheKey.bind(source);
      if (!source.emissiveMap && source.emissive.getHex() === 0) copy.emissiveMap = source.map;
      copies.set(source, copy);
      return copy;
    };
    group.current.traverseVisible(object => {
      if (!(object instanceof Mesh)) return;
      originals.set(object, object.material);
      object.material = Array.isArray(object.material) ? object.material.map(copyMaterial) : copyMaterial(object.material);
    });
    accent.current = { originals, copies };
  }, [active, group]);
  useFrame((_, delta) => {
    const current = accent.current;
    if (!current) return;
    strength.current = MathUtils.damp(strength.current, active ? .045 : 0, MOTION.object, delta);
    current.copies.forEach((copy, source) => {
      copy.emissive.copy(source.color).lerp(white.current, .1).multiplyScalar(strength.current)
        .add(base.current.copy(source.emissive).multiplyScalar(source.emissiveIntensity));
      copy.emissiveIntensity = 1;
    });
    if (!active && strength.current < .0002) {
      restore(current); accent.current = null; strength.current = 0;
    }
  });
  useLayoutEffect(() => () => { restore(accent.current); accent.current = null; }, []);
}

export function HoverAccent({ active, children }: { readonly active: boolean; readonly children: ReactNode }) {
  const group = useRef<Group>(null);
  useMaterialAccent(group, active);
  return <group ref={group}>{children}</group>;
}
