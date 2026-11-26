import { firstPlayableTrack } from './BeosoundTracks';
import type { BeosoundAction, BeosoundState } from './Beosound9000State';

// Printed coordinates and touch regions share the same 2048 × 256 faceplate.
export const BEOSOUND_PANEL_KEYS = [
  { label: 'PLAY', name: 'Play selected CD', x: 780, y: 82, action: { type: 'play' } },
  { label: 'PAUSE', name: 'Pause CD', x: 930, y: 82, action: { type: 'pause' } },
  { label: '‹', name: 'Previous track', x: 1110, y: 82, action: { type: 'track-step', direction: -1 } },
  { label: '›', name: 'Next track', x: 1220, y: 82, action: { type: 'track-step', direction: 1 } },
  { label: 'MUTE', name: 'Mute music', x: 1400, y: 82, action: { type: 'mute' } },
  { label: 'VOL −', name: 'Decrease volume', x: 1580, y: 82, action: { type: 'volume', delta: -1 } },
  { label: 'VOL +', name: 'Increase volume', x: 1780, y: 82, action: { type: 'volume', delta: 1 } },
  ...([1, 2, 3, 4, 5, 6] as const).map((disc, index) => ({
    label: String(disc), name: `Select CD ${disc}`, x: 815 + index * 140, y: 188,
    action: { type: 'disc', disc } as const,
  })),
  { label: 'LOAD', name: 'Open or close CD glass cover', x: 1680, y: 188, action: { type: 'load' } },
  { label: '•', name: 'Standby', x: 1860, y: 188, action: { type: 'standby' } },
] as const satisfies readonly { label: string; name: string; x: number; y: number; action: BeosoundAction }[];

export function panelKeyPosition(x: number, y: number): [number, number, number] {
  return [(x / 2048 - .5) * .818, .064 + (.5 - (y - 8) / 256) * .093, .049];
}

export function panelKeyAppearance(key: typeof BEOSOUND_PANEL_KEYS[number], state: BeosoundState) {
  const hasAudio = Boolean(firstPlayableTrack(state.slots[state.disc - 1]));
  const ready = state.exchange === null;
  const awake = state.display !== 'standby';
  switch (key.action.type) {
    case 'play': return { primary: true, available: ready && hasAudio, selected: awake && state.playback === 'playing' };
    case 'pause': return { primary: true, available: ready && hasAudio && ['playing', 'loading', 'paused'].includes(state.playback),
      selected: awake && hasAudio && state.playback === 'paused' && !state.doorOpen };
    case 'disc': return { primary: true, available: ready && Boolean(firstPlayableTrack(state.slots[key.action.disc - 1])),
      selected: awake && state.disc === key.action.disc && Boolean(firstPlayableTrack(state.slots[key.action.disc - 1])) };
    default: return { primary: false, available: true, selected: false };
  }
}

/** Fill the gaps between physical keys without letting adjacent touch targets overlap. */
export function panelKeyHitArea(key: typeof BEOSOUND_PANEL_KEYS[number]) {
  const row = BEOSOUND_PANEL_KEYS.filter(item => item.y === key.y).sort((a, b) => a.x - b.x);
  const index = row.findIndex(item => item.name === key.name);
  const previous = row[index - 1]?.x ?? key.x - (row[index + 1].x - key.x);
  const next = row[index + 1]?.x ?? key.x + (key.x - row[index - 1].x);
  const left = (previous + key.x) / 2 + 2;
  const right = (next + key.x) / 2 - 2;
  const top = key.y < 135 ? 26 : 137;
  const bottom = key.y < 135 ? 133 : 242;
  return { position: panelKeyPosition((left + right) / 2, (top + bottom) / 2),
    size: [(right - left) / 2048 * .818, (bottom - top) / 256 * .093] satisfies [number, number] };
}
