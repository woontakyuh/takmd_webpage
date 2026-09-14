import type { BeosoundAction } from './Beosound9000State';

// Printed coordinates and touch regions share the same 2048 × 256 faceplate.
export const BEOSOUND_PANEL_KEYS = [
  { label: 'PLAY', name: 'Play selected CD', x: 780, y: 82, action: { type: 'play' } },
  { label: 'PAUSE', name: 'Pause CD', x: 930, y: 82, action: { type: 'pause' } },
  { label: '‹', name: 'Previous CD', x: 1110, y: 82, action: { type: 'step', direction: -1 } },
  { label: '›', name: 'Next CD', x: 1220, y: 82, action: { type: 'step', direction: 1 } },
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
