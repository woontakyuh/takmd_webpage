import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Matrix4, Mesh, MeshStandardMaterial } from 'three';
import type { BufferGeometry, Object3D } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// The walls, shelf boards, rails, wall boxes and window frames are drawn as some seventy separate meshes although
// nobody clicks, hovers or moves them and they share a handful of materials. Each of those is a draw call. This
// sweeps the scene once a second, gathers static opaque siblings that share a material,
// and draws each group as one mesh; the originals stay in the tree, hidden, so React keeps owning them. If an
// original moves, changes material or leaves the scene, its group is taken apart again and redrawn from scratch.

type MergedGroup = {
  readonly originals: readonly Mesh[];
  readonly matrices: readonly Matrix4[];
  readonly key: string;
  readonly merged: Mesh;
  readonly anchor: Object3D;
};

const MIN_GROUP = 5;
const SWEEP_FRAMES = 60;

type R3fObject = Object3D & { readonly __r3f?: { readonly handlers?: Record<string, unknown> } };

function isInteractive(object: Object3D): boolean {
  for (let node: Object3D | null = object; node; node = node.parent) {
    const handlers = (node as R3fObject).__r3f?.handlers;
    if (handlers && Object.keys(handlers).length > 0) return true;
  }
  return false;
}

// Keep every visibility/transform ancestor: hoisting above one leaves cutaway walls visible from outside.
export function anchorOf(object: Object3D, scene: Object3D): Object3D {
  return object.parent ?? scene;
}

function materialKey(mesh: Mesh, material: MeshStandardMaterial, anchor: Object3D): string {
  const geometry = mesh.geometry;
  const attributes = Object.keys(geometry.attributes).sort().join(',') + (geometry.index ? ':indexed' : ':plain');
  return [anchor.uuid, attributes, material.color.getHexString(), material.map?.uuid ?? '-', material.normalMap?.uuid ?? '-',
    material.roughnessMap?.uuid ?? '-', material.metalnessMap?.uuid ?? '-', material.emissiveMap?.uuid ?? '-',
    material.emissive.getHexString(), material.emissiveIntensity, material.roughness, material.metalness, material.side,
    material.envMapIntensity, mesh.castShadow, mesh.receiveShadow, mesh.renderOrder, mesh.layers.mask].join('|');
}

function candidateMaterial(mesh: Mesh): MeshStandardMaterial | null {
  if ((mesh as Mesh & { isInstancedMesh?: boolean }).isInstancedMesh || (mesh as Mesh & { isSkinnedMesh?: boolean }).isSkinnedMesh) return null;
  if (mesh.morphTargetInfluences?.length) return null;
  const material = mesh.material;
  if (Array.isArray(material) || !(material instanceof MeshStandardMaterial)) return null;
  if (material.transparent || material.opacity < 1 || material.alphaMap || material.type !== 'MeshStandardMaterial') return null;
  return material;
}

function sameMatrix(a: Matrix4, b: Matrix4): boolean {
  for (let index = 0; index < 16; index += 1) if (Math.abs(a.elements[index] - b.elements[index]) > 1e-6) return false;
  return true;
}

export function StaticMerge({ enabled = true }: { readonly enabled?: boolean }) {
  const scene = useThree(state => state.scene);
  const groups = useRef<MergedGroup[]>([]);
  const frames = useRef(0);
  const inverse = useRef(new Matrix4());

  const released = useRef(0);
  const release = (group: MergedGroup) => {
    group.merged.removeFromParent();
    group.merged.geometry.dispose();
    for (const original of group.originals) original.visible = true;
    released.current += 1;
  };

  useEffect(() => () => { for (const group of groups.current) release(group); groups.current = []; }, []);

  useFrame(() => {
    frames.current += 1;
    if (frames.current % SWEEP_FRAMES !== 0) return;
    // Diagnostics for the release gate: how many sweeps ran, how many groups stand, how many were taken apart.
    scene.userData.staticMerge = { sweeps: frames.current / SWEEP_FRAMES, groups: groups.current.length, released: released.current, members: groups.current.map(group => group.originals.map(original => original.uuid)) };
    if (!enabled) { if (groups.current.length) { for (const group of groups.current) release(group); groups.current = []; } return; }

    // 1. Take apart any group whose originals changed.
    groups.current = groups.current.filter(group => {
      const intact = group.merged.parent === group.anchor && group.originals.every((original, index) => {
        if (original.parent !== group.anchor || !isConnected(original, scene)) return false;
        const material = candidateMaterial(original);
        if (!material || materialKey(original, material, group.anchor) !== group.key) return false;
        original.updateWorldMatrix(true, false);
        return sameMatrix(original.matrixWorld, group.matrices[index]);
      });
      if (!intact) release(group);
      return intact;
    });

    // 2. Gather the static opaque meshes that are not already merged.
    const merged = new Set<Mesh>();
    for (const group of groups.current) for (const original of group.originals) merged.add(original);
    const buckets = new Map<string, { readonly anchor: Object3D; readonly material: MeshStandardMaterial; readonly meshes: Mesh[] }>();
    scene.traverse(object => {
      if (!(object instanceof Mesh) || merged.has(object) || !object.visible) return;
      if (object.userData.staticMerge === 'merged' || isInteractive(object)) return;
      let visible = true;
      for (let node: Object3D | null = object; node; node = node.parent) if (!node.visible) { visible = false; break; }
      if (!visible) return;
      const material = candidateMaterial(object);
      if (!material) return;
      const anchor = anchorOf(object, scene);
      const key = materialKey(object, material, anchor);
      const bucket = buckets.get(key) ?? { anchor, material, meshes: [] };
      bucket.meshes.push(object);
      buckets.set(key, bucket);
    });

    // 3. Draw each large enough bucket as one mesh in the anchor's space.
    for (const [key, bucket] of buckets) {
      if (bucket.meshes.length < MIN_GROUP) continue;
      bucket.anchor.updateWorldMatrix(true, false);
      inverse.current.copy(bucket.anchor.matrixWorld).invert();
      const pieces: BufferGeometry[] = [];
      const matrices: Matrix4[] = [];
      for (const mesh of bucket.meshes) {
        mesh.updateWorldMatrix(true, false);
        const piece = mesh.geometry.clone();
        piece.applyMatrix4(new Matrix4().multiplyMatrices(inverse.current, mesh.matrixWorld));
        pieces.push(piece);
        matrices.push(mesh.matrixWorld.clone());
      }
      const geometry = mergeGeometries(pieces, false);
      for (const piece of pieces) piece.dispose();
      if (!geometry) continue;
      const sample = bucket.meshes[0];
      const combined = new Mesh(geometry, bucket.material);
      combined.name = `static merge × ${bucket.meshes.length}`;
      combined.castShadow = sample.castShadow;
      combined.receiveShadow = sample.receiveShadow;
      combined.renderOrder = sample.renderOrder;
      combined.layers.mask = sample.layers.mask;
      combined.userData.staticMerge = 'merged';
      combined.raycast = () => undefined;
      bucket.anchor.add(combined);
      for (const mesh of bucket.meshes) mesh.visible = false;
      groups.current.push({ originals: bucket.meshes, matrices, key, merged: combined, anchor: bucket.anchor });
    }
  });
  return null;
}

function isConnected(object: Object3D, scene: Object3D): boolean {
  for (let node: Object3D | null = object; node; node = node.parent) if (node === scene) return true;
  return false;
}
