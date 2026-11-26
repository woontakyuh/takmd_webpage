import assert from 'node:assert/strict';
import { PerspectiveCamera, Vector3 } from 'three';
import { EDBM_MAGAZINE } from '../edbmArchive';
import { focusFov } from './config';
import { magazineReadingLayout } from './MagazineReadingLayout';

for (const [width, height] of [[375, 844], [768, 1024], [1280, 800], [844, 390]]) {
  for (const page of [-1, 0, 1]) {
    const pose = magazineReadingLayout(EDBM_MAGAZINE, EDBM_MAGAZINE.spreads, page, { width, height });
    const camera = new PerspectiveCamera(focusFov(null, width < 760, width, height), width / height, .01, 100);
    camera.position.copy(pose.position);
    camera.lookAt(pose.target);
    camera.updateMatrixWorld();
    for (const corner of pose.bounds) {
      const p = new Vector3(...corner).project(camera);
      assert.ok(Math.abs(p.x) < 1 && Math.abs(p.y) < 1 && p.z > -1 && p.z < 1,
        `page ${page} must fit ${width}x${height}: ${p.toArray()}`);
    }
    const depth = Math.max(...pose.bounds.map(p => p[2])) - Math.min(...pose.bounds.map(p => p[2]));
    if (page === 0) assert.ok(depth > .15, 'the contributor cover remains partly turned');
    if (page === 1) assert.ok(depth > .035 && depth < .065, 'the article retains a supported open binding');
  }
}
console.log('Physical magazine cover, partial opening and bound spread fit portrait and landscape viewports.');
