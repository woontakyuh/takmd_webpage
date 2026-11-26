import * as THREE from 'three';
import { BANPO_APPEARANCE } from './BanpoAppearance';

export interface UrbanBuilding {
  readonly id: number;
  readonly p: readonly (readonly number[])[];
  readonly z: number;
  readonly h: number;
  readonly measured: boolean;
  readonly area: number;
}

export function createBanpoUrbanFabric(buildings: readonly UrbanBuilding[]) {
  const group = new THREE.Group();
  group.name = 'Sourced north-bank low-rise neighborhoods';
  const walls: number[] = []; const wallUv: number[] = []; const roofs: number[] = [];
  for (const building of buildings) {
    const roofY = building.z + building.h;
    for (let index = 0; index < building.p.length; index++) {
      const a = building.p[index]; const b = building.p[(index + 1) % building.p.length];
      const width = Math.hypot(a[0] - b[0], a[1] - b[1]) / 14; const height = building.h / 12.2;
      walls.push(a[0], building.z, -a[1], b[0], building.z, -b[1], b[0], roofY, -b[1],
        a[0], building.z, -a[1], b[0], roofY, -b[1], a[0], roofY, -a[1]);
      wallUv.push(0, 0, width, 0, width, height, 0, 0, width, height, 0, height);
    }
    const outline = building.p.map(p => new THREE.Vector2(p[0], -p[1]));
    for (const face of THREE.ShapeUtils.triangulateShape(outline, [])) {
      for (const index of [face[2], face[1], face[0]]) roofs.push(outline[index].x, roofY, outline[index].y);
    }
  }
  const wallGeometry = new THREE.BufferGeometry();
  wallGeometry.setAttribute('position', new THREE.Float32BufferAttribute(walls, 3));
  wallGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(wallUv, 2));
  wallGeometry.computeVertexNormals();
  const roofGeometry = new THREE.BufferGeometry();
  roofGeometry.setAttribute('position', new THREE.Float32BufferAttribute(roofs, 3));
  roofGeometry.computeVertexNormals();
  const wallMaterial = new THREE.MeshStandardMaterial({ name: 'North bank low-rise facade', ...BANPO_APPEARANCE.urbanFabric.wall, side: THREE.DoubleSide });
  const roofMaterial = new THREE.MeshStandardMaterial({ name: 'Low-rise mineral roofs', ...BANPO_APPEARANCE.urbanFabric.roof, side: THREE.DoubleSide });
  const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial); wallMesh.name = 'Merged mapped low-rise walls';
  const roofMesh = new THREE.Mesh(roofGeometry, roofMaterial); roofMesh.name = 'Merged mapped low-rise roofs';
  group.add(wallMesh, roofMesh);
  return { group, wallMaterial, dispose: (): void => {
    group.removeFromParent(); wallGeometry.dispose(); roofGeometry.dispose(); wallMaterial.dispose(); roofMaterial.dispose(); group.clear();
  } };
}
