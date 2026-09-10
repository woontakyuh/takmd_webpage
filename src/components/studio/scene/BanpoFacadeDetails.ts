import * as THREE from 'three';
import { BANPO_FACADE_SOURCES, type BanpoFacadeSpec } from './BanpoFacadeSources';

export { BANPO_FACADE_SOURCES } from './BanpoFacadeSources';

export interface BanpoFacadeDetails {
  readonly group: THREE.Group;
  readonly setNightMix: (mix: number) => void;
  readonly dispose: () => void;
}

interface DetailInstance {
  readonly matrix: THREE.Matrix4;
  readonly color: THREE.Color;
}

const OBSERVER = new THREE.Vector3(1400, 0, 280);
const UNIT_X = new THREE.Vector3(1, 0, 0);
const STRUCTURE_PALETTE = [0xadafa7, 0x9ba5a4, 0xb5b2a5, 0x939fa0] as const;
const GLASS_PALETTE = [0x536063, 0x5c6969, 0x606a68, 0x4f6065] as const;
const LIGHT_PALETTE = [
  new THREE.Color().setRGB(1.8, 1.45, 1.0),
  new THREE.Color().setRGB(1.4, 1.31, 1.13),
  new THREE.Color().setRGB(1.12, 1.26, 1.39),
] as const;

function edgeFrame(spec: BanpoFacadeSpec) {
  const start = new THREE.Vector3(spec.edge[0][0], 0, -spec.edge[0][1]);
  const end = new THREE.Vector3(spec.edge[1][0], 0, -spec.edge[1][1]);
  const midpoint = start.clone().lerp(end, 0.5);
  const direction = end.clone().sub(start);
  const length = direction.length();
  direction.normalize();
  const rotation = new THREE.Quaternion().setFromUnitVectors(UNIT_X, direction);
  const outward = new THREE.Vector3(-direction.z, 0, direction.x);
  if (outward.dot(OBSERVER.clone().sub(midpoint)) < 0) outward.negate();
  return { midpoint, direction, length, rotation, outward };
}

function occupancy(osmId: number, floor: number, bay: number): number {
  let seed = (osmId ^ Math.imul(floor + 1, 374761393) ^ Math.imul(bay + 1, 668265263)) >>> 0;
  seed = Math.imul(seed ^ (seed >>> 13), 1274126177) >>> 0;
  return (seed ^ (seed >>> 16)) >>> 0;
}

export function createBanpoFacadeDetails(): BanpoFacadeDetails {
  const group = new THREE.Group();
  group.name = 'OSM-aligned north-bank facade details';
  const bands: DetailInstance[] = [];
  const structures: DetailInstance[] = [];
  const lights: DetailInstance[] = [];

  BANPO_FACADE_SOURCES.forEach(spec => {
    const frame = edgeFrame(spec);
    const palette = spec.osmIndex % STRUCTURE_PALETTE.length;
    const structureColor = new THREE.Color(STRUCTURE_PALETTE[palette]);
    const glassColor = new THREE.Color(GLASS_PALETTE[palette]);
    const floors = Math.min(32, Math.floor((spec.height - 3) / 3.15));
    const storey = (spec.height - 3) / floors;
    const bays = Math.min(12, Math.max(3, Math.floor((frame.length - 2) / 5.8)));
    const width = frame.length - 1.8;
    const bayWidth = width / bays;
    const slab = frame.length > spec.height * 0.8;
    const core = slab ? 1.5 : Math.min(2.8, width * 0.1);
    const stackWidth = (width - core) / 2;

    // Each detail is a small attachment to its source edge; building masses stay in the GLB.
    const instance = (offset: readonly [number, number, number], dimensions: readonly [number, number, number], color: THREE.Color): DetailInstance => {
      const position = frame.midpoint.clone().addScaledVector(frame.direction, offset[0])
        .addScaledVector(frame.outward, offset[2]).setY(offset[1]);
      return { matrix: new THREE.Matrix4().compose(position, frame.rotation, new THREE.Vector3(...dimensions)), color };
    };
    for (let floor = 0; floor < floors; floor += 1) {
      const y = spec.base + 2.2 + floor * storey;
      for (const side of [-1, 1]) {
        bands.push(instance([side * (core + stackWidth) / 2, y, 0.14], [stackWidth, slab ? 1.65 : 1.85, 0.16], glassColor));
        if (slab && floor % 2 === 0) structures.push(instance(
          [side * (core + stackWidth) / 2, y - 1.05, 0.3], [stackWidth, 0.22, 0.6], structureColor));
      }
      for (let bay = 0; bay < bays; bay += 1) {
        const seed = occupancy(spec.osmId, floor, bay);
        if (seed % 100 >= 25 + spec.osmIndex % 13) continue;
        const along = -width / 2 + bayWidth * (bay + 0.5);
        const windowWidth = Math.min(bayWidth * 0.57, Math.max(0, Math.abs(along) - core / 2 - 0.12) * 2);
        if (windowWidth < 0.7) continue;
        lights.push(instance([along, y, 0.25], [windowWidth, 1.3, 0.06], LIGHT_PALETTE[seed % LIGHT_PALETTE.length]));
      }
    }
    // Wide masonry piers separate balcony stacks and leave a quiet central stair core.
    for (let bay = 1; bay < bays; bay += 1) {
      const along = -width / 2 + bayWidth * bay;
      if (Math.abs(along) < core / 2) continue;
      structures.push(instance([along, spec.base + spec.height / 2, 0.3],
        [slab ? 0.48 : 0.78, spec.height - 1.4, slab ? 0.5 : 0.62], structureColor));
    }
    structures.push(instance([0, spec.base + spec.height + 0.24, 0.12], [width, 0.48, 0.4], structureColor));
  });

  const darkMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.48, metalness: 0.08 });
  const structureMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, metalness: 0.02 });
  const lightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: true });
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const batches = [
    { name: 'Recessed facade window bands', material: darkMaterial, entries: bands },
    { name: 'Facade frames ledges and roof silhouettes', material: structureMaterial, entries: structures },
    { name: 'Varied occupied north-bank windows', material: lightMaterial, entries: lights },
  ];
  for (const batch of batches) {
    const mesh = new THREE.InstancedMesh(geometry, batch.material, batch.entries.length);
    mesh.name = batch.name;
    batch.entries.forEach((instance, index) => {
      mesh.setMatrixAt(index, instance.matrix);
      mesh.setColorAt(index, instance.color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    group.add(mesh);
  }
  const lightMesh = group.children[2];
  const setNightMix = (value: number): void => {
    const mix = THREE.MathUtils.clamp(value, 0, 1);
    lightMaterial.color.setScalar(mix);
    lightMesh.visible = mix > 0.001;
  };
  setNightMix(0);

  return {
    group,
    setNightMix,
    dispose: (): void => {
      geometry.dispose();
      darkMaterial.dispose();
      structureMaterial.dispose();
      lightMaterial.dispose();
      for (const object of group.children) if (object instanceof THREE.InstancedMesh) object.dispose();
      group.clear();
    },
  };
}
