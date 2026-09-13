import {
  BoxGeometry, BufferGeometry, CylinderGeometry, Float32BufferAttribute, Group, Matrix4, Mesh,
  MeshStandardMaterial, Quaternion, Vector3,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Point } from './config';

export const LUMBAR_BOX = {
  width: 0.30, depth: 0.38, cornerRadius: 0.053,
  materials: {
    shell: { color: '#191C20', roughness: 0.45, metalness: 0.05 },
    joint: { color: '#0D1013', roughness: 0.68 },
    rim: { color: '#EBEBE3', roughness: 0.56 },
    skin: { color: '#D69A81', roughness: 0.82 },
    steel: { color: '#BCC4C7', roughness: 0.24, metalness: 0.92 },
  },
} as const;

type Finish = keyof typeof LUMBAR_BOX.materials;
type LumbarBoxPart = {
  readonly finish: Finish;
  readonly geometry: BufferGeometry;
  readonly position?: Point;
  readonly rotation?: Quaternion;
};
type AddLumbarBoxPart = (part: LumbarBoxPart) => void;

type Contour = {
  readonly inset: number;
  readonly height: (x: number, z: number) => number;
};

const PERIMETER_SEGMENTS = 80;

function perimeter(inset: number, index: number): readonly [number, number] {
  const radius = Math.max(0.016, LUMBAR_BOX.cornerRadius - inset * 0.4);
  const x = LUMBAR_BOX.width / 2 - inset - radius;
  const z = LUMBAR_BOX.depth / 2 - inset - radius;
  const quarter = Math.floor(index / 20) % 4;
  const phase = index % 20;
  const arcPoint = (corner: number, angle: number): readonly [number, number] => [
    Math.cos(angle) * radius + (corner === 0 || corner === 3 ? x : -x),
    Math.sin(angle) * radius + (corner < 2 ? z : -z),
  ];
  if (phase < 10) return arcPoint(quarter, (quarter + phase / 9) * Math.PI / 2);
  const from = arcPoint(quarter, (quarter + 1) * Math.PI / 2);
  const to = arcPoint((quarter + 1) % 4, (quarter + 1) * Math.PI / 2);
  const fraction = (phase - 9) / 11;
  return [from[0] + (to[0] - from[0]) * fraction, from[1] + (to[1] - from[1]) * fraction];
}

function lumbarSkinHeight(x: number, z: number): number {
  const longitudinalCrown = 0.027 * Math.cos(z / 0.38 * Math.PI * 2);
  const transverseCrown = 0.015 * Math.cos(x / 0.30 * Math.PI * 2);
  const midline = 0.003 * Math.exp(-Math.pow(x / 0.026, 2));
  return 0.195 + longitudinalCrown + transverseCrown - midline;
}

function loft(contours: readonly Contour[]): BufferGeometry {
  const vertices: number[] = [];
  const indices: number[] = [];
  contours.forEach((contour, row) => {
    for (let index = 0; index < PERIMETER_SEGMENTS; index += 1) {
      const [x, z] = perimeter(contour.inset, index);
      vertices.push(x, contour.height(x, z), z);
      if (row === 0) continue;
      const a = (row - 1) * PERIMETER_SEGMENTS + index;
      const b = (row - 1) * PERIMETER_SEGMENTS + (index + 1) % PERIMETER_SEGMENTS;
      const c = row * PERIMETER_SEGMENTS + index;
      const d = row * PERIMETER_SEGMENTS + (index + 1) % PERIMETER_SEGMENTS;
      indices.push(a, c, b, b, c, d);
    }
  });
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function skinSurface(): BufferGeometry {
  const vertices = [0, lumbarSkinHeight(0, 0), 0];
  const indices: number[] = [];
  const rings = 12;
  for (let ring = 1; ring <= rings; ring += 1) {
    const scale = ring / rings;
    for (let index = 0; index < PERIMETER_SEGMENTS; index += 1) {
      const [px, pz] = perimeter(0.027, index);
      const x = px * scale;
      const z = pz * scale;
      vertices.push(x, lumbarSkinHeight(x, z), z);
      const current = 1 + (ring - 1) * PERIMETER_SEGMENTS + index;
      const next = 1 + (ring - 1) * PERIMETER_SEGMENTS + (index + 1) % PERIMETER_SEGMENTS;
      if (ring === 1) indices.push(0, next, current);
      else indices.push(current - PERIMETER_SEGMENTS, next, current,
        current - PERIMETER_SEGMENTS, next - PERIMETER_SEGMENTS, next);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function createLumbarBox(): Group {
  const batches = new Map<Finish, BufferGeometry[]>();
  const add: AddLumbarBoxPart = ({ finish, geometry, position = [0, 0, 0], rotation = new Quaternion() }) => {
    const transformed = geometry.index ? geometry.toNonIndexed() : geometry.clone();
    transformed.deleteAttribute('uv');
    transformed.applyMatrix4(new Matrix4().compose(new Vector3(...position), rotation, new Vector3(1, 1, 1)));
    geometry.dispose();
    const existing = batches.get(finish) ?? [];
    existing.push(transformed);
    batches.set(finish, existing);
  };
  for (const [bottom, top] of [[0.004, 0.079], [0.081, 0.141]] as const) {
    add({ finish: 'shell', geometry: loft([
      { inset: 0.006, height: () => bottom }, { inset: 0, height: () => bottom + 0.004 },
      { inset: 0, height: () => top - 0.002 }, { inset: 0.002, height: () => top },
    ]) });
  }
  add({ finish: 'joint', geometry: loft([{ inset: 0.001, height: () => 0.014 }, { inset: 0.001, height: () => 0.151 }]) });
  add({ finish: 'shell', geometry: loft([
    { inset: 0.002, height: () => 0.143 }, { inset: 0, height: () => 0.146 },
    { inset: 0, height: (x, z) => lumbarSkinHeight(x, z) - 0.015 },
    { inset: 0.005, height: (x, z) => lumbarSkinHeight(x, z) - 0.014 },
    { inset: 0.013, height: (x, z) => lumbarSkinHeight(x, z) - 0.021 },
  ]) });
  add({ finish: 'rim', geometry: loft([
    { inset: 0.012, height: (x, z) => lumbarSkinHeight(x, z) - 0.023 },
    { inset: 0.012, height: (x, z) => lumbarSkinHeight(x, z) + 0.003 },
    { inset: 0.017, height: (x, z) => lumbarSkinHeight(x, z) + 0.008 },
    { inset: 0.024, height: (x, z) => lumbarSkinHeight(x, z) + 0.006 },
    { inset: 0.027, height: (x, z) => lumbarSkinHeight(x, z) - 0.001 },
  ]) });
  add({ finish: 'skin', geometry: skinSurface() });
  for (const x of [-0.105, 0.105]) {
    for (const z of [-0.144, 0.144]) add({ finish: 'joint', geometry: new CylinderGeometry(0.018, 0.016, 0.006, 16), position: [x, 0.002, z] });
  }
  add({ finish: 'joint', geometry: new BoxGeometry(0.088, 0.027, 0.002), position: [0, 0.051, 0.190] });
  add({ finish: 'steel', geometry: new BoxGeometry(0.079, 0.019, 0.0008), position: [0, 0.051, 0.1912] });
  const group = new Group();
  group.name = 'UpSurgeOn Endoscopic LumbarBox';
  for (const [finish, parts] of batches) {
    const geometry = mergeGeometries(parts);
    parts.forEach(part => part.dispose());
    const mesh = new Mesh(geometry, new MeshStandardMaterial(LUMBAR_BOX.materials[finish]));
    mesh.name = `LumbarBox ${finish}`;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }
  group.userData = { product: 'Endoscopic LumbarBox', source: 'https://store.upsurgeon.com/products/endoscopic-lumbarbox', dimensions: 'Reference-derived scene-scale estimate', units: 'metres' };
  return group;
}
