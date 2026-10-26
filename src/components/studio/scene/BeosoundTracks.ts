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
  '7:3': '/audio/collection/album-07-track-03.m4a',
  '7:5': '/audio/collection/album-07-track-05.m4a',
  '8:1': '/audio/collection/album-08-track-01.m4a',
  '8:2': '/audio/collection/album-08-track-02.m4a',
  '8:3': '/audio/collection/album-08-track-03.m4a',
  '8:4': '/audio/collection/album-08-track-04.m4a',
  '8:5': '/audio/collection/album-08-track-05.m4a',
  '8:6': '/audio/collection/album-08-track-06.m4a',
  '8:7': '/audio/collection/album-08-track-07.m4a',
  '8:8': '/audio/collection/album-08-track-08.m4a',
  '8:9': '/audio/collection/album-08-track-09.m4a',
  '8:10': '/audio/collection/album-08-track-10.m4a',
  '8:11': '/audio/collection/album-08-track-11.m4a',
  '8:12': '/audio/collection/album-08-track-12.m4a',
  '8:13': '/audio/collection/album-08-track-13.m4a',
  '8:14': '/audio/collection/album-08-track-14.m4a',
  '8:15': '/audio/collection/album-08-track-15.m4a',
  '8:16': '/audio/collection/album-08-track-16.m4a',
  '9:4': '/audio/collection/album-09-track-04.m4a',
  '9:6': '/audio/collection/album-09-track-06.m4a',
  '10:5': '/audio/collection/album-10-track-05.m4a',
};
export function trackAudio(album: AlbumId, track: number): string | undefined {
  return BEOSOUND_ALBUMS[album]?.tracks.some(item => item.number === track) ? TRACK_AUDIO[`${album}:${track}`] : undefined;
}
export function firstPlayableTrack(album: AlbumId | null | undefined): number | undefined {
  return album ? BEOSOUND_ALBUMS[album]?.tracks.find(item => trackAudio(album, item.number))?.number : undefined;
}
