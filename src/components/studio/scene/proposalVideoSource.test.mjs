import { describe, expect, test } from 'bun:test';
import { attachProposalVideo } from './proposalVideoSource.ts';

describe('native proposal playback', () => {
  test('assigns native HLS synchronously so the click can start playback without waiting for MSE', () => {
    let src = '';
    const media = {
      canPlayType: () => 'probably',
      get src() { return src; },
      set src(value) { src = value; },
    };
    const source = attachProposalVideo(media, { src: '/recording.mp4', hlsSrc: '/master.m3u8' });
    source.dispose();
    expect(src).toBe('/master.m3u8');
    expect(source.ready).toBeNull();
  });
});
