import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

type BridgeKind = 'arch' | 'beam' | 'truss';

interface BridgeDefinition {
  readonly name: string;
  readonly kind: BridgeKind;
  readonly start: readonly [number, number, number];
  readonly end: readonly [number, number, number];
  readonly width: number;
  readonly lanes: number;
  readonly piers: number;
  readonly steel: number;
  readonly nightLight: readonly [number, number, number];
  readonly structureGlow: readonly [number, number, number] | null;
}

interface TrafficTrack {
  readonly bodies: THREE.InstancedMesh;
  readonly lights: THREE.InstancedMesh;
  readonly length: number;
  readonly lateralOffsets: readonly number[];
  readonly directions: readonly number[];
}

interface NightLight {
  readonly material: THREE.MeshBasicMaterial;
  readonly color: readonly [number, number, number];
  readonly maxOpacity: number;
}

interface NightStructure {
  readonly material: THREE.MeshStandardMaterial;
  readonly maxIntensity: number;
}

const BRIDGES = [
  { name: 'Dongjak Bridge', kind: 'arch', start: [-1019.9, 24, 445.3], end: [-789.4, 24, -484.2], width: 36, lanes: 6, piers: 14, steel: 0x3f718e, nightLight: [4.2, 3.4, 2.2], structureGlow: [0.12, 0.36, 0.58] },
  { name: 'Hannam Bridge', kind: 'beam', start: [2190.5, 25, -1467.9], end: [1617.2, 25, -2236.8], width: 51.2, lanes: 12, piers: 27, steel: 0x7f8584, nightLight: [4.4, 2.6, 1.1], structureGlow: null },
  { name: 'Dongho Bridge', kind: 'truss', start: [2923, 26, -2298.1], end: [2306.9, 26, -3412.7], width: 35, lanes: 4, piers: 16, steel: 0xb56842, nightLight: [4.5, 2.4, 1.1], structureGlow: [0.58, 0.20, 0.08] },
] as const satisfies readonly BridgeDefinition[];

class BridgeGeometryError extends Error {
  constructor(readonly bridgeName: string) {
    super(`Could not merge geometry for ${bridgeName}.`);
    this.name = 'BridgeGeometryError';
  }
}

function merged(name: string, parts: readonly THREE.BufferGeometry[]): THREE.BufferGeometry {
  const geometry = mergeGeometries(parts.slice());
  parts.forEach(part => part.dispose());
  if (!geometry) throw new BridgeGeometryError(name);
  return geometry;
}

function rod(start: THREE.Vector3, end: THREE.Vector3, radius: number): THREE.BufferGeometry {
  const delta = end.clone().sub(start);
  const geometry = new THREE.CylinderGeometry(radius, radius, delta.length(), 5);
  geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()));
  geometry.translate(...start.clone().add(end).multiplyScalar(0.5).toArray());
  return geometry;
}

function createStructure(definition: BridgeDefinition, length: number, material: THREE.MeshStandardMaterial): THREE.Group {
  const structure = new THREE.Group();
  const structureLabel = definition.kind === 'arch' ? 'blue arch' : definition.kind === 'beam' ? 'wide beam' : 'orange truss';
  structure.name = `${definition.name} ${structureLabel}`;

  const pierGeometry = new THREE.CylinderGeometry(2.4, 3.6, 24, 8);
  const piers = new THREE.InstancedMesh(pierGeometry, material, definition.piers);
  const pierMatrix = new THREE.Matrix4();
  for (let index = 0; index < definition.piers; index += 1) {
    const progress = (index + 0.5) / definition.piers;
    pierMatrix.makeTranslation(0, -13, (progress - 0.5) * length);
    piers.setMatrixAt(index, pierMatrix);
  }
  piers.name = `${definition.name} sourced pier rhythm`;
  structure.add(piers);

  if (definition.kind === 'beam') {
    const girderGeometry = new THREE.BoxGeometry(2.1, 3.2, length);
    const girders = new THREE.InstancedMesh(girderGeometry, material, 6);
    for (let index = 0; index < 6; index += 1) {
      pierMatrix.makeTranslation(THREE.MathUtils.lerp(-definition.width * 0.42, definition.width * 0.42, index / 5), -2.5, 0);
      girders.setMatrixAt(index, pierMatrix);
    }
    girders.name = `${definition.name} six plate girders`;
    structure.add(girders);
    return structure;
  }

  const steelParts: THREE.BufferGeometry[] = [];
  if (definition.kind === 'arch') {
    const spans = 4;
    const spanLength = length / spans;
    for (const side of [-1, 1]) {
      for (let span = 0; span < spans; span += 1) {
        const startZ = -length / 2 + span * spanLength;
        const curve = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(side * definition.width * 0.46, 1.5, startZ),
          new THREE.Vector3(side * definition.width * 0.46, 22, startZ + spanLength / 2),
          new THREE.Vector3(side * definition.width * 0.46, 1.5, startZ + spanLength),
        );
        steelParts.push(new THREE.TubeGeometry(curve, 12, 1.05, 5, false));
        for (let hanger = 1; hanger < 6; hanger += 1) {
          const point = curve.getPoint(hanger / 6);
          steelParts.push(rod(new THREE.Vector3(point.x, 1, point.z), point, 0.42));
        }
      }
    }
  } else {
    const bays = 16;
    const bayLength = length / bays;
    for (const side of [-1, 1]) {
      for (let bay = 0; bay < bays; bay += 1) {
        const z0 = -length / 2 + bay * bayLength;
        const z1 = z0 + bayLength;
        const bottom0 = new THREE.Vector3(side * definition.width * 0.46, 1, z0);
        const bottom1 = new THREE.Vector3(side * definition.width * 0.46, 1, z1);
        const top0 = new THREE.Vector3(side * definition.width * 0.46, 15, z0);
        const top1 = new THREE.Vector3(side * definition.width * 0.46, 15, z1);
        steelParts.push(rod(top0, top1, 0.68), rod(bottom0, top0, 0.58), rod(bay % 2 === 0 ? bottom0 : top0, bay % 2 === 0 ? top1 : bottom1, 0.52));
      }
    }
  }
  const steelwork = new THREE.Mesh(merged(definition.name, steelParts), material);
  steelwork.name = `${definition.name} colored steelwork`;
  structure.add(steelwork);
  return structure;
}

function createTraffic(definition: BridgeDefinition, length: number, nightLights: NightLight[]): TrafficTrack {
  const count = definition.kind === 'beam' ? 28 : 20;
  const laneCount = Math.min(definition.lanes, 6);
  const carriagewayLanes = laneCount / 2;
  const railClearance = definition.kind === 'beam' ? 0 : 5.4;
  const lateralOffsets = Array.from({ length: laneCount }, (_, lane) => {
    const carriagewayLane = lane < carriagewayLanes ? lane : lane - carriagewayLanes;
    const distanceFromCentre = railClearance + (carriagewayLane + 0.5) * 3.3;
    return lane < carriagewayLanes ? -distanceFromCentre : distanceFromCentre;
  });
  const directions = Array.from({ length: laneCount }, (_, lane) => lane < carriagewayLanes ? 1 : -1);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xaeb2af, roughness: 0.5, metalness: 0.12 });
  const lightMaterial = new THREE.MeshBasicMaterial({ color: 0xffd7a0, transparent: true, opacity: 0, depthWrite: false });
  nightLights.push({ material: lightMaterial, color: definition.nightLight, maxOpacity: 0.8 });
  const bodies = new THREE.InstancedMesh(new THREE.BoxGeometry(1.8, 0.75, 4.2), bodyMaterial, count);
  const lights = new THREE.InstancedMesh(new THREE.BoxGeometry(1.15, 0.26, 0.16), lightMaterial, count);
  bodies.name = `${definition.name} traffic bodies`;
  lights.name = `${definition.name} traffic lights`;
  return { bodies, lights, length, lateralOffsets, directions };
}

export function createBanpoBridges() {
  const group = new THREE.Group();
  group.name = 'Geographically sourced adjacent Han River bridges';
  const nightLights: NightLight[] = [];
  const nightStructures: NightStructure[] = [];
  const trafficTracks: TrafficTrack[] = [];

  BRIDGES.forEach(definition => {
    const start = new THREE.Vector3(...definition.start);
    const end = new THREE.Vector3(...definition.end);
    const length = start.distanceTo(end);
    const bridge = new THREE.Group();
    bridge.name = definition.name;
    bridge.position.copy(start).lerp(end, 0.5);
    bridge.rotation.y = Math.atan2(end.x - start.x, end.z - start.z);

    const concrete = new THREE.MeshStandardMaterial({ color: 0x9ea3a0, roughness: 0.82, metalness: 0.05 });
    const steel = new THREE.MeshStandardMaterial({ color: definition.steel, roughness: 0.58, metalness: 0.42 });
    if (definition.structureGlow) {
      steel.emissive.setRGB(definition.structureGlow[0], definition.structureGlow[1], definition.structureGlow[2]);
      steel.emissiveIntensity = 0;
      nightStructures.push({ material: steel, maxIntensity: 0.48 });
    }
    const asphalt = new THREE.MeshStandardMaterial({ color: 0x343a3c, roughness: 0.93 });
    const high = new THREE.Group();
    high.add(new THREE.Mesh(new THREE.BoxGeometry(definition.width, 2.2, length), asphalt));
    high.add(createStructure(definition, length, definition.kind === 'beam' ? concrete : steel));
    const lampMatrix = new THREE.Matrix4();

    if (definition.kind !== 'beam') {
      const railBed = new THREE.Mesh(new THREE.BoxGeometry(7, 0.8, length), concrete);
      railBed.position.y = 1.45;
      high.add(railBed);
      const rails = new THREE.InstancedMesh(new THREE.BoxGeometry(0.18, 0.16, length), steel, 2);
      lampMatrix.makeTranslation(-1.45, 1.95, 0);
      rails.setMatrixAt(0, lampMatrix);
      lampMatrix.makeTranslation(1.45, 1.95, 0);
      rails.setMatrixAt(1, lampMatrix);
      rails.name = `${definition.name} central railway rails`;
      high.add(rails);
    }

    const lampMaterial = new THREE.MeshBasicMaterial({ color: 0xffd7a0, transparent: true, opacity: 0, depthWrite: false });
    const lamps = new THREE.InstancedMesh(new THREE.SphereGeometry(0.68, 6, 4), lampMaterial, 32);
    lamps.name = `${definition.name} roadway lights`;
    for (let index = 0; index < 32; index += 1) {
      lampMatrix.makeTranslation(index % 2 === 0 ? -definition.width * 0.46 : definition.width * 0.46, 3.5, (index / 31 - 0.5) * length);
      lamps.setMatrixAt(index, lampMatrix);
    }
    nightLights.push({ material: lampMaterial, color: definition.nightLight, maxOpacity: 1 });
    high.add(lamps);

    const traffic = createTraffic(definition, length, nightLights);
    high.add(traffic.bodies, traffic.lights);
    trafficTracks.push(traffic);

    const low = new THREE.Mesh(new THREE.BoxGeometry(definition.width, 2.5, length), steel);
    low.name = `${definition.name} distant silhouette`;
    const lod = new THREE.LOD();
    lod.addLevel(high, 0);
    lod.addLevel(low, 6000);
    bridge.add(lod);
    group.add(bridge);
  });

  const setTime = (seconds: number): void => {
    trafficTracks.forEach((track, trackIndex) => {
      const matrix = new THREE.Matrix4();
      const quaternion = new THREE.Quaternion();
      const scale = new THREE.Vector3(1, 1, 1);
      for (let index = 0; index < track.bodies.count; index += 1) {
        const lane = index % track.lateralOffsets.length;
        const direction = track.directions[lane] ?? 1;
        const progress = (index / track.bodies.count + seconds * (0.006 + trackIndex * 0.001)) % 1;
        const z = (progress - 0.5) * track.length * direction;
        const x = track.lateralOffsets[lane] ?? 0;
        quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), direction < 0 ? Math.PI : 0);
        matrix.compose(new THREE.Vector3(x, 2.2, z), quaternion, scale);
        track.bodies.setMatrixAt(index, matrix);
        matrix.compose(new THREE.Vector3(x, 2.25, z + direction * 2.18), quaternion, scale);
        track.lights.setMatrixAt(index, matrix);
      }
      track.bodies.instanceMatrix.needsUpdate = true;
      track.lights.instanceMatrix.needsUpdate = true;
    });
  };
  setTime(0);

  return {
    group,
    setNightMix: (value: number): void => {
      const mix = THREE.MathUtils.clamp(value, 0, 1);
      nightLights.forEach(({ material, color, maxOpacity }) => {
        material.opacity = maxOpacity * mix;
        material.color.setRGB(
          THREE.MathUtils.lerp(0.6, color[0], mix),
          THREE.MathUtils.lerp(0.5, color[1], mix),
          THREE.MathUtils.lerp(0.35, color[2], mix),
        );
      });
      nightStructures.forEach(({ material, maxIntensity }) => { material.emissiveIntensity = maxIntensity * mix; });
    },
    setTime,
    dispose: (): void => {
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      group.traverse(object => {
        if (!(object instanceof THREE.Mesh)) return;
        geometries.add(object.geometry);
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
        if (object instanceof THREE.InstancedMesh) object.dispose();
      });
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(material => material.dispose());
      group.clear();
    },
  };
}
