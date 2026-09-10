import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import records from '../src/data/studio-talk-media.json';
import { publicHighResolutionSlide } from '../src/components/studio/publicSlideSource';

const protectedSources = [
  '/studio/talks/full/33a908af25b980849210fec32e7391fd/1b419e9869a0/page-0012.webp',
  '/studio/talks/full/18f908af25b980fdbc6dfa5830dc13bc/c87886495e28/page-0014.webp',
  '/studio/talks/full/1ec908af25b98051904fe502642a6389/4bf88662fdae/page-0011.webp',
  '/studio/talks/full/255908af25b9803990dac9fda2be6d71/73a8e9157c27/page-0021.webp',
  '/studio/talks/full/375908af25b9809bace8c400da57f817/4cacc0225e1b/page-0014.webp',
  '/studio/talks/full/375908af25b9809bace8c400da57f817/4cacc0225e1b/page-0022.webp',
  '/studio/talks/full/37b908af25b980e2bcaaf32b9487ba87/20a38f2b3f9d/page-0005.webp',
  '/studio/talks/full/37b908af25b980e2bcaaf32b9487ba87/20a38f2b3f9d/page-0011.webp',
] as const;

test('every manifest slide resolves to an existing public image', () => {
  const slides = records.flatMap(record => record.slides);
  for (const slide of slides) {
    const source = publicHighResolutionSlide(slide) ?? slide.src;
    assert(existsSync(fileURLToPath(new URL(`../public${source}`, import.meta.url))), source);
  }
});

test('protected pages always retain their approved standard source without HD', () => {
  const slides = records.flatMap(record => record.slides);
  for (const source of protectedSources) {
    const slide = slides.find(candidate => candidate.src === source);
    assert(slide, `Protected source missing from manifest: ${source}`);
    const selected = publicHighResolutionSlide(slide);
    assert.equal(selected, undefined, source);
    assert(existsSync(fileURLToPath(new URL(`../public${source}`, import.meta.url))), source);
    assert(!existsSync(fileURLToPath(new URL(`../public${source.replace('.webp', '.hd.webp')}`, import.meta.url))), source);
  }
});

test('every unprotected complete-deck page retains its available HD image', () => {
  const protectedSet: ReadonlySet<string> = new Set(protectedSources);
  const slides = records.filter(record => record.kind === 'full').flatMap(record => record.slides);
  for (const slide of slides.filter(candidate => !protectedSet.has(candidate.src))) {
    const source = publicHighResolutionSlide(slide);
    assert.equal(source, slide.src.replace('.webp', '.hd.webp'));
    assert(existsSync(fileURLToPath(new URL(`../public${source}`, import.meta.url))), source);
  }
});

test('photo collections use their original public image instead of an invented HD path', () => {
  const photos = records.filter(record => record.kind === 'photos').flatMap(record => record.slides);
  assert(photos.length > 0);
  for (const photo of photos) assert.equal(publicHighResolutionSlide(photo), undefined, photo.src);
});
