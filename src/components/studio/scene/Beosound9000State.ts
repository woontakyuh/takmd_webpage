import { BEOSOUND_ALBUMS } from './BeosoundAlbums';
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
  readonly exchange: { readonly slot: CdSlot; readonly album: AlbumId | null; readonly outgoing: AlbumId | null; readonly source: CdSlot | null } | null;
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
  | { readonly type: 'exchange'; readonly slot: CdSlot; readonly album: AlbumId | null }
  | { readonly type: 'exchange-complete' }
  | { readonly type: 'disc'; readonly disc: CdSlot }
  | { readonly type: 'prepare'; readonly disc: CdSlot }
  | { readonly type: 'step'; readonly direction: -1 | 1 }
  | { readonly type: 'volume'; readonly delta: -1 | 1 }
  | { readonly type: 'media'; readonly playback: CdPlayback }
  | { readonly type: 'mute' | 'load' | 'play' | 'pause' | 'standby' };
export const INITIAL_BEOSOUND: BeosoundState = { slots: [1, 2, 3, 4, 5, 6], exchange: null, disc: 1, carriageDisc: 1, volume: 32, muted: false, doorOpen: false, display: 'disc', playback: 'stopped', transportRequest: 0 };

export function beosoundReducer(state: BeosoundState, action: BeosoundAction): BeosoundState {
  if (state.exchange && !['exchange-complete', 'volume', 'mute'].includes(action.type)) return state;
  switch (action.type) {
    case 'exchange': {
      const outgoing = state.slots[action.slot - 1] ?? null;
      if (outgoing === action.album) return state;
      const source = CD_SLOTS.find(slot => state.slots[slot - 1] === action.album) ?? null;
      return { ...state, playback: 'stopped', doorOpen: true, display: 'door',
        transportRequest: state.transportRequest + 1,
        exchange: { slot: action.slot, album: action.album, outgoing, source: action.album === null ? null : source } };
    }
    case 'exchange-complete': {
      if (!state.exchange) return state;
      const { slot, album, source } = state.exchange;
      const slots = state.slots.map((id, index) => index === slot - 1 ? album : index === (source ?? 0) - 1 ? null : id);
      return { ...state, slots, exchange: null, disc: slot, carriageDisc: slot, doorOpen: false, playback: 'stopped', display: 'disc' };
    }
    case 'prepare': return { ...state, carriageDisc: action.disc };
    case 'disc': return { ...state, transportRequest: state.transportRequest + 1, disc: action.disc, carriageDisc: action.disc, doorOpen: false, display: 'disc', playback: albumAtSlot(state, action.disc) ? 'loading' : 'stopped' };
    case 'step': return beosoundReducer(state, { type: 'disc', disc: nextLoadedSlot(state, action.direction) ?? state.disc });
    case 'volume': return { ...state, volume: Math.max(0, Math.min(90, state.volume + action.delta)), muted: false, display: 'volume' };
    case 'mute': return { ...state, muted: !state.muted, display: 'volume' };
    case 'load': return { ...state, doorOpen: !state.doorOpen, display: 'door', playback: 'paused' };
    case 'play': return { ...state, carriageDisc: state.disc, transportRequest: state.transportRequest + 1, doorOpen: false, display: albumAtSlot(state, state.disc) ? 'disc' : 'unavailable', playback: albumAtSlot(state, state.disc) ? 'loading' : 'stopped' };
    case 'pause': return { ...state, display: 'disc', playback: state.playback === 'stopped' ? 'stopped' : 'paused' };
    case 'standby': return { ...state, disc: 1, carriageDisc: 1, doorOpen: false, display: 'standby', playback: 'stopped' };
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
      const status = { stopped: 'STOP', loading: 'LOADING', playing: '01  ▷', paused: 'PAUSE', error: 'UNABLE TO PLAY' }[state.playback];
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
    if (slot && albumAtSlot(state, slot)) return slot;
  }
  return null;
}
