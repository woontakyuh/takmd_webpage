import paperRecords from '../../data/studio-paper-media.json';
import talkRecords from '../../data/studio-talk-media.json';
import type { PaperMedia, Publication, TalkMedia } from './types';

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
