import * as THREE from 'three';
import { BANPO_APPEARANCE, banpoGlslColor } from './BanpoAppearance';

export interface CaelitusBuilding {
  readonly id: number;
  readonly p: readonly (readonly number[])[];
  readonly z: number;
  readonly heightM: number;
  readonly floors: number;
  readonly blockNumber: number;
}

export interface CaelitusBridge {
  readonly from: number;
  readonly to: number;
  readonly start: THREE.Vector3;
  readonly end: THREE.Vector3;
  readonly clearSpanM: number;
}

const TOWER_IDS = new Set([522785017, 610247142, 610247143]);
const UNIT_X = new THREE.Vector3(1, 0, 0);
const GLASS_HEIGHT_M = 3.8;

// OSM footprints and roof-height tags; see building-identities.json for primary-source conflicts.
// Haeahn's completed-project photographs inform the curtain wall and bridge trim, not measured details.
const CURTAIN_WALL = `
  vec2 cellGrid = vec2(vCaelitusUv.x / 1.42, vCaelitusUv.y);
  vec2 cell = floor(cellGrid);
  vec2 local = fract(cellGrid);
  vec2 aa = max(fwidth(cellGrid), vec2(0.006));
  vec2 clearPane = smoothstep(vec2(0.035, 0.045) - aa, vec2(0.035, 0.045) + aa, local)
    * (1.0 - smoothstep(vec2(0.965, 0.78) - aa, vec2(0.965, 0.78) + aa, local));
  float pane = clearPane.x * clearPane.y;
  float room = caelitusHash(vec3(floor(cell.x / 2.0), cell.y, vCaelitusSeed));
  float panel = caelitusHash(vec3(cell.x, cell.y, vCaelitusSeed + 31.0));
  vec3 glass = mix(${banpoGlslColor(BANPO_APPEARANCE.caelitus.linear.glassDark)}, ${banpoGlslColor(BANPO_APPEARANCE.caelitus.linear.glassLight)}, panel);
  float verticalLight = 0.86 + 0.14 * sin(vCaelitusUv.x * 0.37 + vCaelitusSeed);
  glass *= verticalLight;
  vec3 frame = ${banpoGlslColor(BANPO_APPEARANCE.caelitus.linear.frame)};
  vec3 spandrel = ${banpoGlslColor(BANPO_APPEARANCE.caelitus.linear.spandrel)};
  diffuseColor.rgb = mix(mix(frame, spandrel, step(0.82, local.y)), glass, pane);
  float occupied = step(room, 0.23) * step(0.13, caelitusHash(vec3(cell.y, vCaelitusSeed, 91.0)));
  vec3 lamp = mix(${banpoGlslColor(BANPO_APPEARANCE.caelitus.linear.lampWarm)}, ${banpoGlslColor(BANPO_APPEARANCE.caelitus.linear.lampCool)}, step(0.16, room));
  totalEmissiveRadiance = lamp * pane * occupied * (0.22 + room * 1.8) * uCaelitusNight;
`;

function curtainWallMaterial() {
  const night = { value: 0 };
  const material = new THREE.MeshStandardMaterial(BANPO_APPEARANCE.caelitus.glass);
  material.onBeforeCompile = shader => {
    shader.uniforms.uCaelitusNight = night;
    shader.vertexShader = shader.vertexShader.replace('#include <common>', `#include <common>
      attribute float caelitusSeed; varying float vCaelitusSeed; varying vec2 vCaelitusUv;`)
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvCaelitusSeed=caelitusSeed;vCaelitusUv=uv;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>
      uniform float uCaelitusNight; varying float vCaelitusSeed; varying vec2 vCaelitusUv;
      float caelitusHash(vec3 p) { return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453); }`)
      .replace('#include <map_fragment>', CURTAIN_WALL)
      .replace('#include <emissivemap_fragment>', '');
  };
  material.customProgramCacheKey = () => 'caelitus-curtain-wall-v1';
  return { material, night };
}

function centroid(building: CaelitusBuilding): THREE.Vector3 {
  const value = new THREE.Vector3();
  for (const point of building.p) value.add(new THREE.Vector3(point[0], building.z, -point[1]));
  return value.multiplyScalar(1 / building.p.length);
}

function closestOnSegment(point: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3): THREE.Vector3 {
  const segment = b.clone().sub(a);
  const lengthSquared = segment.lengthSq();
  const t = lengthSquared > 0 ? THREE.MathUtils.clamp(point.clone().sub(a).dot(segment) / lengthSquared, 0, 1) : 0;
  return a.clone().addScaledVector(segment, t);
}

export function caelitusBridgeSpans(buildings: readonly CaelitusBuilding[]): readonly CaelitusBridge[] {
  const towers = buildings.filter(building => TOWER_IDS.has(building.id));
  const source = towers.find(building => building.blockNumber === 101);
  if (!source) return [];
  // Terrain is an approximation. A shared complex datum keeps both bridges horizontal.
  const level = towers.reduce((sum, building) => sum + building.z, 0) / towers.length + 57;
  const ring = (building: CaelitusBuilding) => building.p.map(point => new THREE.Vector3(point[0], level, -point[1]));
  const sourceRing = ring(source);
  const bridges: CaelitusBridge[] = [];
  for (const target of towers.filter(building => building.blockNumber !== 101)) {
    const targetRing = ring(target);
    let best: { start: THREE.Vector3; end: THREE.Vector3; distance: number } | undefined;
    const consider = (start: THREE.Vector3, end: THREE.Vector3): void => {
      const distance = start.distanceTo(end);
      if (!best || distance < best.distance) best = { start, end, distance };
    };
    for (let i = 0; i < sourceRing.length; i += 1) {
      const a = sourceRing[i]; const b = sourceRing[(i + 1) % sourceRing.length];
      for (let j = 0; j < targetRing.length; j += 1) {
        const c = targetRing[j]; const d = targetRing[(j + 1) % targetRing.length];
        consider(a.clone(), closestOnSegment(a, c, d));
        consider(b.clone(), closestOnSegment(b, c, d));
        consider(closestOnSegment(c, a, b), c.clone());
        consider(closestOnSegment(d, a, b), d.clone());
      }
    }
    if (best) bridges.push({ from: source.id, to: target.id, start: best.start, end: best.end, clearSpanM: best.distance });
  }
  return bridges;
}

export function createBanpoCaelitus(buildings: readonly CaelitusBuilding[]) {
  const towers = buildings.filter(building => TOWER_IDS.has(building.id));
  const group = new THREE.Group();
  group.name = 'Raemian Caelitus · mapped three towers and two skybridges';
  const vertices: number[] = []; const uvs: number[] = []; const seeds: number[] = [];
  const roofs: number[] = [];
  const trimMatrices: THREE.Matrix4[] = [];
  const louvers: THREE.Matrix4[] = [];
  const glass = curtainWallMaterial();
  const trimMaterial = new THREE.MeshStandardMaterial(BANPO_APPEARANCE.caelitus.trim);
  const roofMaterial = new THREE.MeshStandardMaterial(BANPO_APPEARANCE.caelitus.roof);

  const box = (list: THREE.Matrix4[], position: THREE.Vector3, dimensions: THREE.Vector3, rotation = new THREE.Quaternion()): void => {
    list.push(new THREE.Matrix4().compose(position, rotation, dimensions));
  };
  const strip = (list: THREE.Matrix4[], a: THREE.Vector3, b: THREE.Vector3, height: number, depth: number): void => {
    const direction = b.clone().sub(a);
    box(list, a.clone().lerp(b, 0.5), new THREE.Vector3(direction.length(), height, depth),
      new THREE.Quaternion().setFromUnitVectors(UNIT_X, direction.normalize()));
  };
  const wall = (a: THREE.Vector3, b: THREE.Vector3, height: number, floors: number, seed: number, outward: THREE.Vector3): void => {
    const c = b.clone().add(new THREE.Vector3(0, height, 0));
    const d = a.clone().add(new THREE.Vector3(0, height, 0));
    const points = [a, b, c, d];
    const coordinates = [[0, 0], [a.distanceTo(b), 0], [a.distanceTo(b), floors], [0, floors]];
    const normal = b.clone().sub(a).cross(d.clone().sub(a));
    const order = normal.dot(outward) > 0 ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2];
    for (const index of order) {
      vertices.push(points[index].x, points[index].y, points[index].z);
      uvs.push(...coordinates[index]); seeds.push(seed);
    }
  };

  for (const tower of towers) {
    const center = centroid(tower);
    const roofY = tower.z + tower.heightM;
    const points = tower.p.map(point => new THREE.Vector3(point[0], tower.z, -point[1]));
    for (let index = 0; index < points.length; index += 1) {
      const a = points[index]; const b = points[(index + 1) % points.length];
      const midpoint = a.clone().lerp(b, 0.5);
      const outward = midpoint.clone().sub(center).setY(0).normalize();
      wall(a, b, tower.heightM, tower.floors, tower.blockNumber * 7 + index, outward);
      const distance = a.distanceTo(b);
      const fins = Math.max(2, Math.round(distance / 7.4));
      for (let fin = 0; fin <= fins; fin += 1) {
        const location = a.clone().lerp(b, fin / fins).addScaledVector(outward, 0.17);
        location.y = tower.z + tower.heightM / 2;
        const ribWidth = fin % 2 === 1 ? 0.74 : 0.42;
        box(trimMatrices, location, new THREE.Vector3(ribWidth, tower.heightM, ribWidth));
      }
      for (let row = 0; row < 6; row += 1) {
        const y = roofY - 0.35 - row * 0.49;
        strip(louvers, a.clone().setY(y), b.clone().setY(y), 0.13, 0.2);
      }
      strip(trimMatrices, a.clone().setY(roofY - 0.12), b.clone().setY(roofY - 0.12), 0.24, 0.42);
    }
    const contour = points.map(point => new THREE.Vector2(point.x, point.z));
    for (const face of THREE.ShapeUtils.triangulateShape(contour, [])) {
      const a = points[face[0]].clone().setY(roofY - 0.3);
      const b = points[face[1]].clone().setY(roofY - 0.3);
      const c = points[face[2]].clone().setY(roofY - 0.3);
      const triangle = b.clone().sub(a).cross(c.clone().sub(a)).y > 0 ? [a, b, c] : [a, c, b];
      for (const point of triangle) roofs.push(point.x, point.y, point.z);
    }
  }

  const bridges = caelitusBridgeSpans(towers);
  const framedTowers = new Set<number>();
  for (const bridge of bridges) {
    const direction = bridge.end.clone().sub(bridge.start).normalize();
    const normal = new THREE.Vector3(-direction.z, 0, direction.x);
    const start = bridge.start.clone().addScaledVector(direction, -1.4);
    const end = bridge.end.clone().addScaledVector(direction, 1.4);
    const width = 4.6;
    for (const side of [-1, 1]) {
      const a = start.clone().addScaledVector(normal, side * width / 2);
      const b = end.clone().addScaledVector(normal, side * width / 2);
      wall(a, b, GLASS_HEIGHT_M, 1, bridge.to % 101 + 11, normal.clone().multiplyScalar(side));
    }
    const midpoint = start.clone().lerp(end, 0.5);
    const rotation = new THREE.Quaternion().setFromUnitVectors(UNIT_X, direction);
    box(trimMatrices, midpoint.clone().add(new THREE.Vector3(0, -0.3, 0)), new THREE.Vector3(start.distanceTo(end), 0.65, width + 0.65), rotation);
    box(trimMatrices, midpoint.clone().add(new THREE.Vector3(0, GLASS_HEIGHT_M + 0.25, 0)), new THREE.Vector3(start.distanceTo(end), 0.5, width + 0.5), rotation);
    for (const towerId of [bridge.from, bridge.to]) {
      if (framedTowers.has(towerId)) continue;
      const tower = towers.find(candidate => candidate.id === towerId);
      if (!tower) continue;
      framedTowers.add(towerId);
      for (let edge = 0; edge < tower.p.length; edge += 1) {
        const a = tower.p[edge]; const b = tower.p[(edge + 1) % tower.p.length];
        for (const y of [bridge.start.y - 0.35, bridge.start.y + GLASS_HEIGHT_M + 0.25]) {
          strip(trimMatrices, new THREE.Vector3(a[0], y, -a[1]), new THREE.Vector3(b[0], y, -b[1]), 0.65, 0.9);
        }
      }
    }
  }

  const facadeGeometry = new THREE.BufferGeometry();
  facadeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  facadeGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  facadeGeometry.setAttribute('caelitusSeed', new THREE.Float32BufferAttribute(seeds, 1));
  facadeGeometry.computeVertexNormals();
  const facadeMesh = new THREE.Mesh(facadeGeometry, glass.material);
  facadeMesh.name = 'Caelitus OSM footprint curtain walls';
  const roofGeometry = new THREE.BufferGeometry();
  roofGeometry.setAttribute('position', new THREE.Float32BufferAttribute(roofs, 3));
  roofGeometry.computeVertexNormals();
  const roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
  roofMesh.name = 'Caelitus mapped roof silhouettes';
  const unitBox = new THREE.BoxGeometry();
  const batch = (name: string, matrices: readonly THREE.Matrix4[], material: THREE.MeshStandardMaterial): THREE.InstancedMesh => {
    const mesh = new THREE.InstancedMesh(unitBox, material, matrices.length);
    mesh.name = name;
    matrices.forEach((matrix, index) => mesh.setMatrixAt(index, matrix));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingBox(); mesh.computeBoundingSphere();
    return mesh;
  };
  const trimMesh = batch('Caelitus silver vertical fins and community frames', trimMatrices, trimMaterial);
  const louverMesh = batch('Caelitus rooftop louver screens', louvers, roofMaterial);
  group.add(facadeMesh, roofMesh, trimMesh, louverMesh);
  group.userData.caelitus = {
    towerIds: towers.map(tower => tower.id),
    floorCounts: towers.map(tower => tower.floors),
    bridges: bridges.map(bridge => ({ from: bridge.from, to: bridge.to, clearSpanM: bridge.clearSpanM, elevationM: bridge.start.y })),
    heightPolicy: 'OSM roof-height tags retained; published Samsung heights differ. Facade details are photo-informed, not surveyed.',
    drawCalls: 4,
    triangles: vertices.length / 9 + roofs.length / 9 + (trimMatrices.length + louvers.length) * 12,
  };
  return {
    group,
    bridges,
    setNightMix: (value: number): void => { glass.night.value = THREE.MathUtils.clamp(value, 0, 1); },
    dispose: (): void => {
      facadeGeometry.dispose(); roofGeometry.dispose(); unitBox.dispose();
      glass.material.dispose(); trimMaterial.dispose(); roofMaterial.dispose();
      trimMesh.dispose(); louverMesh.dispose(); group.clear();
    },
  };
}
