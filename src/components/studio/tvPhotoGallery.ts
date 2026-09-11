import type { TalkMedia, TalkSlide } from './types';

export const TV_PHOTO_BOARD = { width: 1200, height: 800, mat: 24, gap: 16, paper: '#F8F6F0' } as const;

type PhotoFrame = { readonly x: number; readonly y: number; readonly width: number; readonly height: number };
export type TvPhoto = { readonly slide: TalkSlide; readonly sourceIndex: number; readonly frame: PhotoFrame };
export type TvPhotoPage = {
  readonly sourceIndex: number;
  readonly caption: string;
  readonly photos: readonly TvPhoto[];
};

const SUMMIT_PAGES = [
  { caption: 'Faculty teaching and course discussion', slots: [
    { index: 0, x: 64, y: 24, width: 492, height: 368 },
    { index: 1, x: 64, y: 408, width: 492, height: 368 },
    { index: 2, x: 572, y: 24, width: 564, height: 752 },
  ] },
  { caption: 'Hands-on endoscopic spine instruction', slots: [
    { index: 3, x: 24, y: 118, width: 752, height: 564 },
    { index: 4, x: 792, y: 104, width: 384, height: 288 },
    { index: 5, x: 792, y: 408, width: 384, height: 288 },
  ] },
  { caption: 'Participant practice · Special Course 4: The Endoscopic Spine', slots: [
    { index: 6, x: 24, y: 187, width: 568, height: 426 },
    { index: 7, x: 608, y: 187, width: 568, height: 426 },
  ] },
] as const;

export function tvPhotoPages(media: TalkMedia | undefined): readonly TvPhotoPage[] {
  if (media?.kind !== 'photos' || media.id !== '2c7908af25b980edbfc6df234f22a8f1' || media.slides.length !== 8) return [];
  return SUMMIT_PAGES.map(page => ({
    sourceIndex: page.slots[0].index,
    caption: page.caption,
    photos: page.slots.flatMap(slot => {
      const slide = media.slides[slot.index];
      return slide ? [{ slide, sourceIndex: slot.index, frame: {
        x: slot.x / TV_PHOTO_BOARD.width, y: slot.y / TV_PHOTO_BOARD.height,
        width: slot.width / TV_PHOTO_BOARD.width, height: slot.height / TV_PHOTO_BOARD.height,
      } }] : [];
    }),
  }));
}

export function photoPageIndex(pages: readonly TvPhotoPage[], source: string | undefined | null): number {
  return Math.max(0, pages.findIndex(page => page.photos.some(photo => photo.slide.src === source)));
}

export function containPhoto(width: number, height: number, frame: PhotoFrame): PhotoFrame {
  const scale = Math.min(frame.width / width, frame.height / height);
  const fittedWidth = width * scale, fittedHeight = height * scale;
  return { x: frame.x + (frame.width - fittedWidth) / 2, y: frame.y + (frame.height - fittedHeight) / 2,
    width: fittedWidth, height: fittedHeight };
}
