import { BEOSOUND_ALBUMS } from './BeosoundAlbums';

export const BEOSOUND_9000 = {
  width: .869, height: .301, depth: .07, discRadius: .06, discPitch: .135,
  discY: .217, tilt: -Math.PI / 15, bracketHeight: .017, clamperSpeed: .16875,
} as const;
export const CD_SLOTS = [1, 2, 3, 4, 5, 6] as const;
export type CdSlot = typeof CD_SLOTS[number];
export type CdPlayback = 'stopped' | 'loading' | 'playing' | 'paused' | 'error';
export type BeosoundState = {
  readonly disc: CdSlot;
  readonly volume: number;
  readonly muted: boolean;
  readonly doorOpen: boolean;
  readonly playback: CdPlayback;
  readonly transportRequest: number;
  readonly display: 'disc' | 'volume' | 'unavailable' | 'standby' | 'door';
};
export type BeosoundAction =
  | { readonly type: 'disc'; readonly disc: CdSlot }
  | { readonly type: 'step'; readonly direction: -1 | 1 }
  | { readonly type: 'volume'; readonly delta: -1 | 1 }
  | { readonly type: 'media'; readonly playback: CdPlayback }
  | { readonly type: 'mute' | 'load' | 'play' | 'pause' | 'standby' };
export const INITIAL_BEOSOUND: BeosoundState = { disc: 1, volume: 32, muted: false, doorOpen: false, display: 'disc', playback: 'stopped', transportRequest: 0 };

export function beosoundReducer(state: BeosoundState, action: BeosoundAction): BeosoundState {
  switch (action.type) {
    case 'disc': return { ...state, transportRequest: state.transportRequest + 1, disc: action.disc, doorOpen: false, display: 'disc', playback: BEOSOUND_ALBUMS[action.disc] ? 'loading' : 'stopped' };
    case 'step': return beosoundReducer(state, { type: 'disc', disc: CD_SLOTS[(state.disc - 1 + action.direction + 6) % 6] ?? 1 });
    case 'volume': return { ...state, volume: Math.max(0, Math.min(90, state.volume + action.delta)), muted: false, display: 'volume' };
    case 'mute': return { ...state, muted: !state.muted, display: 'volume' };
    case 'load': return { ...state, doorOpen: !state.doorOpen, display: 'door', playback: 'paused' };
    case 'play': return { ...state, transportRequest: state.transportRequest + 1, doorOpen: false, display: BEOSOUND_ALBUMS[state.disc] ? 'disc' : 'unavailable', playback: BEOSOUND_ALBUMS[state.disc] ? 'loading' : 'stopped' };
    case 'pause': return { ...state, display: 'disc', playback: state.playback === 'stopped' ? 'stopped' : 'paused' };
    case 'standby': return { ...state, disc: 1, doorOpen: false, display: 'standby', playback: 'stopped' };
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
