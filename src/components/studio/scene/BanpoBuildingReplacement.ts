import * as THREE from 'three';

export interface MappedBuildingFootprint {
  readonly p: readonly (readonly number[])[];
  readonly z: number;
  readonly h: number;
}

interface RemovedIndices {
  readonly geometry: THREE.BufferGeometry;
  readonly original: THREE.BufferAttribute | null;
}

function withinFootprint(east: number, north: number, ring: readonly (readonly number[])[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[j]; const b = ring[i];
    const dx = b[0] - a[0]; const dy = b[1] - a[1];
    const lengthSquared = dx * dx + dy * dy;
    const t = lengthSquared > 0 ? THREE.MathUtils.clamp(((east - a[0]) * dx + (north - a[1]) * dy) / lengthSquared, 0, 1) : 0;
    // The compressed city uses 16-bit positions; a wall centroid can lie just outside its source edge.
    if ((east - a[0] - dx * t) ** 2 + (north - a[1] - dy * t) ** 2 < 0.75 ** 2) return true;
    if ((a[1] > north) !== (b[1] > north)
      && east < (b[0] - a[0]) * (north - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}

export function replaceBanpoBuildingIndices(model: THREE.Group, buildings: readonly MappedBuildingFootprint[]) {
  const changes: RemovedIndices[] = [];
  const regions = buildings.map(building => ({
    ...building,
    west: Math.min(...building.p.map(point => point[0])) - 0.75,
    east: Math.max(...building.p.map(point => point[0])) + 0.75,
    south: Math.min(...building.p.map(point => point[1])) - 0.75,
    north: Math.max(...building.p.map(point => point[1])) + 0.75,
  }));
  const centroid = new THREE.Vector3(); const vertex = new THREE.Vector3();
  const relative = new THREE.Matrix4();
  model.updateWorldMatrix(true, true);
  const inverse = model.matrixWorld.clone().invert();
  let removedTriangles = 0;
  model.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    const name = object.name.replaceAll('_', ' ');
    if (!name.startsWith('Mapped Seoul building facades') && !name.startsWith('Mapped Seoul rooflines')
      && !name.startsWith('Lift housings')) return;
    const geometry = object.geometry;
    const position = geometry.getAttribute('position');
    const index = geometry.index;
    const count = index?.count ?? position.count;
    const retained: number[] = [];
    relative.multiplyMatrices(inverse, object.matrixWorld);
    for (let offset = 0; offset < count; offset += 3) {
      centroid.set(0, 0, 0);
      for (let corner = 0; corner < 3; corner++) {
        vertex.fromBufferAttribute(position, index ? index.getX(offset + corner) : offset + corner).applyMatrix4(relative);
        centroid.add(vertex);
      }
      centroid.multiplyScalar(1 / 3);
      const east = centroid.x; const north = -centroid.z;
      const replaced = regions.some(region => east >= region.west && east <= region.east
        && north >= region.south && north <= region.north
        && centroid.y >= region.z - 0.75 && centroid.y <= region.z + region.h + 4.5
        && withinFootprint(east, north, region.p));
      if (replaced) { removedTriangles++; continue; }
      for (let corner = 0; corner < 3; corner++) retained.push(index ? index.getX(offset + corner) : offset + corner);
    }
    if (retained.length === count) return;
    changes.push({ geometry, original: index });
    geometry.setIndex(retained);
    geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  });
  return {
    removedTriangles,
    modifiedMeshes: changes.length,
    restore: (): void => {
      for (const { geometry, original } of changes) {
        geometry.setIndex(original);
        geometry.computeBoundingBox(); geometry.computeBoundingSphere();
      }
      changes.length = 0;
    },
  };
}
