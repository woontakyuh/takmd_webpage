import { useCallback, useEffect, useReducer, useRef } from 'react';
import { BEOSOUND_ALBUMS } from './BeosoundAlbums';
import { INITIAL_BEOSOUND, beosoundReducer } from './Beosound9000State';
import type { BeosoundAction, CdSlot } from './Beosound9000State';

export function useBeosoundAudio() {
  const [state, reduce] = useReducer(beosoundReducer, INITIAL_BEOSOUND);
  const current = useRef(state);
  const media = useRef<{ audio: HTMLAudioElement; context: AudioContext; gain: GainNode } | null>(null);
  const request = useRef(0);
  const pending = useRef<{ disc: CdSlot; resume: number; arrived: boolean; ready: boolean } | null>(null);
  const update = useCallback((action: BeosoundAction) => {
    current.current = beosoundReducer(current.current, action);
    reduce(action);
  }, []);
  const startWhenReady = useCallback(() => {
    const source = media.current, next = pending.current;
    if (!source || !next?.arrived || !next.ready) return;
    source.audio.currentTime = next.resume;
    source.gain.gain.value = current.current.muted ? 0 : current.current.volume / 90;
    pending.current = null;
    update({ type: 'media', playback: 'playing' });
  }, [update]);
  const dispatch = useCallback((action: BeosoundAction) => {
    const previous = current.current;
    update(action);
    const next = current.current;
    switch (action.type) {
      case 'disc': case 'step': case 'play': {
        if (action.type === 'play' && previous.playback === 'playing') {
          update({ type: 'media', playback: 'playing' });
          return;
        }
        const generation = ++request.current;
        const album = BEOSOUND_ALBUMS[next.disc];
        const resume = action.type === 'play' && previous.playback === 'paused' ? media.current?.audio.currentTime ?? 0 : 0;
        media.current?.audio.pause();
        pending.current = null;
        if (!album) return;
        if (!media.current) {
          const audio = document.createElement('audio');
          audio.preload = 'none'; audio.hidden = true;
          audio.dataset.beosound = '9000';
          document.body.append(audio);
          const context = new AudioContext(), gain = context.createGain();
          context.createMediaElementSource(audio).connect(gain).connect(context.destination);
          media.current = { audio, context, gain };
          audio.addEventListener('pause', () => {
            if (audio.paused && !pending.current && current.current.playback === 'playing') update({ type: 'media', playback: 'paused' });
          });
          audio.addEventListener('ended', () => {
            if (audio.ended && !pending.current) update({ type: 'media', playback: 'stopped' });
          });
          audio.addEventListener('error', () => {
            if (audio.error) { pending.current = null; update({ type: 'media', playback: 'error' }); }
          });
        }
        const { audio, context, gain } = media.current;
        gain.gain.value = 0;
        if (audio.getAttribute('src') !== album.audio) audio.src = album.audio;
        else if (audio.error) audio.load();
        pending.current = { disc: next.disc, resume, arrived: false, ready: false };
        // Start both browser media APIs in the click gesture. The gain remains silent
        // until the physical carriage arrives; then playback seeks to its real start.
        void Promise.all([context.resume(), audio.play()]).then(() => {
          if (generation !== request.current || !pending.current) return;
          pending.current.ready = true;
          startWhenReady();
        }).catch((error: unknown) => {
          if (generation !== request.current) return;
          if (error instanceof Error) {
            audio.pause(); pending.current = null;
            update({ type: 'media', playback: 'error' });
          } else { throw error; }
        });
        return;
      }
      case 'pause': case 'standby': case 'load':
        ++request.current;
        pending.current = null;
        media.current?.audio.pause();
        if (action.type === 'standby' && media.current) media.current.audio.currentTime = 0;
        return;
      case 'volume': case 'mute':
        if (media.current && !pending.current) media.current.gain.gain.value = next.muted ? 0 : next.volume / 90;
        return;
      case 'media': return;
      default: { const exhaustive: never = action; return exhaustive; }
    }
  }, [startWhenReady, update]);
  const onCarriageReady = useCallback((disc: CdSlot) => {
    if (pending.current?.disc !== disc) return;
    pending.current.arrived = true;
    startWhenReady();
  }, [startWhenReady]);
  useEffect(() => () => {
    ++request.current;
    const source = media.current;
    if (!source) return;
    source.audio.pause(); source.audio.removeAttribute('src'); source.audio.load(); source.audio.remove();
    source.gain.disconnect(); void source.context.close(); media.current = null;
  }, []);
  return { state, dispatch, onCarriageReady };
}
