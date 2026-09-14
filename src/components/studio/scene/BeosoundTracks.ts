import { BEOSOUND_ALBUMS } from './BeosoundAlbums';
import type { AlbumId } from './BeosoundAlbums';

// Keys are stable album IDs and the release's printed track number.
// Add a supplied file here to enable that track without changing catalog metadata.
export const TRACK_AUDIO: Readonly<Record<string, string>> = {
  '1:3': '/audio/two-ton-shoe-paper-bag.m4a',
  '2:2': '/audio/giriboy-all-day-band.m4a',
  '3:3': '/audio/radiohead-high-and-dry.m4a',
  '4:5': '/audio/asoto-union-think-about-chu.m4a',
  '5:5': '/audio/john-splithoff-raye.m4a',
  '6:3': '/audio/brown-eyes-rainy-apgujeong.m4a',
};
export function trackAudio(album: AlbumId, track: number): string | undefined {
  return BEOSOUND_ALBUMS[album]?.tracks.some(item => item.number === track) ? TRACK_AUDIO[`${album}:${track}`] : undefined;
}
export function firstPlayableTrack(album: AlbumId | null | undefined): number | undefined {
  return album ? BEOSOUND_ALBUMS[album]?.tracks.find(item => trackAudio(album, item.number))?.number : undefined;
}
