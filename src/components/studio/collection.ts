import paperRecords from '../../data/studio-paper-media.json';
import talkRecords from '../../data/studio-talk-media.json';
import type { PaperMedia, Presentation, Publication, TalkMedia } from './types';

export const paperMedia: readonly PaperMedia[] = paperRecords;
export const talkMedia: readonly TalkMedia[] = talkRecords;
export const FEATURED_DOI = '10.3390/bioengineering10121363';
export const FOLIO_ASSETS = { page: '/studio/future-endoscopy-page.jpg', figure: '/studio/camera-sensors.jpg' } as const;

export function mediaForPaper(publication: Publication | null): PaperMedia | null {
  return paperMedia.find(media => media.doiUrl === publication?.doiUrl) ?? null;
}

export function orderedPapers(publications: readonly Publication[]): readonly Publication[] {
  return publications.toSorted((a, b) => Number(!!mediaForPaper(b)) - Number(!!mediaForPaper(a)) || b.year - a.year);
}

export function featuredPresentation(presentations: readonly Presentation[]): Presentation | null {
  const today = new Date().toISOString().slice(0, 10);
  return presentations.filter(talk => talk.date <= today && talkMedia.some(media => media.id === talk.id))
    .toSorted((a, b) => b.date.localeCompare(a.date))[0] ?? presentations[0] ?? null;
}

export function presentationNavigation(presentations: readonly Presentation[], id: string | undefined) {
  const ordered = presentations.toSorted((a, b) => b.date.localeCompare(a.date));
  const index = ordered.findIndex(talk => talk.id === id);
  return { index, total: ordered.length, previous: ordered[index - 1], next: index >= 0 ? ordered[index + 1] : undefined };
}
