import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Matrix4, Mesh, MeshStandardMaterial } from 'three';
import type { BufferGeometry, Material, Object3D } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// On a phone the browser spends most of each frame submitting draw calls: the room is some 380 of them, and under a
// slow CPU the submission alone took about 14 ms a frame. StaticMerge only joins siblings that nobody can click, which
// leaves almost all of them. Phones have no hover, so here every opaque mesh that shares a material with others in
// the same part of the room (the room shell or the desk) is drawn as one mesh. The originals stay in the tree, hidden,
// so React keeps owning them and taps still reach them: three's raycaster does not skip hidden meshes.
//
// Before every frame the originals and each parent between them and the merge root are checked against the state
// they were merged in. If anything moved, was shown or hidden, or swapped its material, the group is taken apart at
// once and that object is never merged again, so an animated part (a flip-clock card, an opening book) is never drawn
// from a stale copy.

const MIN_GROUP = 2;
const SWEEP_FRAMES = 60;

type Snapshot = { readonly parent: Object3D | null; readonly values: readonly number[]; readonly hidden: boolean };
type MergedGroup = {
  readonly originals: readonly Mesh[];
  readonly materials: readonly (Material | Material[])[];
  readonly chain: ReadonlyMap<Object3D, Snapshot>;
  readonly merged: Mesh;
  readonly anchor: Object3D;
};
type R3fObject = Object3D & { readonly __r3f?: { readonly props?: Record<string, unknown> } };

const transform = (node: Object3D) => [node.position.x, node.position.y, node.position.z,
  node.quaternion.x, node.quaternion.y, node.quaternion.z, node.quaternion.w, node.scale.x, node.scale.y, node.scale.z];
// Runs for every merged node before every frame, so it compares in place rather than building arrays.
function moved(node: Object3D, values: readonly number[]): boolean {
  const { position: p, quaternion: q, scale: s } = node;
  return Math.abs(p.x - values[0]) > 1e-7 || Math.abs(p.y - values[1]) > 1e-7 || Math.abs(p.z - values[2]) > 1e-7
    || Math.abs(q.x - values[3]) > 1e-7 || Math.abs(q.y - values[4]) > 1e-7 || Math.abs(q.z - values[5]) > 1e-7 || Math.abs(q.w - values[6]) > 1e-7
    || Math.abs(s.x - values[7]) > 1e-7 || Math.abs(s.y - values[8]) > 1e-7 || Math.abs(s.z - values[9]) > 1e-7;
}

function candidateMaterial(mesh: Mesh): MeshStandardMaterial | null {
  if ((mesh as Mesh & { isInstancedMesh?: boolean }).isInstancedMesh || (mesh as Mesh & { isSkinnedMesh?: boolean }).isSkinnedMesh) return null;
  if (mesh.morphTargetInfluences?.length || mesh.userData.staticMerge) return null;
  const material = mesh.material;
  if (Array.isArray(material) || !(material instanceof MeshStandardMaterial) || material.type !== 'MeshStandardMaterial') return null;
  if (material.transparent || material.opacity < 1 || material.alphaMap || material.alphaTest > 0) return null;
  return material;
}

function materialKey(mesh: Mesh, material: MeshStandardMaterial, anchor: Object3D): string {
  const geometry = mesh.geometry;
  return [anchor.uuid, Object.keys(geometry.attributes).sort().join(','), geometry.index ? 'indexed' : 'plain',
    material.color.getHexString(), material.map?.uuid ?? '-', material.normalMap?.uuid ?? '-', material.roughnessMap?.uuid ?? '-',
    material.metalnessMap?.uuid ?? '-', material.emissiveMap?.uuid ?? '-', material.aoMap?.uuid ?? '-', material.envMap?.uuid ?? '-',
    material.emissive.getHexString(), material.emissiveIntensity, material.roughness, material.metalness, material.side,
    material.envMapIntensity, material.flatShading, material.vertexColors, material.depthWrite, material.polygonOffset,
    material.polygonOffsetFactor, material.polygonOffsetUnits, mesh.castShadow, mesh.receiveShadow, mesh.renderOrder, mesh.layers.mask].join('|');
}

export function PhoneMerge() {
  const scene = useThree(state => state.scene);
  const groups = useRef<MergedGroup[]>([]);
  const unstable = useRef(new WeakSet<Object3D>());
  const frames = useRef(0);
  const inverse = useRef(new Matrix4());

  const release = (group: MergedGroup) => {
    group.merged.removeFromParent();
    group.merged.geometry.dispose();
    for (const original of group.originals) original.visible = true;
  };
  useEffect(() => () => { for (const group of groups.current) release(group); groups.current = []; }, []);

  useFrame(() => {
    frames.current += 1;
    if (groups.current.length) groups.current = groups.current.filter(group => {
      let changed: Object3D | null = null;
      group.originals.forEach((original, index) => {
        if (!changed && (original.visible || original.material !== group.materials[index])) changed = original;
      });
      if (!changed) for (const [node, snapshot] of group.chain) {
        if (node.parent !== snapshot.parent || (!snapshot.hidden && !node.visible) || moved(node, snapshot.values)) { changed = node; break; }
      }
      if (!changed) return true;
      unstable.current.add(changed);
      release(group);
      return false;
    });
    if (frames.current % SWEEP_FRAMES !== 0) return;

    groups.current = groups.current.filter(group => {
      if (group.merged.parent === group.anchor && group.anchor.parent === scene) return true;
      release(group);
      return false;
    });

    const buckets = new Map<string, { readonly anchor: Object3D; readonly material: MeshStandardMaterial; readonly meshes: Mesh[] }>();
    scene.traverseVisible(object => {
      if (!(object instanceof Mesh) || !object.visible) return;
      const material = candidateMaterial(object);
      if (!material) return;
      let anchor: Object3D = object;
      for (let node: Object3D | null = object; node && node !== scene; node = node.parent) {
        if (unstable.current.has(node) || (node === object && 'visible' in ((node as R3fObject).__r3f?.props ?? {}))) return;
        anchor = node;
      }
      if (anchor === object || anchor.parent !== scene) return;
      const key = materialKey(object, material, anchor);
      const bucket = buckets.get(key) ?? { anchor, material, meshes: [] };
      bucket.meshes.push(object);
      buckets.set(key, bucket);
    });

    for (const bucket of buckets.values()) {
      if (bucket.meshes.length < MIN_GROUP) continue;
      bucket.anchor.updateWorldMatrix(true, true);
      inverse.current.copy(bucket.anchor.matrixWorld).invert();
      const pieces: BufferGeometry[] = [];
      const chain = new Map<Object3D, Snapshot>();
      const members = new Set<Object3D>(bucket.meshes);
      for (const mesh of bucket.meshes) {
        const piece = mesh.geometry.clone();
        piece.applyMatrix4(new Matrix4().multiplyMatrices(inverse.current, mesh.matrixWorld));
        pieces.push(piece);
        for (let node: Object3D | null = mesh; node && node !== bucket.anchor; node = node.parent)
          if (!chain.has(node)) chain.set(node, { parent: node.parent, values: transform(node), hidden: members.has(node) });
      }
      const geometry = mergeGeometries(pieces, false);
      for (const piece of pieces) piece.dispose();
      if (!geometry) continue;
      const sample = bucket.meshes[0];
      const combined = new Mesh(geometry, bucket.material);
      combined.name = `phone merge × ${bucket.meshes.length}`;
      combined.castShadow = sample.castShadow;
      combined.receiveShadow = sample.receiveShadow;
      combined.renderOrder = sample.renderOrder;
      combined.layers.mask = sample.layers.mask;
      combined.userData.staticMerge = 'merged';
      combined.raycast = () => undefined;
      bucket.anchor.add(combined);
      for (const mesh of bucket.meshes) mesh.visible = false;
      groups.current.push({ originals: bucket.meshes, materials: bucket.meshes.map(mesh => mesh.material), chain, merged: combined, anchor: bucket.anchor });
    }
  });
  return null;
}
