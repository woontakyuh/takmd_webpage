import type { CdSlot } from './Beosound9000State';

export type BeosoundAlbum = {
  readonly artist: string;
  readonly album: string;
  readonly track: string;
  readonly audio: string;
  readonly cover: string;
};

export const BEOSOUND_ALBUMS: Partial<Record<CdSlot, BeosoundAlbum>> = {
  1: { artist: 'Asoto Union', album: 'Sound Renovates A Structure', track: 'Think About’ Chu', audio: '/audio/asoto-union-think-about-chu.m4a', cover: '/models/audio/asoto-union-sound-renovates-cover.webp' },
  2: { artist: 'Brown Eyes', album: 'Reason 4 Breathing?', track: '비오는 압구정', audio: '/audio/brown-eyes-rainy-apgujeong.m4a', cover: '/models/audio/brown-eyes-reason4breathing-cover.webp' },
  3: { artist: 'GIRIBOY', album: '땡큐', track: '하루종일 (Band Ver.)', audio: '/audio/giriboy-all-day-band.m4a', cover: '/models/audio/giriboy-thank-you-cover.jpg' },
  4: { artist: 'Two Ton Shoe', album: 'Resoled', track: 'Paper Bag', audio: '/audio/two-ton-shoe-paper-bag.m4a', cover: '/models/audio/two-ton-shoe-resoled-cover.webp' },
  5: { artist: 'Radiohead', album: 'The Bends', track: 'High and Dry', audio: '/audio/radiohead-high-and-dry.m4a', cover: '/models/audio/radiohead-the-bends-cover.webp' },
  6: { artist: 'John Splithoff', album: 'Make It Happen (Deluxe Edition)', track: 'Raye', audio: '/audio/john-splithoff-raye.m4a', cover: '/models/audio/john-splithoff-make-it-happen-cover.webp' },
};
