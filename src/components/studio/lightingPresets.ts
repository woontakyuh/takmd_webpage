export const LIGHT_PRESETS = {
  warm: { label: 'Warm', brightness: 0.72, color: '#ffd29a', gradient: ['#ffad52', '#ffe2b9'], halo: 0.55, temperature: 3000 },
  bright: { label: 'Bright', brightness: 1, color: '#fff2dd', gradient: ['#ffe9c9', '#fff4e2'], halo: 1, temperature: 4500 },
  relax: { label: 'Relax', brightness: 0.4, color: '#ffbd7b', gradient: ['#e78340', '#ffd7a5'], halo: 0.3, temperature: 2700 },
  colorful: { label: 'Night colorful', brightness: 0.48, color: '#ffc59a', gradient: ['#ff7954', '#60b8b1'], halo: 0.25, temperature: 3000 },
  fairfax: { label: 'Fairfax', brightness: 0.62, color: '#ffdab2', gradient: ['#e8ad64', '#a6ba85'], halo: 0.5, temperature: 3200 },
} as const;

export type LightPreset = keyof typeof LIGHT_PRESETS;
export const LIGHT_PRESET_IDS: readonly LightPreset[] = ['warm', 'bright', 'relax', 'colorful', 'fairfax'];
export type RoomLightPalette = { readonly color: string; readonly gradient: readonly [string, string] };
