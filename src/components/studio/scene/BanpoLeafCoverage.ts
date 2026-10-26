import * as THREE from 'three';

export function preserveDistantLeafCoverage(geometry: THREE.BufferGeometry, scale: number): void {
  const index = geometry.index; const positions = geometry.getAttribute('position');
  if (!index) return;
  const parents = Array.from({ length: positions.count }, (_, i) => i);
  const root = (vertex: number): number => {
    while (parents[vertex] !== vertex) { parents[vertex] = parents[parents[vertex]]; vertex = parents[vertex]; }
    return vertex;
  };
  for (let i = 0; i < index.count; i += 3) {
    const a = root(index.getX(i));
    parents[root(index.getX(i + 1))] = a; parents[root(index.getX(i + 2))] = a;
  }
  const groups = new Map<number, number[]>();
  for (let i = 0; i < positions.count; i++) {
    const id = root(i); const group = groups.get(id);
    if (group) group.push(i); else groups.set(id, [i]);
  }
  const center = new THREE.Vector3(); const vertex = new THREE.Vector3();
  for (const group of groups.values()) {
    center.set(0, 0, 0);
    group.forEach(i => center.add(vertex.fromBufferAttribute(positions, i)));
    center.divideScalar(group.length);
    for (const i of group) {
      vertex.fromBufferAttribute(positions, i).sub(center).multiplyScalar(scale).add(center);
      positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
  }
  positions.needsUpdate = true;
  geometry.computeBoundingBox(); geometry.computeBoundingSphere();
}
