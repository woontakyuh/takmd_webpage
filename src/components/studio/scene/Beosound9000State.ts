import { BEOSOUND_ALBUMS } from './BeosoundAlbums';
import { firstPlayableTrack, trackAudio } from './BeosoundTracks';
import { DEFAULT_CD_SLOTS } from './BeosoundStorage';
import type { AlbumId } from './BeosoundAlbums';

export const BEOSOUND_9000 = {
  width: .869, height: .301, depth: .07, discRadius: .06, discPitch: .135,
  discY: .217, tilt: -Math.PI / 15, bracketHeight: .017, clamperSpeed: .16875,
} as const;
export const CD_SLOTS = [1, 2, 3, 4, 5, 6] as const;
export type CdSlot = typeof CD_SLOTS[number];
export type CdPlayback = 'stopped' | 'loading' | 'playing' | 'paused' | 'error';
export type BeosoundState = {
  readonly slots: readonly (AlbumId | null)[];
  readonly exchange: { readonly slot: CdSlot; readonly album: AlbumId | null; readonly outgoing: AlbumId | null; readonly source: CdSlot | null; readonly playTrack?: number; readonly keepsAudio: boolean } | null;
  readonly track: number;
  readonly disc: CdSlot;
  readonly carriageDisc: CdSlot;
  readonly volume: number;
  readonly muted: boolean;
  readonly doorOpen: boolean;
  readonly playback: CdPlayback;
  readonly transportRequest: number;
  readonly display: 'disc' | 'volume' | 'unavailable' | 'standby' | 'door';
};
export type BeosoundAction =
  | { readonly type: 'exchange'; readonly slot: CdSlot; readonly album: AlbumId | null; readonly playTrack?: number }
  | { readonly type: 'restore'; readonly slots: readonly (AlbumId | null)[] }
  | { readonly type: 'track'; readonly disc: CdSlot; readonly track: number }
  | { readonly type: 'exchange-complete' | 'exchange-settle' }
  | { readonly type: 'disc'; readonly disc: CdSlot }
  | { readonly type: 'prepare'; readonly disc: CdSlot }
  | { readonly type: 'step'; readonly direction: -1 | 1 }
  | { readonly type: 'volume'; readonly delta: -1 | 1 }
  | { readonly type: 'volume'; readonly value: number }
  | { readonly type: 'media'; readonly playback: CdPlayback }
  | { readonly type: 'mute' | 'load' | 'play' | 'pause' | 'standby' };
export const INITIAL_BEOSOUND: BeosoundState = { slots: DEFAULT_CD_SLOTS, track: 3, exchange: null, disc: 1, carriageDisc: 1, volume: 32, muted: false, doorOpen: false, display: 'disc', playback: 'stopped', transportRequest: 0 };

export function beosoundReducer(state: BeosoundState, action: BeosoundAction): BeosoundState {
  if (state.exchange && !['exchange-complete', 'exchange-settle', 'volume', 'mute', 'media', 'pause'].includes(action.type)) return state;
  switch (action.type) {
    case 'restore': return { ...INITIAL_BEOSOUND, slots: action.slots, track: firstPlayableTrack(action.slots[0]) ?? 1 };
    case 'track': {
      const album = state.slots[action.disc - 1];
      if (!album || !trackAudio(album, action.track)) return state;
      return { ...state, disc: action.disc, carriageDisc: action.disc, track: action.track, playback: 'loading', display: 'disc', doorOpen: false, transportRequest: state.transportRequest + 1 };
    }
    case 'exchange': {
      const outgoing = state.slots[action.slot - 1] ?? null;
      if (outgoing === action.album) return state;
      const source = CD_SLOTS.find(slot => state.slots[slot - 1] === action.album) ?? null;
      const keepsAudio = !action.playTrack && action.slot !== state.disc && source !== state.disc;
      return { ...state, carriageDisc: keepsAudio ? state.carriageDisc : action.slot, playback: keepsAudio ? state.playback : 'stopped', doorOpen: !keepsAudio, display: keepsAudio ? 'disc' : 'door',
        transportRequest: state.transportRequest + 1,
        exchange: { slot: action.slot, album: action.album, outgoing, source: action.album === null ? null : source, playTrack: action.playTrack, keepsAudio } };
    }
    case 'exchange-settle': return { ...state, doorOpen: false };
    case 'exchange-complete': {
      if (!state.exchange) return state;
      const { slot, album, keepsAudio } = state.exchange;
      const slots = placementAfterExchange(state);
      return { ...state, slots, exchange: null, doorOpen: false, display: 'disc',
        ...(keepsAudio ? {} : { disc: slot, carriageDisc: slot, track: firstPlayableTrack(album) ?? 1, playback: 'stopped' as const }) };
    }
    case 'prepare': return { ...state, carriageDisc: action.disc };
    case 'disc': return { ...state, track: firstPlayableTrack(state.slots[action.disc - 1]) ?? 1, transportRequest: state.transportRequest + 1, disc: action.disc, carriageDisc: action.disc, doorOpen: false, display: 'disc', playback: firstPlayableTrack(state.slots[action.disc - 1]) ? 'loading' : 'stopped' };
    case 'step': return beosoundReducer(state, { type: 'disc', disc: nextLoadedSlot(state, action.direction) ?? state.disc });
    case 'volume': return { ...state, volume: Math.max(0, Math.min(90, 'value' in action ? action.value : state.volume + action.delta)), muted: false, display: 'volume' };
    case 'mute': return { ...state, muted: !state.muted, display: 'volume' };
    case 'load': return { ...state, doorOpen: !state.doorOpen, display: 'door', playback: 'paused' };
    case 'play': return { ...state, carriageDisc: state.disc, transportRequest: state.transportRequest + 1, doorOpen: false, display: selectedAudio(state) ? 'disc' : 'unavailable', playback: selectedAudio(state) ? 'loading' : 'stopped' };
    case 'pause': return { ...state, display: 'disc', playback: state.playback === 'stopped' ? 'stopped' : 'paused' };
    case 'standby': return { ...state, disc: 1, carriageDisc: 1, track: firstPlayableTrack(state.slots[0]) ?? 1, doorOpen: false, display: 'standby', playback: 'stopped' };
    case 'media': return { ...state, playback: action.playback, display: 'disc' };
    default: { const exhaustive: never = action; return exhaustive; }
  }
}
export function cdPosition(disc: CdSlot): number { return (disc - 3.5) * BEOSOUND_9000.discPitch; }
export function moveClamper(current: number, target: number, delta: number, reducedMotion: boolean): number {
  if (reducedMotion) return target;
  const distance = target - current, step = BEOSOUND_9000.clamperSpeed * Math.max(0, delta);
  return Math.abs(distance) <= step ? target : current + Math.sign(distance) * step;
}

export function beosoundDisplay(state: BeosoundState): string {
  switch (state.display) {
    case 'disc': {
      const status = { stopped: 'STOP', loading: 'LOADING', playing: `${String(state.track).padStart(2, '0')}  ▷`, paused: 'PAUSE', error: 'UNABLE TO PLAY' }[state.playback];
      return `CD ${state.disc}  ·  ${status}`;
    }
    case 'volume': return state.muted ? 'MUTED' : `VOLUME ${state.volume}`;
    case 'unavailable': return 'NO AUDIO LOADED';
    case 'standby': return '•';
    case 'door': return state.doorOpen ? 'OPEN' : `CD ${state.disc}  ·  STOP`;
    default: { const exhaustive: never = state.display; return exhaustive; }
  }
}

export function albumAtSlot(state: BeosoundState, slot: CdSlot) {
  const id = state.slots[slot - 1];
  return id ? BEOSOUND_ALBUMS[id] : undefined;
}
export function nextLoadedSlot(state: BeosoundState, direction: -1 | 1): CdSlot | null {
  for (let offset = 1; offset <= CD_SLOTS.length; offset++) {
    const slot = CD_SLOTS[(state.disc - 1 + direction * offset + 6) % 6];
    if (slot && firstPlayableTrack(state.slots[slot - 1])) return slot;
  }
  return null;
}

export function selectedAudio(state: BeosoundState): string | undefined {
  const id = state.slots[state.disc - 1];
  return id ? trackAudio(id, state.track) : undefined;
}
export function selectedTrack(state: BeosoundState) {
  return albumAtSlot(state, state.disc)?.tracks.find(track => track.number === state.track);
}
export function nextPlayable(state: BeosoundState): { disc: CdSlot; track: number; audio: string } | null {
  const album = state.slots[state.disc - 1];
  const following = album ? BEOSOUND_ALBUMS[album]?.tracks.find(track => track.number > state.track && trackAudio(album, track.number)) : undefined;
  const disc = following ? state.disc : nextLoadedSlot(state, 1);
  if (!disc) return null;
  const id = state.slots[disc - 1], track = following?.number ?? firstPlayableTrack(id);
  const audio = id && track ? trackAudio(id, track) : undefined;
  return track && audio ? { disc, track, audio } : null;
}

export function placementAfterExchange(state: BeosoundState): readonly (AlbumId | null)[] {
  if (!state.exchange) return state.slots;
  const { slot, album, source } = state.exchange;
  return state.slots.map((id, index) => index === slot - 1 ? album : index === (source ?? 0) - 1 ? null : id);
}
