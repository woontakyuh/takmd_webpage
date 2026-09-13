import { useCallback, useEffect, useRef, useState } from 'react';
import { SRGBColorSpace, VideoTexture } from 'three';
import { attachProposalVideo } from './proposalVideoSource';

type Recording = { readonly video: HTMLVideoElement; readonly ready: Promise<void> | null; readonly dispose: () => void };
const INITIAL = { playing: false, time: 0, duration: 0, muted: false, volume: 0.8, message: '' } as const;

export function useProposalPlayback({ src, hlsSrc }: { readonly src: string | null | undefined; readonly hlsSrc: string | null | undefined }, onPlay?: () => void) {
  const recording = useRef<Recording | null>(null);
  const [texture, setTexture] = useState<VideoTexture | null>(null);
  const [state, setState] = useState<{ playing: boolean; time: number; duration: number; muted: boolean; volume: number; message: string }>(INITIAL);
  const onPlayRef = useRef(onPlay);
  useEffect(() => { onPlayRef.current = onPlay; }, [onPlay]);

  const reset = useCallback(() => {
    recording.current?.dispose();
    recording.current = null;
    setTexture(null);
    setState(INITIAL);
  }, []);
  useEffect(() => () => { recording.current?.dispose(); recording.current = null; }, [src, hlsSrc]);

  const play = useCallback(() => {
    if (!src) return;
    let current = recording.current;
    if (!current) {
      const video = document.createElement('video');
      video.className = 'proposal-memory-video';
      video.dataset.officeMemory = 'proposal';
      video.setAttribute('aria-label', 'Marry me — original proposal recording');
      video.setAttribute('aria-hidden', 'true');
      video.tabIndex = -1;
      video.preload = 'none';
      video.playsInline = true;
      video.controls = true;
      video.volume = INITIAL.volume;
      const source = attachProposalVideo(video, { src, hlsSrc });
      let videoTexture: VideoTexture | null = null;
      const sync = () => setState(previous => ({ ...previous, playing: !video.paused && !video.ended,
        time: video.currentTime, duration: Number.isFinite(video.duration) ? video.duration : 0,
        muted: video.muted, volume: video.volume }));
      const timeout = window.setTimeout(() => {
        if (video.readyState >= 2 || recording.current?.video !== video) return;
        recording.current.dispose(); recording.current = null; setTexture(null);
        setState(previous => ({ ...previous, playing: false, message: 'The recording is taking too long to load. Press Play to try again.' }));
      }, 20000);
      const ready = () => {
        clearTimeout(timeout);
        videoTexture ??= new VideoTexture(video);
        videoTexture.colorSpace = SRGBColorSpace;
        setTexture(videoTexture); sync();
      };
      const playing = () => { setState(previous => ({ ...previous, message: '' })); onPlayRef.current?.(); sync(); };
      const error = () => setState(previous => ({ ...previous, playing: false, message: 'This recording could not load. Press Play to try again.' }));
      const fullscreen = () => video.setAttribute('aria-hidden', String(document.fullscreenElement !== video));
      const otherMusic = (event: Event) => {
        if (event.target instanceof HTMLAudioElement && event.target.dataset.beosound === '9000') video.pause();
      };
      const syncEvents = ['pause', 'ended', 'timeupdate', 'durationchange', 'volumechange'] as const;
      for (const event of syncEvents) video.addEventListener(event, sync);
      video.addEventListener('loadeddata', ready);
      video.addEventListener('play', playing);
      video.addEventListener('error', error);
      document.addEventListener('fullscreenchange', fullscreen);
      document.addEventListener('play', otherMusic, true);
      document.body.append(video);
      current = { video, ready: source.ready, dispose: () => {
        clearTimeout(timeout);
        source.dispose();
        for (const event of syncEvents) video.removeEventListener(event, sync);
        video.removeEventListener('loadeddata', ready);
        video.removeEventListener('play', playing);
        video.removeEventListener('error', error);
        document.removeEventListener('fullscreenchange', fullscreen);
        document.removeEventListener('play', otherMusic, true);
        video.pause(); video.removeAttribute('src'); video.load(); video.remove(); videoTexture?.dispose();
      } };
      recording.current = current;
    }
    const active = current;
    if (active.video.error) active.video.load();
    setState(previous => ({ ...previous, message: '' }));
    const start = () => recording.current === active ? active.video.play() : Promise.resolve();
    void (active.ready ? active.ready.then(start) : start()).catch((error: unknown) => {
      if (recording.current !== active) return;
      setState(previous => ({ ...previous, playing: false,
        message: error instanceof DOMException && error.name === 'NotAllowedError'
          ? 'Press Play to start the recording.' : 'Playback could not start. Press Play to try again.' }));
    });
  }, [src, hlsSrc]);

  const toggle = useCallback(() => {
    const video = recording.current?.video;
    if (video && !video.paused && !video.ended) video.pause(); else play();
  }, [play]);
  const seek = useCallback((time: number) => {
    const video = recording.current?.video;
    if (video && Number.isFinite(video.duration)) {
      video.currentTime = Math.max(0, Math.min(time, video.duration));
      setState(previous => ({ ...previous, time: video.currentTime }));
    }
  }, []);
  const mute = useCallback(() => {
    const video = recording.current?.video;
    if (video) {
      video.muted = !video.muted;
      setState(previous => ({ ...previous, muted: video.muted }));
    }
  }, []);
  const volume = useCallback((value: number) => {
    const video = recording.current?.video;
    if (video) {
      video.volume = value; video.muted = false;
      setState(previous => ({ ...previous, volume: video.volume, muted: false }));
    }
  }, []);
  const fullscreen = useCallback(() => {
    const video = recording.current?.video;
    if (!video) return;
    if (document.fullscreenEnabled && video.requestFullscreen) {
      void video.requestFullscreen().catch((error: unknown) => {
        if (error instanceof Error) setState(previous => ({ ...previous, message: 'Fullscreen is unavailable in this browser.' }));
      });
    } else if ('webkitEnterFullscreen' in video && typeof video.webkitEnterFullscreen === 'function') {
      video.webkitEnterFullscreen();
    }
  }, []);
  return { state, texture, play, toggle, seek, mute, volume, fullscreen, reset };
}
