import * as THREE from 'three';
import data from '../../../../public/models/han-river/park.json';
import { BANPO_APPEARANCE } from './BanpoAppearance';
import { PARK_KINDS } from './BanpoParkData';
import type { ParkFeature, ParkKind, ParkPoint } from './BanpoParkData';
import { appendParkPolygon, appendParkRibbon, appendParkSides, parkBuffer, parkElevation } from './BanpoParkGeometry';
import { appendParkFacilities } from './BanpoParkFacilities';
import { appendParkLandmarks, PARK_LANDMARK_REFERENCE } from './BanpoParkLandmarks';

export const BANPO_PARK_FEATURES: readonly ParkFeature[] = data.features.flatMap(feature => {
  const kind = PARK_KINDS.find(kind => kind === feature.kind);
  if (!kind) return [];
  return [{ ...feature, kind, p: feature.p.map((p): ParkPoint => [p[0], p[1]]),
    widthSource: feature.widthSource === 'osm' ? 'osm' : 'class-estimate' }];
});
const palette = BANPO_APPEARANCE.park;
const COLORS: Record<ParkKind, number> = {
  ground: palette.grass, island: palette.meadow, lawn: palette.grass, woodland: palette.foliage,
  walk: palette.paving, cycle: palette.asphalt, service: palette.asphalt, bridge: palette.stone,
  parking: palette.asphalt, stall: palette.marking, court: palette.court,
  stage: palette.stone, fountain: palette.marking, pier: palette.stone, building: palette.stone,
};

const SURFACE_OFFSET: Record<ParkKind, number> = {
  ground: 0, island: 0, lawn: .03, woodland: .04, walk: .22, cycle: .28,
  service: .34, parking: .14, stall: .4, court: .18, stage: .24,
  fountain: .4, pier: 0, bridge: .25, building: .18,
};

export function createBanpoPark() {
  const group = new THREE.Group(); group.name = 'Mapped Banpo park and Seoraeseom';
  const buckets = new Map<number, number[]>();
  const batch = (color: number): number[] => {
    const existing = buckets.get(color); if (existing) return existing;
    const positions: number[] = []; buckets.set(color, positions); return positions;
  };
  for (const feature of BANPO_PARK_FEATURES) {
    const positions = batch(COLORS[feature.kind]);
    const land = feature.kind === 'ground' || feature.kind === 'island';
    const floating = feature.kind === 'pier';
    const bridge = feature.kind === 'bridge';
    const height = (p: ParkPoint): number => floating ? 7.5 : parkElevation(p) + SURFACE_OFFSET[feature.kind];
    if (bridge) {
      const start = feature.p[0]; const end = feature.p[feature.p.length - 1];
      const length = Math.hypot(end[0] - start[0], end[1] - start[1]);
      const deck = (p: ParkPoint): number => parkElevation(p) + .25 + 1.5 * Math.sin(Math.PI * Math.min(1,
        Math.hypot(p[0] - start[0], p[1] - start[1]) / length));
      appendParkRibbon(positions, feature.p, { width: 4.5, height: deck });
      appendParkFacilities(batch, feature, deck);
    } else if (feature.area) {
      appendParkPolygon(positions, feature.p, height);
      if (land || floating) appendParkSides(batch(palette.stone), feature.p, { top: height, bottom: () => 1.8 });
      appendParkFacilities(batch, feature, height);
    } else {
      appendParkRibbon(positions, feature.p, { width: feature.widthM, height });
    }
  }
  appendParkLandmarks(batch);
  const meshes: THREE.Mesh[] = [];
  for (const [color, positions] of buckets) {
    if (!positions.length) continue;
    const geometry = parkBuffer(positions);
    const material = new THREE.MeshStandardMaterial({ color, roughness: palette.roughness, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `Banpo park material ${color.toString(16)}`;
    group.add(mesh); meshes.push(mesh);
  }
  group.userData = { source: data.sourceURL, sourceSha256: data.sourceSha256,
    features: BANPO_PARK_FEATURES.length, bridges: 3, courtPolygons: 2,
    stagePoint: data.stagePoint, estimatedElevations: true, landmarkReference: PARK_LANDMARK_REFERENCE,
    triangles: meshes.reduce((sum, m) => sum + m.geometry.getAttribute('position').count / 3, 0), batches: meshes.length };
  return { group, dispose: (): void => {
    group.removeFromParent();
    meshes.forEach(mesh => { mesh.geometry.dispose(); if (mesh.material instanceof THREE.Material) mesh.material.dispose(); });
    group.clear();
  } };
}
