import assert from 'node:assert/strict';
import { Box3, PerspectiveCamera, Vector3 } from 'three';
import { createWindowRegionProjector, cropExteriorCamera } from '../src/components/studio/scene/WindowRenderRegion';

const bounds = new Box3(new Vector3(-1, -.6, -.02), new Vector3(1, .6, .02));
const regionFor = createWindowRegionProjector(bounds);
for (const [width, height, offsetX, offsetY] of [[1440, 900, 0, 0], [1280, 900, 219, 0], [390, 844, 0, 202.56]]) {
  const camera = new PerspectiveCamera(42, width / height, .015, 60);
  camera.position.set(1, 1, 6); camera.lookAt(0, 0, 0); camera.updateMatrixWorld();
  if (offsetX || offsetY) camera.setViewOffset(width, height, offsetX, offsetY, width, height);
  const region = regionFor(camera, width, height);
  assert(region.width * region.height < width * height * .65, 'A distant window must render only its visible pixel area');
  const cropped = camera.clone(); cropped.far = 12000; cropped.updateProjectionMatrix();
  cropExteriorCamera(cropped, region, width, height);
  for (const x of [bounds.min.x, 0, bounds.max.x]) for (const y of [bounds.min.y, 0, bounds.max.y]) {
    const original = new Vector3(x, y, 0).project(camera);
    const local = new Vector3(x, y, 0).project(cropped);
    assert(Math.abs((original.x + 1) * width / 2 - (region.x + (local.x + 1) * region.width / 2)) < 1e-8);
    assert(Math.abs((1 - original.y) * height / 2 - (region.y + (1 - local.y) * region.height / 2)) < 1e-8);
  }
}
const crossing = new PerspectiveCamera(42, 1.6, .015, 60);
crossing.position.set(0, 0, .02); crossing.lookAt(0, 0, 0); crossing.updateMatrixWorld();
assert.deepEqual(regionFor(crossing, 1280, 800), {x:0,y:0,width:1280,height:800}, 'Near-plane crossing keeps full coverage');
console.log('Window pixel crop preserves perspective, exhibit offsets and near-window coverage.');
