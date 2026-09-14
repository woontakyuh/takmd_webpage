import type Hls from 'hls.js';

export type ProposalVideoSource = { readonly src: string; readonly hlsSrc?: string | null };

export function attachProposalVideo(video: HTMLVideoElement, source: ProposalVideoSource) {
  let hls: Hls | null = null;
  let disposed = false;
  const dispose = () => { disposed = true; hls?.destroy(); hls = null; };
  if (!source.hlsSrc) {
    video.src = source.src;
    return { ready: null, dispose };
  }
  const playlist = source.hlsSrc;
  const ready = import('hls.js').then(({ default: Hls }) => {
    if (disposed) return;
    if (!Hls.isSupported()) {
      video.src = video.canPlayType('application/vnd.apple.mpegurl') ? playlist : source.src;
      return;
    }
    return new Promise<void>(resolve => {
      const stream = new Hls({ maxBufferLength: 20, maxMaxBufferLength: 30, backBufferLength: 10 });
      hls = stream;
      stream.on(Hls.Events.MANIFEST_PARSED, () => resolve());
      stream.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal || disposed) return;
        stream.destroy(); hls = null;
        video.src = source.src;
        resolve();
      });
      stream.loadSource(playlist);
      stream.attachMedia(video);
    });
  });
  return { ready, dispose };
}
