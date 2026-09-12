import assert from 'node:assert/strict';
import { talkMedia } from '../collection';
import { EDBM_PHOTOS } from '../edbmArchive';
import { WHISKY_LECTURE } from './WhiskyLectureLayout';
import { whiskyLecturePages } from './whiskyLecturePages';

const original = talkMedia.find(talk => talk.id === WHISKY_LECTURE.id)?.slides;
assert.ok(original && original.length === 26);
assert.equal(whiskyLecturePages.length, 28);
assert.equal(whiskyLecturePages[0], original[0]);
assert.deepEqual(whiskyLecturePages.slice(1, 3).map(page => [page.src, page.photoAspect]),
  EDBM_PHOTOS.map(photo => [photo.src, photo.aspect]));
assert.deepEqual(whiskyLecturePages.slice(3), original.slice(1));
assert.equal(original.some(slide => EDBM_PHOTOS.some(photo => photo.src === slide.src)), false,
  'the TV lecture must not inherit cabinet-only photographs');
console.log('PASS cover-first photo insertion and unchanged 26-slide TV source');
