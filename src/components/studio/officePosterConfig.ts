import manifest from './office-poster-manifest.json';

export type OfficePosterVariant = typeof manifest.variants[number];

export const OFFICE_POSTER_MANIFEST = manifest;

export function activeOfficePosterVariant(matches: (media: string) => boolean): OfficePosterVariant | undefined {
  return manifest.variants.find(variant => variant.media === null || matches(variant.media));
}
