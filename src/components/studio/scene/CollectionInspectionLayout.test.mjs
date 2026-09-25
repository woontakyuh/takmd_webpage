import { describe, expect, it } from 'bun:test';
import { Box3, PerspectiveCamera, Vector3 } from 'three';
import { fitCollectionItem, positionCollectionCopy, projectCollectionBounds } from './CollectionInspectionLayout.ts';
import { collectionInspection } from './CollectionInspectionData.ts';

// Conservative mounted-frame bounds on CertificateFrames' current 2.0m shelf, including rear props.
const portrait = new Box3(new Vector3(1.816, 2, 3.109), new Vector3(2.054, 2.325, 3.203));
const landscape = new Box3(new Vector3(1.43, 2, 3.109), new Vector3(1.755, 2.239, 3.203));

function displayedLayout(bounds, placement, width, height, textHeight, obstacle) {
  const viewport = { width, height };
  const layout = fitCollectionItem(bounds, placement, viewport, textHeight, obstacle);
  const camera = new PerspectiveCamera(width < height ? 60 : 42, width / height, 0.015, 60);
  camera.position.set(...layout.position);
  camera.lookAt(...layout.target);
  camera.updateMatrixWorld();
  const object = projectCollectionBounds(bounds, camera, viewport);
  const avoided = obstacle ? projectCollectionBounds(obstacle, camera, viewport) : undefined;
  return { layout, object, avoided, copy: positionCollectionCopy(object, layout, viewport, avoided) };
}

describe('collection inspection composition', () => {
  for (const [width, height] of [[2560, 720], [1920, 960], [1280, 720], [768, 1024], [390, 844], [375, 667], [844, 390]]) {
    it(`Given a ${width} × ${height} display, when the credential group opens, then all three complete frames fit vertically and horizontally`, () => {
      // Given the current physical shelf positions and the collection's runtime field of view.
      const viewport = { width, height };
      const allFrames = portrait.clone().union(landscape).union(new Box3(new Vector3(2.106, 2, 3.109), new Vector3(2.344, 2.325, 3.203)));
      const pose = collectionInspection('credentials', width, height);
      const camera = new PerspectiveCamera(width < height ? 60 : 42, width / height, .015, 60);
      // When the collection pose projects all three frames, including their depth.
      camera.position.set(...pose.position); camera.lookAt(...pose.target); camera.updateMatrixWorld();
      const projected = projectCollectionBounds(allFrames, camera, viewport);
      // Then all frames clear the viewport edges and inspection controls.
      expect(projected.left).toBeGreaterThan(16);
      expect(projected.right).toBeLessThan(width - 16);
      expect(projected.top).toBeGreaterThan(64);
      expect(projected.bottom).toBeLessThan(height - 64);
    });
  }

  for (const [width, height] of [[1920, 960], [1280, 720], [768, 1024], [390, 844], [375, 667], [844, 390]]) {
    for (const [placement, bounds, obstacle] of [['left', portrait], ['upper-right', portrait, landscape], ['right', landscape], ['bottom', portrait]]) {
      it(`Given ${placement} copy at ${width} × ${height}, when focused, then the complete object and readable copy fit without overlapping`, () => {
        // Given realistic frame bounds and a long measured caption.
        const textHeight = 260;
        // When the resulting camera projects the real three-dimensional bounds.
        const { layout, object, copy } = displayedLayout(bounds, placement, width, height, textHeight, obstacle);
        // Then the frame is complete and the copy stays inside the viewport beside it.
        expect(object.left).toBeGreaterThanOrEqual(15);
        expect(object.right).toBeLessThanOrEqual(width - 15);
        expect(object.top).toBeGreaterThanOrEqual(63);
        expect(object.bottom).toBeLessThanOrEqual(height - 63);
        expect(copy.left).toBeGreaterThanOrEqual(15);
        expect(copy.left + layout.copyWidth).toBeLessThanOrEqual(width - 15);
        expect(copy.top).toBeGreaterThanOrEqual(15);
        expect(copy.top + layout.copyHeight).toBeLessThanOrEqual(height - 63);
        expect(copy.left + layout.copyWidth <= object.left || copy.left >= object.right
          || copy.top >= object.bottom || copy.top + layout.copyHeight <= object.top).toBe(true);
        expect(layout.copyHeight).toBeGreaterThanOrEqual(96);
      });
    }
  }

  it('Given the SNU diploma on desktop, when focused, then copy sits near its upper right and above the adjacent landscape frame', () => {
    // Given the diploma and the neighboring KOMISS frame.
    const width = 1920, height = 960;
    // When the focused scene is projected.
    const { object, avoided, copy, layout } = displayedLayout(portrait, 'upper-right', width, height, 260, landscape);
    // Then the title occupies the open space the user selected, leaving both frames exposed.
    expect(copy.left - object.right).toBeGreaterThanOrEqual(16);
    expect(copy.left - object.right).toBeLessThanOrEqual(32);
    expect(copy.top).toBeLessThan(object.top);
    expect(copy.top + layout.copyHeight).toBeLessThanOrEqual(avoided.top - 16);
  });

  it('Given a wide viewport, when side copy is placed, then its gap follows the frame rather than the viewport edge', () => {
    // Given extra horizontal room.
    const width = 2560, height = 1080;
    // When a left caption is composed.
    const { object, copy, layout } = displayedLayout(portrait, 'left', width, height, 210);
    // Then the caption is beside the physical frame with substantial outer breathing room.
    expect(object.left - copy.left - layout.copyWidth).toBeGreaterThanOrEqual(16);
    expect(object.left - copy.left - layout.copyWidth).toBeLessThanOrEqual(32);
    expect(copy.left).toBeGreaterThan(width * .2);
  });

  for (const [placement, width] of [['left', .216], ['bottom', .14], ['right', .134]]) {
    it(`Given a ${placement} award plaque, when focused, then the entire narrow plaque fits beside its caption`, () => {
      const plaque = new Box3(new Vector3(-width / 2, 1.3, 3.08), new Vector3(width / 2, 1.61, 3.16));
      const { object, copy, layout } = displayedLayout(plaque, placement, 1280, 720, 240);
      expect(object.top).toBeGreaterThanOrEqual(64);
      expect(object.bottom).toBeLessThanOrEqual(656);
      expect(copy.left + layout.copyWidth <= object.left || copy.left >= object.right || copy.top >= object.bottom).toBe(true);
    });
  }
});
