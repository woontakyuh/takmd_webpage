import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { CanopyPlacement } from './BanpoCanopyPlacement';
import canopyPlacements from '../../../../public/models/han-river/vegetation/canopy-placements.json';
import { BANPO_APPEARANCE } from './BanpoAppearance';
import { preserveDistantLeafCoverage } from './BanpoLeafCoverage';

interface CanopyIndexChange {
  readonly geometry: THREE.BufferGeometry;
  readonly original: THREE.BufferAttribute;
}

export interface BanpoVegetation {
  readonly group: THREE.Group;
  readonly ready: Promise<boolean>;
  readonly dispose: () => void;
}

const FORMER_BANK_TREES = [
  [829.45, 398.65], [802.8, 378.75], [853.175, 421.7166666667],
  [874.325, 443.75], [770.95, 363.3], [895.475, 465.7833333333],
  [916.625, 487.8166666667], [738.55, 350.75], [937.775, 509.85],
  [958.925, 531.8833333333], [1083, 591.1], [706.6, 339.05],
  [1101.425, 614.025], [672.6833333333, 327.6833333333],
  [1117.075, 639.875], [640.65, 318.45],
  [608.6166666667, 309.2166666667], [573.35, 298.15],
] as const satisfies readonly (readonly [east: number, north: number])[];

const TREE_ASSET = '/models/han-river/vegetation/tree-small-02-riverbank.glb';
const CANOPY_RADIUS_SQUARED = 3.8 ** 2;
export const BANPO_REPLACEMENT_TREES: readonly CanopyPlacement[] = canopyPlacements;
const CANOPY_CELL_SIZE = 16;
const replacementCells = new Map<string, readonly (readonly number[])[]>();
for (const point of FORMER_BANK_TREES) {
  const key = `${Math.floor(point[0] / CANOPY_CELL_SIZE)},${Math.floor(point[1] / CANOPY_CELL_SIZE)}`;
  replacementCells.set(key, [...(replacementCells.get(key) ?? []), point]);
}

function disposeObject(root: THREE.Object3D): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material);
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
    }
    if (object instanceof THREE.InstancedMesh) object.dispose();
  });
  geometries.forEach(geometry => geometry.dispose());
  materials.forEach(material => material.dispose());
  textures.forEach(texture => texture.dispose());
  root.clear();
}

function overlapsReplacement(x: number, z: number): boolean {
  const column = Math.floor(x / CANOPY_CELL_SIZE); const row = Math.floor(-z / CANOPY_CELL_SIZE);
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const nearby = replacementCells.get(`${column + dx},${row + dy}`);
      if (nearby?.some(([east, north]) => (x - east) ** 2 + (z + north) ** 2 <= CANOPY_RADIUS_SQUARED)) return true;
    }
  }
  return false;
}

function removeCrudeCanopies(model: THREE.Group): CanopyIndexChange[] {
  const changes: CanopyIndexChange[] = [];
  const vertex = new THREE.Vector3();
  const centroid = new THREE.Vector3();
  const relative = new THREE.Matrix4();
  model.updateWorldMatrix(true, true);
  const inverseModel = model.matrixWorld.clone().invert();
  model.traverse(object => {
    if (!(object instanceof THREE.Mesh) || !object.name.startsWith('Riverbank_tree_canopies')) return;
    const index = object.geometry.index;
    if (!index) return;
    relative.multiplyMatrices(inverseModel, object.matrixWorld);
    const position = object.geometry.getAttribute('position');
    const retained: number[] = [];
    for (let offset = 0; offset < index.count; offset += 3) {
      centroid.set(0, 0, 0);
      for (let corner = 0; corner < 3; corner += 1) {
        vertex.fromBufferAttribute(position, index.getX(offset + corner)).applyMatrix4(relative);
        centroid.add(vertex);
      }
      centroid.multiplyScalar(1 / 3);
      if (overlapsReplacement(centroid.x, centroid.z)) continue;
      retained.push(index.getX(offset), index.getX(offset + 1), index.getX(offset + 2));
    }
    if (retained.length === index.count) return;
    changes.push({ geometry: object.geometry, original: index });
    object.geometry.setIndex(retained);
    object.geometry.computeBoundingBox();
    object.geometry.computeBoundingSphere();
  });
  return changes;
}

function instanceTreeParts(source: THREE.Group, group: THREE.Group, placements: readonly CanopyPlacement[]): void {
  source.updateWorldMatrix(true, true);
  source.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    const material = Array.isArray(object.material) ? object.material[0] : object.material;
    if (!material) return;
    if (material.name === 'tree_small_02_leaves') {
      preserveDistantLeafCoverage(object.geometry, BANPO_APPEARANCE.park.leafClusterScale);
      material.alphaTest = BANPO_APPEARANCE.park.leafAlphaCutoff;
      material.needsUpdate = true;
    }
    for (const value of Object.values(material)) if (value instanceof THREE.Texture) value.anisotropy = 4;
    const mesh = new THREE.InstancedMesh(object.geometry, material, placements.length);
    mesh.name = `Near-bank detailed trees ${material.name}`;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    placements.forEach(({ east, north, elevation, scale, rotation }, index) => {
      const placement = new THREE.Matrix4().compose(
        new THREE.Vector3(east, elevation, -north),
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotation),
        new THREE.Vector3(scale, scale * (0.96 + (index % 3) * 0.035), scale),
      );
      mesh.setMatrixAt(index, placement.multiply(object.matrixWorld));
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingBox();
    mesh.computeBoundingSphere();
    group.add(mesh);
  });
}

export function createBanpoVegetation(model: THREE.Group, assetUrl: string = TREE_ASSET, additional: readonly CanopyPlacement[] = []): BanpoVegetation {
  const group = new THREE.Group();
  group.name = 'Near-bank detailed deciduous trees';
  model.add(group);
  const canopyChanges: CanopyIndexChange[] = [];
  let disposed = false;
  const ready = new Promise<boolean>(resolve => {
    new GLTFLoader().load(assetUrl, gltf => {
      if (disposed) {
        disposeObject(gltf.scene);
        resolve(false);
        return;
      }
      instanceTreeParts(gltf.scene, group, [...BANPO_REPLACEMENT_TREES, ...additional]);
      gltf.scene.clear();
      canopyChanges.push(...removeCrudeCanopies(model));
      resolve(true);
    }, undefined, error => {
      if (!disposed) console.warn('Detailed riverbank trees could not load; retaining mapped canopy geometry.', error);
      resolve(false);
    });
  });
  return {
    group,
    ready,
    dispose: (): void => {
      disposed = true;
      canopyChanges.forEach(change => change.geometry.setIndex(change.original));
      canopyChanges.length = 0;
      group.removeFromParent();
      disposeObject(group);
    },
  };
}
