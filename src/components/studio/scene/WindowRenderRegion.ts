import { Box3, PerspectiveCamera, Vector3 } from 'three';

export type WindowRenderRegion = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

export function createWindowRegionProjector(bounds: Box3) {
  const corners = [bounds.min.x, bounds.max.x].flatMap(x =>
    [bounds.min.y, bounds.max.y].flatMap(y => [bounds.min.z, bounds.max.z].map(z => new Vector3(x, y, z))));
  const point = new Vector3();
  return (camera: PerspectiveCamera, width: number, height: number): WindowRenderRegion => {
    let left = width, right = 0, top = height, bottom = 0;
    for (const corner of corners) {
      if (point.copy(corner).applyMatrix4(camera.matrixWorldInverse).z >= -camera.near) {
        return { x: 0, y: 0, width, height };
      }
      point.copy(corner).project(camera);
      const x = (point.x + 1) * width / 2;
      const y = (1 - point.y) * height / 2;
      left = Math.min(left, x); right = Math.max(right, x);
      top = Math.min(top, y); bottom = Math.max(bottom, y);
    }
    const tile = 64;
    const x = Math.max(0, Math.min(width - 1, Math.floor((left - 2) / tile) * tile));
    const y = Math.max(0, Math.min(height - 1, Math.floor((top - 2) / tile) * tile));
    return { x, y, width: Math.max(1, Math.min(width, Math.ceil((right + 2) / tile) * tile) - x),
      height: Math.max(1, Math.min(height, Math.ceil((bottom + 2) / tile) * tile) - y) };
  };
}

export function cropExteriorCamera(camera: PerspectiveCamera, region: WindowRenderRegion, width: number, height: number) {
  const view = camera.view?.enabled ? { ...camera.view } : {
    fullWidth: width, fullHeight: height, offsetX: 0, offsetY: 0, width, height,
  };
  camera.setViewOffset(view.fullWidth, view.fullHeight,
    view.offsetX + region.x / width * view.width,
    view.offsetY + region.y / height * view.height,
    region.width / width * view.width, region.height / height * view.height);
}
