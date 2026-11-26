import paperRecords from '../../data/studio-paper-media.json';
import talkRecords from '../../data/studio-talk-media.json';
import type { PaperMedia, Presentation, Publication, TalkMedia } from './types';

export const paperMedia: readonly PaperMedia[] = paperRecords;
export const talkMedia: readonly TalkMedia[] = talkRecords.map((record): TalkMedia => {
  const kind = record.kind;
  if (kind !== undefined && kind !== 'full' && kind !== 'selected' && kind !== 'photos') throw new Error(`Invalid presentation media kind: ${kind}`);
  return { ...record, kind };
});
export const FEATURED_DOI = '10.3390/bioengineering10121363';
export const FOLIO_ASSETS = { page: '/studio/future-endoscopy-page.jpg', figure: '/studio/camera-sensors.jpg' } as const;

export function mediaForPaper(publication: Publication | null): PaperMedia | null {
  return paperMedia.find(media => media.doiUrl === publication?.doiUrl) ?? null;
}

export function orderedPapers(publications: readonly Publication[]): readonly Publication[] {
  return publications.toSorted((a, b) => b.year - a.year || (b.date ?? '').localeCompare(a.date ?? '') || Number(!!mediaForPaper(b)) - Number(!!mediaForPaper(a)));
}

const FEATURE_AHEAD_DAYS = 7;
const seoulDate = (time: number) => new Date(time + 9 * 3600_000).toISOString().slice(0, 10);

// The TV leads with a lecture about to be given in the coming week, so visitors met at a congress see that talk;
// otherwise it shows the most recent lecture already given. Dates are Seoul calendar days.
export function featuredPresentation(presentations: readonly Presentation[], now = Date.now()): Presentation | null {
  const today = seoulDate(now), horizon = seoulDate(now + FEATURE_AHEAD_DAYS * 86400_000);
  const withSlides = presentations.filter(talk => talk.date <= horizon && talkMedia.some(media => media.id === talk.id));
  const upcoming = withSlides.filter(talk => talk.date >= today).toSorted((a, b) => a.date.localeCompare(b.date))[0];
  return upcoming ?? withSlides.toSorted((a, b) => b.date.localeCompare(a.date))[0] ?? presentations[0] ?? null;
}

export function presentationNavigation(presentations: readonly Presentation[], id: string | undefined) {
  const ordered = presentations.toSorted((a, b) => b.date.localeCompare(a.date));
  const index = ordered.findIndex(talk => talk.id === id);
  return { index, total: ordered.length, previous: ordered[index - 1], next: index >= 0 ? ordered[index + 1] : undefined };
}
