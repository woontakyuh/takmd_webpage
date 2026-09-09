import * as THREE from 'three';

type Point = readonly [east: number, north: number];

interface FacadeSpec {
  readonly osmIndex: number;
  readonly osmId: number;
  readonly edge: readonly [Point, Point];
  readonly base: number;
  readonly height: number;
  readonly roof: 'parapet' | 'lift' | 'stepped';
}

export interface BanpoFacadeDetails {
  readonly group: THREE.Group;
  readonly setNightMix: (mix: number) => void;
  readonly dispose: () => void;
}

export const BANPO_FACADE_SOURCES = [
  { osmIndex: 607, osmId: 1430405936, edge: [[1990, 784.6], [1951.8, 794.6]], base: 17.6, height: 109, roof: 'stepped' },
  { osmIndex: 227, osmId: 700865396, edge: [[1968.5, 859.7], [2001.4, 849.5]], base: 21.6, height: 76, roof: 'lift' },
  { osmIndex: 527, osmId: 700865401, edge: [[1946.9, 932.6], [1964.8, 939.9]], base: 23.1, height: 96, roof: 'stepped' },
  { osmIndex: 695, osmId: 700865399, edge: [[1922.1, 1018.4], [1966.6, 1026.6]], base: 27, height: 76, roof: 'parapet' },
  { osmIndex: 442, osmId: 431800084, edge: [[1797.1, 914.6], [1859.5, 971.5]], base: 26, height: 57.9, roof: 'lift' },
  { osmIndex: 206, osmId: 431800077, edge: [[1629.2, 809.6], [1692.4, 885.5]], base: 16.5, height: 33.5, roof: 'parapet' },
  { osmIndex: 357, osmId: 431800079, edge: [[1808.7, 869.8], [1801.6, 847.8]], base: 21.6, height: 45.8, roof: 'stepped' },
  { osmIndex: 459, osmId: 469650431, edge: [[2089.8, 1053.5], [2148.2, 1039.1]], base: 20.2, height: 54, roof: 'lift' },
  { osmIndex: 461, osmId: 469650430, edge: [[2073.8, 997], [2132.1, 982.6]], base: 18.9, height: 50, roof: 'parapet' },
  { osmIndex: 574, osmId: 469650424, edge: [[2042.8, 1029.6], [2025.4, 953.5]], base: 17.3, height: 54.9, roof: 'stepped' },
] as const satisfies readonly FacadeSpec[];

interface DetailInstance {
  readonly matrix: THREE.Matrix4;
  readonly color: THREE.Color;
}

const OBSERVER = new THREE.Vector3(1400, 0, 280);
const UNIT_X = new THREE.Vector3(1, 0, 0);
const STRUCTURE_PALETTE = [0xb8b5aa, 0x9ea9aa, 0xc1bba9, 0x879496] as const;
const LIGHT_PALETTE = [
  new THREE.Color().setRGB(2.45, 1.82, 1.08),
  new THREE.Color().setRGB(1.75, 1.58, 1.23),
  new THREE.Color().setRGB(1.42, 1.62, 1.78),
] as const;

function edgeFrame(spec: FacadeSpec) {
  const start = new THREE.Vector3(spec.edge[0][0], 0, -spec.edge[0][1]);
  const end = new THREE.Vector3(spec.edge[1][0], 0, -spec.edge[1][1]);
  const midpoint = start.clone().lerp(end, 0.5);
  const direction = end.clone().sub(start);
  const length = direction.length();
  const rotation = new THREE.Quaternion().setFromUnitVectors(UNIT_X, direction.normalize());
  const outward = OBSERVER.clone().sub(midpoint).setY(0).normalize();
  return { midpoint, length, rotation, outward };
}

function transform(
  position: THREE.Vector3,
  rotation: THREE.Quaternion,
  scale: THREE.Vector3,
): THREE.Matrix4 {
  return new THREE.Matrix4().compose(position, rotation, scale);
}

function addRoofDetails(
  spec: FacadeSpec,
  buildingIndex: number,
  frame: ReturnType<typeof edgeFrame>,
  structures: DetailInstance[],
): void {
  const roofY = spec.base + spec.height;
  const color = new THREE.Color(STRUCTURE_PALETTE[buildingIndex % STRUCTURE_PALETTE.length]);
  structures.push({
    matrix: transform(
      frame.midpoint.clone().addScaledVector(frame.outward, 0.22).setY(roofY + 0.65),
      frame.rotation,
      new THREE.Vector3(frame.length, 1.3, 0.5),
    ),
    color,
  });
  if (spec.roof === 'parapet') return;
  const housingWidth = Math.min(12, frame.length * 0.32);
  structures.push({
    matrix: transform(
      frame.midpoint.clone().addScaledVector(frame.outward, -2).setY(roofY + 2.5),
      frame.rotation,
      new THREE.Vector3(housingWidth, 5, 4.5),
    ),
    color,
  });
  if (spec.roof === 'lift') return;
  structures.push({
    matrix: transform(
      frame.midpoint.clone().addScaledVector(frame.outward, -2).setY(roofY + 5.65),
      frame.rotation,
      new THREE.Vector3(housingWidth * 0.62, 1.3, 3.3),
    ),
    color,
  });
}

function makeInstances(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  instances: readonly DetailInstance[],
  name: string,
): THREE.InstancedMesh {
  const mesh = new THREE.InstancedMesh(geometry, material, instances.length);
  mesh.name = name;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  instances.forEach((instance, index) => {
    mesh.setMatrixAt(index, instance.matrix);
    mesh.setColorAt(index, instance.color);
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  return mesh;
}

export function createBanpoFacadeDetails(): BanpoFacadeDetails {
  const group = new THREE.Group();
  group.name = 'OSM-aligned north-bank facade details';
  const bands: DetailInstance[] = [];
  const structures: DetailInstance[] = [];
  const lights: DetailInstance[] = [];
  const lightColors: THREE.Color[] = [];

  BANPO_FACADE_SOURCES.forEach((spec, buildingIndex) => {
    const frame = edgeFrame(spec);
    const floors = Math.max(4, Math.floor((spec.height - 2.2) / 3.15));
    const bays = Math.max(3, Math.floor((frame.length - 1.4) / 3.25));
    const bayWidth = (frame.length - 1.4) / bays;
    const structureColor = new THREE.Color(STRUCTURE_PALETTE[buildingIndex % STRUCTURE_PALETTE.length]);
    for (let floor = 0; floor < floors; floor += 1) {
      const y = spec.base + 1.75 + floor * 3.15;
      const bandCenter = frame.midpoint.clone().addScaledVector(frame.outward, 0.14).setY(y);
      bands.push({
        matrix: transform(bandCenter, frame.rotation, new THREE.Vector3(frame.length - 1.2, 1.72, 0.18)),
        color: new THREE.Color(0x1b3035),
      });
      if (floor % 3 === 2) structures.push({
        matrix: transform(
          frame.midpoint.clone().addScaledVector(frame.outward, 0.31).setY(y - 1.02),
          frame.rotation,
          new THREE.Vector3(frame.length, 0.18, 0.62),
        ),
        color: structureColor,
      });
      for (let bay = 0; bay < bays; bay += 1) {
        const occupied = (buildingIndex * 47 + floor * 29 + bay * 17) % 11 < 4;
        if (!occupied) continue;
        const along = -frame.length / 2 + 0.7 + bayWidth * (bay + 0.5);
        const position = bandCenter.clone()
          .add(new THREE.Vector3(1, 0, 0).applyQuaternion(frame.rotation).multiplyScalar(along))
          .addScaledVector(frame.outward, 0.11);
        const color = LIGHT_PALETTE[(buildingIndex + floor * 2 + bay) % LIGHT_PALETTE.length].clone();
        lights.push({
          matrix: transform(position, frame.rotation, new THREE.Vector3(bayWidth * 0.68, 1.28, 0.08)),
          color,
        });
        lightColors.push(color);
      }
    }
    for (let bay = 0; bay <= bays; bay += 1) {
      const along = -frame.length / 2 + 0.7 + (frame.length - 1.4) * bay / bays;
      structures.push({
        matrix: transform(
          frame.midpoint.clone().add(new THREE.Vector3(1, 0, 0).applyQuaternion(frame.rotation).multiplyScalar(along))
            .addScaledVector(frame.outward, 0.3).setY(spec.base + spec.height / 2),
          frame.rotation,
          new THREE.Vector3(0.16, spec.height - 1, 0.54),
        ),
        color: structureColor,
      });
    }
    addRoofDetails(spec, buildingIndex, frame, structures);
  });

  const darkMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.28, metalness: 0.16 });
  const structureMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.72, metalness: 0.04 });
  const lightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: true });
  const bandMesh = makeInstances(new THREE.BoxGeometry(1, 1, 1), darkMaterial, bands, 'Recessed facade window bands');
  const structureMesh = makeInstances(new THREE.BoxGeometry(1, 1, 1), structureMaterial, structures, 'Facade frames ledges and roof silhouettes');
  const lightMesh = makeInstances(new THREE.BoxGeometry(1, 1, 1), lightMaterial, lights, 'Varied occupied north-bank windows');
  group.add(bandMesh, structureMesh, lightMesh);
  const mixedLight = new THREE.Color();

  const setNightMix = (value: number): void => {
    const mix = THREE.MathUtils.clamp(value, 0, 1);
    lightColors.forEach((color, index) => lightMesh.setColorAt(index, mixedLight.copy(color).multiplyScalar(mix)));
    if (lightMesh.instanceColor) lightMesh.instanceColor.needsUpdate = true;
  };
  setNightMix(0);

  return {
    group,
    setNightMix,
    dispose: (): void => {
      group.traverse(object => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        if (object instanceof THREE.InstancedMesh) object.dispose();
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) material.dispose();
      });
      group.clear();
    },
  };
}
