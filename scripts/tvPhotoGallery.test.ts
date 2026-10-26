import assert from 'node:assert/strict';
import { test } from 'node:test';
import { talkMedia } from '../src/components/studio/collection';
import { photoPageIndex, tvPhotoPages } from '../src/components/studio/tvPhotoGallery';

const summit = talkMedia.find(media => media.id === '2c7908af25b980edbfc6df234f22a8f1');
assert(summit);

test('all eight Summit originals appear once across three composed slides', () => {
  // Given the imported, owner-selected photo collection.
  const sourcePhotos = summit.slides;
  // When the TV resolves its composite slides.
  const pages = tvPhotoPages(summit);
  // Then the three compositions retain every original and its framing metadata.
  assert.deepEqual(pages.map(page => page.photos.length), [3, 3, 2]);
  assert.deepEqual(pages.flatMap(page => page.photos.map(photo => photo.slide)), sourcePhotos);
});

test('every original source restores its containing composite slide', () => {
  // Given the shared office selection can point to any original photo.
  const pages = tvPhotoPages(summit);
  // When the resting screen and focused reader resolve that selection.
  const restored = summit.slides.map(slide => photoPageIndex(pages, slide.src));
  // Then both use the same three pages, with raw indexes for existing navigation.
  assert.deepEqual(restored, [0, 0, 0, 1, 1, 1, 2, 2]);
  assert.deepEqual(pages.map(page => page.sourceIndex), [0, 3, 6]);
});

test('composition slots fit the board and never overlap', () => {
  // Given each composite contains uncropped original photographs.
  const pages = tvPhotoPages(summit);
  // When their shared DOM/canvas rectangles are inspected.
  for (const page of pages) {
    // Then all photo frames stay within the board and separate from neighbors.
    for (const [index, photo] of page.photos.entries()) {
      const { x, y, width, height } = photo.frame;
      assert(x >= 0 && y >= 0 && x + width <= 1 && y + height <= 1);
      assert(width > 0 && height > 0);
      for (const other of page.photos.slice(index + 1)) {
        const frame = other.frame;
        assert(x + width <= frame.x || frame.x + frame.width <= x
          || y + height <= frame.y || frame.y + frame.height <= y);
      }
    }
  }
});

test('PDF decks and changed photo collections retain their original slide behavior', () => {
  // Given existing PDF decks and a future import with a changed photo inventory.
  const candidates = [...talkMedia.filter(media => media.kind === 'full'), { ...summit, slides: summit.slides.slice(1) }];
  // When they pass through the optional TV composition resolver.
  const pages = candidates.flatMap(media => tvPhotoPages(media));
  // Then no page is silently grouped or dropped by this curated arrangement.
  assert.deepEqual(pages, []);
});
