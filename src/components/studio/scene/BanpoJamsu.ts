import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export const JAMSU = {
  length: 795, width: 18, southStation: 315, deckThickness: 1.2,
  waterClearance: 2.7, crestStation: 505, crestHalfLength: 135, crestRise: 6.8,
  concrete: 0xaaa79b, asphalt: 0x5a5f5e, cycle: 0x895e53, rail: 0xb7b5a7,
} as const;
const SOUTH = new THREE.Vector3(611, 0, 65);
const AXIS = new THREE.Vector3(-445, 0, -1510).normalize();
const SIDE = new THREE.Vector3(-AXIS.z, 0, AXIS.x);
const LEGACY_NAMES = ['Jamsu_lower_crossing', 'Jamsu_parapets'] as const;

export function jamsuHeight(station: number): number {
  const crestDistance = Math.abs(station - JAMSU.crestStation) / JAMSU.crestHalfLength;
  const crest = crestDistance < 1 ? (1 + Math.cos(crestDistance * Math.PI)) * JAMSU.crestRise / 2 : 0;
  const approach = Math.max(0, 1 - station / 45, 1 - (JAMSU.length - station) / 45);
  return JAMSU.waterClearance + Math.max(crest, THREE.MathUtils.smootherstep(approach, 0, 1) * 6);
}

function point(station: number, lateral = 0, above = 0): THREE.Vector3 {
  const p = SOUTH.clone().addScaledVector(AXIS, JAMSU.southStation + station).addScaledVector(SIDE, lateral);
  p.y = jamsuHeight(station) + above;
  return p;
}

function ribbon(left: number, right: number, above: number, thickness: number): THREE.BufferGeometry {
  const positions: number[] = [];
  const quad = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3): void => {
    for (const p of [a, c, b, a, d, c]) positions.push(p.x, p.y, p.z);
  };
  for (let start = 0; start < JAMSU.length; start += 5) {
    const end = Math.min(JAMSU.length, start + 5);
    const a = point(start, left, above), b = point(end, left, above);
    const c = point(end, right, above), d = point(start, right, above);
    quad(a, b, c, d);
    if (thickness <= 0) continue;
    const down = new THREE.Vector3(0, -thickness, 0);
    const e = a.clone().add(down), f = b.clone().add(down), g = c.clone().add(down), h = d.clone().add(down);
    quad(h, g, f, e); quad(a, e, f, b); quad(d, c, g, h);
    if (start === 0) quad(a, d, h, e);
    if (end === JAMSU.length) quad(b, f, g, c);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function beam(a: THREE.Vector3, b: THREE.Vector3, width: number, height: number): THREE.BufferGeometry {
  const delta = b.clone().sub(a);
  const indexed = new THREE.BoxGeometry(width, height, delta.length())
    .applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), delta.normalize()))
    .translate(...a.clone().add(b).multiplyScalar(.5).toArray());
  const geometry = indexed.toNonIndexed(); indexed.dispose(); geometry.deleteAttribute('uv'); return geometry;
}

class JamsuGeometryError extends Error {
  constructor() { super('Unable to merge the Jamsu bridge geometry.'); this.name = 'JamsuGeometryError'; }
}

export function createBanpoJamsu(model: THREE.Group) {
  const group = new THREE.Group(); group.name = 'Jamsu lower bridge';
  const hidden = LEGACY_NAMES.flatMap(name => {
    const object = model.getObjectByName(name);
    if (!object) return [];
    const visible = object.visible; object.visible = false;
    return [{ object, visible }];
  });
  const meshes: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>[] = [];
  const add = (name: string, color: number, parts: THREE.BufferGeometry[]): THREE.MeshStandardMaterial => {
    const geometry = mergeGeometries(parts);
    parts.forEach(part => part.dispose());
    if (!geometry) throw new JamsuGeometryError();
    const material = new THREE.MeshStandardMaterial({ color, roughness: .87, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geometry, material); mesh.name = name;
    group.add(mesh); meshes.push(mesh); return material;
  };
  const concrete = [ribbon(-9, 9, 0, JAMSU.deckThickness)];
  // Align lower bearing caps to the retained upper bridge's 30 m support stations.
  for (let station = 30; station < JAMSU.length - 10; station += 30) {
    concrete.push(beam(point(station, -8.8, -1.35), point(station, 8.8, -1.35), 2.4, .7));
  }
  add('Jamsu continuous low deck and raised navigation span', JAMSU.concrete, concrete);
  add('Jamsu two-lane road', JAMSU.asphalt, [ribbon(-3.6, 3.6, .04, 0)]);
  add('Jamsu riverside cycle path', JAMSU.cycle, [ribbon(4.1, 7, .05, 0)]);
  const rails: THREE.BufferGeometry[] = [];
  for (const side of [-1, 1]) {
    rails.push(ribbon(side < 0 ? -9 : 8.55, side < 0 ? -8.55 : 9, .2, .4));
    for (let station = 0; station < JAMSU.length; station += 5) {
      const end = Math.min(JAMSU.length, station + 5);
      for (const height of [.65, 1.1]) rails.push(beam(point(station, side * 8.8, height), point(end, side * 8.8, height), .09, .09));
    }
    for (let station = 0; station <= JAMSU.length; station += 3) {
      rails.push(beam(point(station, side * 8.8, .2), point(station, side * 8.8, 1.12), .1, .1));
    }
  }
  const railMaterial = add('Jamsu low open railings and pale deck edges', JAMSU.rail, rails);
  railMaterial.emissive.set(0xb29262);
  group.userData = { lengthM: JAMSU.length, widthM: JAMSU.width, profileEstimated: true,
    axisBasis: 'Retained Banpo axis; lower level centered beneath the upper roadway',
    source: 'https://english.seoul.go.kr/service/amusement/hangang/overview/',
    profileSource: 'https://www.kroad.or.kr/journal/182th_07road_essay1.pdf',
    triangles: meshes.reduce((n, mesh) => n + mesh.geometry.getAttribute('position').count / 3, 0) };
  return {
    group,
    setNightMix: (mix: number): void => { railMaterial.emissiveIntensity = THREE.MathUtils.lerp(0, .22, mix); },
    dispose: (): void => {
      group.removeFromParent();
      meshes.forEach(mesh => { mesh.geometry.dispose(); mesh.material.dispose(); });
      hidden.forEach(({ object, visible }) => { object.visible = visible; });
      group.clear();
    },
  };
}
