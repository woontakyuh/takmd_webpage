import { useCallback, useEffect, useReducer, useRef } from 'react';
import { BEOSOUND_9000, selectedAudio, nextPlayable, placementAfterExchange, INITIAL_BEOSOUND, beosoundReducer, cdPosition } from './Beosound9000State';
import { loadCdPlacement, saveCdPlacement } from './BeosoundStorage';
import type { BeosoundAction, CdSlot } from './Beosound9000State';

type Deck = { audio: HTMLAudioElement; gain: GainNode };
type Player = { context: AudioContext; decks: readonly [Deck, Deck]; active: 0 | 1 };

export function useBeosoundAudio() {
  const [state, reduce] = useReducer(beosoundReducer, INITIAL_BEOSOUND);
  const current = useRef(state), media = useRef<Player | null>(null);
  const request = useRef(0), queued = useRef<BeosoundAction | null>(null);
  const afterExchange = useRef<BeosoundAction | null>(null), restored = useRef(false);
  const send = useRef<(action: BeosoundAction) => void>(() => undefined);
  const pending = useRef<{ disc: CdSlot; resume: number; arrived: boolean; ready: boolean } | null>(null);
  const prepared = useRef<{ disc: CdSlot; audio: string; moving: boolean } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advance = useRef<() => void>(() => undefined), progress = useRef<() => void>(() => undefined);
  const clearTimer = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }, []);
  const update = useCallback((action: BeosoundAction) => {
    current.current = beosoundReducer(current.current, action);
    reduce(action);
  }, []);
  const prepareNext = useCallback(() => {
    const player = media.current;
    if (!player || pending.current || current.current.exchange || current.current.playback !== 'playing') return;
    const { audio } = player.decks[player.active];
    if (audio.paused) return;
    const next = nextPlayable(current.current);
    if (!next) return;
    const { disc, audio: url } = next;
    const spare = player.decks[player.active === 0 ? 1 : 0];
    if (prepared.current?.audio !== url) {
      spare.gain.gain.value = 0;
      spare.audio.pause();
      spare.audio.preload = 'auto';
      spare.audio.src = url;
      spare.audio.load();
      prepared.current = { disc, audio: url, moving: false };
    }
    clearTimer();
    if (!Number.isFinite(audio.duration) || prepared.current.moving) return;
    // The outgoing track's buffered tail keeps playing while the physical pickup
    // settles and travels. The next track never waits for this animation.
    const lead = .75 + Math.abs(cdPosition(disc) - cdPosition(current.current.disc)) / BEOSOUND_9000.clamperSpeed;
    const remaining = audio.duration - audio.currentTime;
    if (remaining <= lead) {
      prepared.current.moving = true;
      update({ type: 'prepare', disc });
    } else timer.current = setTimeout(() => progress.current(), (remaining - lead) * 1000 / audio.playbackRate);
  }, [clearTimer, update]);
  const ensureMedia = useCallback((): Player => {
    if (media.current) return media.current;
    const context = new AudioContext();
    const createDeck = (): Deck => {
      const audio = document.createElement('audio'), gain = context.createGain();
      audio.preload = 'auto'; audio.hidden = true; audio.dataset.beosound = '9000';
      document.body.append(audio);
      gain.gain.value = 0;
      context.createMediaElementSource(audio).connect(gain).connect(context.destination);
      const isActive = () => media.current?.decks[media.current.active].audio === audio;
      audio.addEventListener('pause', () => {
        if (isActive() && audio.paused && !audio.ended && !pending.current && current.current.playback === 'playing') {
          clearTimer(); update({ type: 'media', playback: 'paused' });
        }
      });
      audio.addEventListener('ended', () => { if (isActive() && audio.ended && !pending.current) advance.current(); });
      audio.addEventListener('timeupdate', () => { if (isActive()) progress.current(); });
      audio.addEventListener('error', () => {
        if (isActive() && audio.error) { clearTimer(); pending.current = null; update({ type: 'media', playback: 'error' }); }
      });
      return { audio, gain };
    };
    const player: Player = { context, decks: [createDeck(), createDeck()], active: 0 };
    player.decks[0].audio.dataset.active = 'true';
    media.current = player;
    return player;
  }, [clearTimer, update]);
  const startWhenReady = useCallback(() => {
    const player = media.current, next = pending.current;
    if (!player || !next?.arrived || !next.ready) return;
    const source = player.decks[player.active];
    source.audio.currentTime = next.resume;
    source.gain.gain.value = current.current.muted ? 0 : current.current.volume / 90;
    pending.current = null;
    update({ type: 'media', playback: 'playing' });
    prepareNext();
  }, [prepareNext, update]);
  const playDeck = useCallback((player: Player, generation: number) => {
    const { audio } = player.decks[player.active];
    void Promise.all([player.context.resume(), audio.play()]).then(() => {
      if (generation !== request.current || !pending.current) return;
      pending.current.ready = true;
      startWhenReady();
    }).catch((error: unknown) => {
      if (generation !== request.current) return;
      pending.current = null; audio.pause();
      // Autoplay denial and decoding failure both expose an explicit retry.
      if (error instanceof Error) audio.dataset.failure = error.name;
      update({ type: 'media', playback: 'error' });
    });
  }, [startWhenReady, update]);
  const dispatchAction = useCallback((action: BeosoundAction) => {
    const previous = current.current;
    if (previous.exchange && !['exchange-complete', 'exchange-settle', 'volume', 'mute', 'media', 'pause'].includes(action.type)) { queued.current = action; return; }
    if (action.type === 'pause' || action.type === 'standby') { queued.current = null; afterExchange.current = null; }
    if (action.type === 'exchange' && previous.slots[action.slot - 1] === action.album) return;
    if (action.type === 'play' && previous.playback === 'playing') return;
    update(action);
    const next = current.current;
    if (next === previous) return;
    switch (action.type) {
      case 'track': case 'track-step': case 'disc': case 'step': case 'play': {
        const generation = ++request.current, url = selectedAudio(next);
        clearTimer(); prepared.current = null;
        const old = media.current?.decks[media.current.active];
        const resume = action.type === 'play' && previous.playback === 'paused' ? old?.audio.currentTime ?? 0 : 0;
        if (old) { old.gain.gain.value = 0; old.audio.pause(); }
        pending.current = null;
        if (!url) return;
        const player = ensureMedia(), source = player.decks[player.active];
        source.gain.gain.value = 0;
        if (source.audio.getAttribute('src') !== url) source.audio.src = url;
        else if (source.audio.error) source.audio.load();
        pending.current = { disc: next.disc, resume, arrived: false, ready: false };
        playDeck(player, generation);
        return;
      }
      case 'exchange': {
        afterExchange.current = action.playTrack ? { type: 'track', disc: action.slot, track: action.playTrack } : null;
        clearTimer(); prepared.current = null;
        if (next.exchange?.keepsAudio) return;
        ++request.current; pending.current = null;
        if (media.current) { const deck = media.current.decks[media.current.active]; deck.gain.gain.value = 0; deck.audio.pause(); }
        return;
      }
      case 'exchange-complete': {
        saveCdPlacement(next.slots);
        const follow = queued.current ?? afterExchange.current;
        queued.current = null; afterExchange.current = null;
        if (follow) send.current(follow);
        else prepareNext();
        return;
      }
      case 'pause': case 'standby': case 'load':
        ++request.current; clearTimer(); pending.current = null; prepared.current = null;
        if (media.current) {
          const source = media.current.decks[media.current.active];
          source.audio.pause();
          if (action.type === 'standby') source.audio.currentTime = 0;
        }
        return;
      case 'volume': case 'mute':
        if (media.current && !pending.current) media.current.decks[media.current.active].gain.gain.value = next.muted ? 0 : next.volume / 90;
        return;
      case 'media': case 'prepare': case 'restore': case 'exchange-settle': return;
      default: { const exhaustive: never = action; return exhaustive; }
    }
  }, [clearTimer, ensureMedia, playDeck, prepareNext, update]);
  const dispatch = useCallback((action: BeosoundAction) => dispatchAction(action), [dispatchAction]);
  send.current = dispatch;
  useEffect(() => {
    if (restored.current) return;
    restored.current = true; update({ type: 'restore', slots: loadCdPlacement() });
  }, [update]);
  useEffect(() => {
    const pauseForMemory = (event: Event) => {
      if (event.target instanceof HTMLVideoElement && event.target.dataset.officeMemory === 'proposal') dispatch({ type: 'pause' });
    };
    document.addEventListener('play', pauseForMemory, true);
    return () => document.removeEventListener('play', pauseForMemory, true);
  }, [dispatch]);
  const onCarriageReady = useCallback((disc: CdSlot) => {
    if (pending.current?.disc !== disc) return;
    pending.current.arrived = true; startWhenReady();
  }, [startWhenReady]);
  useEffect(() => {
    progress.current = prepareNext;
    advance.current = () => {
      const player = media.current;
      if (!player) return;
      const next = nextPlayable({ ...current.current, slots: placementAfterExchange(current.current) });
      if (!next) { update({ type: 'media', playback: 'stopped' }); return; }
      const { disc, track, audio: url } = next;
      if (current.current.exchange) {
        if (!queued.current && !afterExchange.current) queued.current = { type: 'track', disc, track };
        update({ type: 'media', playback: 'stopped' }); return;
      }
      clearTimer();
      const old = player.decks[player.active];
      old.gain.gain.value = 0; delete old.audio.dataset.active;
      player.active = player.active === 0 ? 1 : 0;
      const source = player.decks[player.active];
      source.audio.dataset.active = 'true';
      if (source.audio.getAttribute('src') !== url) source.audio.src = url;
      else if (source.audio.error) source.audio.load();
      source.gain.gain.value = 0;
      prepared.current = null;
      update({ type: 'track', disc, track });
      pending.current = { disc, resume: 0, arrived: true, ready: false };
      playDeck(player, ++request.current);
    };
  }, [clearTimer, playDeck, prepareNext, update]);
  useEffect(() => {
    return () => {
      ++request.current; clearTimer(); pending.current = null; prepared.current = null;
      const player = media.current;
      media.current = null;
      if (!player) return;
      for (const { audio, gain } of player.decks) {
        audio.pause(); audio.removeAttribute('src'); audio.load(); audio.remove(); gain.disconnect();
      }
      void player.context.close();
    };
  }, [clearTimer]);
  return { state, dispatch, onCarriageReady };
}
