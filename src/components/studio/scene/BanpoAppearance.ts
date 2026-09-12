export const BANPO_APPEARANCE = {
  neutral: { white: 0xffffff, unlit: 0x000000 },
  shindonga: {
    ivory: 0xd7d1c2,
    ledge: 0xe1ddcf,
    roof: 0x92968b,
    joint: 0xc0b8a8,
    glass: 0x394e4e,
    glassVariation: 0x8eaaa7,
    lettering: 0x718d9b,
    lamps: [0xffd59a, 0xffedc8, 0xcdd9de],
    structureRoughness: 0.88,
    glassRoughness: 0.44,
    glassMetalness: 0.08,
    lampIntensity: 0.72,
  },
  caelitus: {
    glass: { color: 0x7297ad, roughness: 0.39, metalness: 0.32 },
    trim: { color: 0xd3d9d7, roughness: 0.52, metalness: 0.22 },
    roof: { color: 0x7b8585, roughness: 0.75, metalness: 0.16 },
    linear: {
      glassDark: [0.12, 0.235, 0.31],
      glassLight: [0.31, 0.46, 0.55],
      frame: [0.57, 0.61, 0.61],
      spandrel: [0.26, 0.36, 0.42],
      lampWarm: [0.95, 0.75, 0.46],
      lampCool: [0.68, 0.82, 0.90],
    },
  },
  streets: { color: 0x727573, roughness: 1, metalness: 0 },
  urbanFabric: {
    wall: { color: 0xc0bbae, roughness: 0.85 },
    roof: { color: 0x777f7d, roughness: 0.94 },
  },
  genericFacade: {
    roughness: 0.79,
    metalness: 0.025,
    linear: {
      masonryDark: [0.28, 0.30, 0.285],
      masonryLight: [0.46, 0.445, 0.40],
      glassDark: [0.075, 0.12, 0.14],
      glassLight: [0.16, 0.205, 0.21],
      lampWarm: [0.88, 0.71, 0.46],
      lampCool: [0.72, 0.82, 0.89],
    },
  },
  atmosphere: {
    waterDay: 0x4e655e,
    waterNight: 0x112c3c,
    sunGlint: [1.0, 0.9, 0.72],
    nightZenith: [0.002, 0.006, 0.018],
    nightHorizon: [0.025, 0.036, 0.062],
    skyDayIntensity: 0.82,
  },
} as const;

export function banpoGlslColor(rgb: readonly [number, number, number]): string {
  return `vec3(${rgb.map(value => Number.isInteger(value) ? value.toFixed(1) : String(value)).join(', ')})`;
}

export function banpoCssColor(hex: number): string {
  return `#${hex.toString(16).padStart(6, '0')}`;
}
