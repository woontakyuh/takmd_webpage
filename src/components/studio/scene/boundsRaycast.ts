import { Box3, Matrix4, Ray, Vector3 } from 'three';
import type { Intersection, Mesh, Object3D, Raycaster } from 'three';

// Pointer events raycast into every mesh under a group with handlers, triangle by triangle. The cabinet's bottles and
// glassware are several hundred thousand triangles, and a bottle is chosen accurately enough by its bounding box.
const inverse = new Matrix4();
const localRay = new Ray();
const point = new Vector3();

function boundsRaycast(this: Mesh, raycaster: Raycaster, intersects: Intersection[]): void {
  const geometry = this.geometry;
  if (!geometry.boundingBox) geometry.computeBoundingBox();
  const box = geometry.boundingBox as Box3 | null;
  if (!box) return;
  inverse.copy(this.matrixWorld).invert();
  localRay.copy(raycaster.ray).applyMatrix4(inverse);
  if (!localRay.intersectBox(box, point)) return;
  point.applyMatrix4(this.matrixWorld);
  const distance = raycaster.ray.origin.distanceTo(point);
  if (distance < raycaster.near || distance > raycaster.far) return;
  intersects.push({ distance, point: point.clone(), object: this });
}

// Gives every mesh under `root` the bounding-box raycast, once.
export function useBoundsRaycast(root: Object3D): void {
  root.traverse(object => {
    const mesh = object as Mesh;
    if (!mesh.isMesh || mesh.userData.boundsRaycast) return;
    mesh.raycast = boundsRaycast;
    mesh.userData.boundsRaycast = true;
  });
}
