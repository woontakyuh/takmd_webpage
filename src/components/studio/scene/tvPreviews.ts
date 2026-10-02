import { talkMedia } from '../collection';
import type { Presentation } from '../types';

export type TvPreview = {
  readonly src: string;
  readonly caption: string;
  readonly active: boolean;
  readonly talkId: string;
  readonly slideIndex: number;
};

export function tvPreviews(cover: string | null, talk: Presentation | null, presentations: readonly Presentation[]) {
  const deck = talkMedia.find(media => media.id === talk?.id);
  const multiple = (deck?.slides.length ?? 0) > 1;
  const photos = deck?.kind === 'photos';
  const current = Math.max(0, deck?.slides.findIndex(slide => slide.src === cover) ?? 0);
  const start = Math.max(0, Math.min(current - 1, (deck?.slides.length ?? 0) - 3));
  const previews: readonly TvPreview[] = multiple && deck
    ? deck.slides.slice(start, start + 3).map((slide, offset) => ({
      src: slide.thumbnail ?? slide.src, caption: `${photos ? 'Photo' : 'Slide'} ${start + offset + 1}`,
      active: start + offset === current, talkId: deck.id, slideIndex: start + offset,
    }))
    : presentations.filter(item => item.id !== talk?.id && talkMedia.some(media => media.id === item.id))
      .toSorted((a, b) => b.date.localeCompare(a.date)).slice(0, 3).flatMap(item => {
        const slide = talkMedia.find(media => media.id === item.id)?.slides[0];
        return slide ? [{ src: slide.thumbnail ?? slide.src, caption: `${item.date} · ${item.title}`, active: false, talkId: item.id, slideIndex: 0 }] : [];
      });
  return { previews, current, count: deck?.slides.length ?? 0,
    heading: multiple ? `${photos ? 'PHOTOS' : 'SLIDES'}  ${current + 1} / ${deck?.slides.length}` : 'MORE EVENTS' };
}
