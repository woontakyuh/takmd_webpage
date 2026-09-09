import type { ExhibitId } from '../types';

export const LIGHTING = {
  finish: '#30332E', reflector: '#F4EBDD', warm: '#FFD29A',
  amber: '#FFB96C', warmWhite: '#FFE2B9', cable: '#262925',
} as const;

export const PALETTE = {
  paper: '#EAE8E1', paperLight: '#F8F6F0', plaster: '#DCD8CC', ink: '#202D2A',
  muted: '#5C655F', teal: '#355A50', tealLight: '#769B88', clay: '#AC5737',
  walnut: '#77503A', walnutDark: '#463729', bone: '#E7DDC6', line: '#CBCDC3',
  board: '#283C3D', steel: '#65716D', linen: '#454C40', stone: '#CAC5B8',
  white: '#FFFFFF', nightBg: '#182824', nightSurface: '#34463D', sun: '#FFE0AC',
  aluminium: '#B8BDBF', aluminiumEdge: '#D8DCDE', graphite: '#34393B',
  rubber: '#222626', keyIvory: '#E4E2DB', keySage: '#9CB7A3',
} as const;

export const MONITOR = { width: 0.718, height: 0.422, screenWidth: 0.697, screenHeight: 0.697 * 9 / 16 } as const;

export const WALL_TV = {
  model: 'Samsung 98-inch Neo QLED QN90F',
  width: 2.1851, height: 1.2493, depth: 0.0311,
  screenWidth: 2.1694, screenHeight: 1.2203,
} as const;

export const CLOCK = { case: '#E4E2DA', back: '#090A0A', rim: '#B9BCB4', face: '#252624', card: '#1E201E', numeral: '#F6F5EE' } as const;

export const GOLD_AWARD = { satin: '#D6B77A', edge: '#C7A15A', mirror: '#D9AD4A', back: '#D6B77A' } as const;

export const INTERIOR = {
  oak: '#A78A67', oakLight: '#C3AA85', oakShadow: '#6A513B', ivory: '#F1EDE4',
  plaster: '#E3DCD0', sand: '#D5C7B1', upholstery: '#D5C8B6', bronze: '#51493E',
  stone: '#DED8CB', microcement: '#DFDAD0', lightWood: '#B6A184',
} as const;

export type Point = readonly [number, number, number];
export type CameraPose = {
  readonly position: Point;
  readonly target: Point;
  readonly zoom: number;
};

export const ROOM = {
  platform: { size: [5.6, 0.08, 6.8], position: [0, -0.045, 0], radius: 0.008 },
  architecture: { height: 3.2, farZ: 3.36, leftX: -2.76,
    window: { centerZ: 0.55, width: 3.4, bottom: 0.75, top: 2.6 } },
  desk: { position: [-0.05, 0, -1.5], rotation: Math.PI, width: 1.8, depth: 0.9, height: 0.755 },
  spine: { position: [-2.38, 0.5695, 1.22], height: 0.54, rotation: Math.PI / 2 - 0.12 },
  folio: { position: [0.38, 0.7805, -1.66], rotation: Math.PI - 0.17 },
  monitor: { position: [-0.05, 0.781, -1.2], rotation: Math.PI },
  macMini: { position: [0.005, 0.7735, -0.345] },
  award: { position: [1.7, 1.3025, 3.09], rotation: Math.PI },
  clock: { position: [0.91, 0.9628, 3.104], rotation: Math.PI, scale: 0.6 },
  gallery: { position: [0, 1.94, 3.245], rotation: Math.PI },
  chair: { position: [-0.2, 0.0185, -2.59], rotation: Math.PI - 0.23 },
  credenza: { position: [-2.42, 0.0185, 0.55], width: 3.023, depth: 0.373, height: 0.55 },
  music: { position: [2.47, 0.0185, -1.48], rotation: -Math.PI / 2 },
  plant: { position: [2.18, 0.0185, -0.55] },
  wardrobe: { position: [-2.658, 0.0185, -1.95], rotation: Math.PI * 1.5, width: 1.18, height: 0.08, depth: 0.204 },
  surfboard: { position: [-2.382, 0, -3.01], rotation: Math.PI / 2 + 0.18 },
} as const;

export const TOUR: readonly [CameraPose, CameraPose, CameraPose] = [
  { position: [4.5, 3.4, -6.5], target: [-0.15, 1.35, -0.4], zoom: 1 },
  { position: [1.65, 1.75, -3.25], target: [-0.45, 1.15, 1.55], zoom: 1 },
  { position: [-1.75, 2.25, -3.6], target: [-0.05, 0.85, -1.4], zoom: 1 },
];

export const FOCUS: Readonly<Record<ExhibitId, CameraPose>> = {
  books: { position: [-1.80, 1.64, 1.87], target: [-1.80, 1.25, 2.15], zoom: 1 },
  spine: { position: [-0.45, 1.6, 0.17], target: [-2.38, 0.9, 1.22], zoom: 1 },
  research: { position: [0.08, 1.9, -2.92], target: [0.38, 0.8, -1.66], zoom: 1 },
  education: { position: [0, 1.943, 1.02], target: [0, 1.943, 3.22], zoom: 1 },
  ai: { position: [0.03, 1.255, -2.2], target: [-0.05, 1.155, -1.2], zoom: 1 },
  family: { position: [0.604, 0.96, -1.74], target: [0.67, 0.87, -1.27], zoom: 1 },
  'award-photo': { position: [2.01, 1.51, 2.64], target: [2.01, 1.42, 3.11], zoom: 1 },
  award: { position: [ROOM.award.position[0], 1.58, 2.215], target: [ROOM.award.position[0], 1.448, 3.06], zoom: 1 },
  projects: { position: [0.435, 1.35, -1.945], target: [-0.055, 0.815, -1.155], zoom: 1 },
  bjj: { position: [-1.25, 1.82, -1.02], target: [-2.505, 1.30, -2.318], zoom: 1 },
  surfing: { position: [0.65, 1.85, -4.25], target: [-2.382, 1.46, -3.01], zoom: 1 },
};

export const MOBILE_TOUR: readonly [CameraPose, CameraPose, CameraPose] = [
  { position: [2.7, 4.2, -13.3], target: [-0.35, 1.25, -0.7], zoom: 1 },
  { position: [3.0, 2.2, -4.3], target: [-0.35, 1.05, 1.1], zoom: 1 },
  { position: [-2.5, 2.9, -4.35], target: [-0.05, 0.85, -1.4], zoom: 1 },
];

export const MOBILE_FOCUS: Readonly<Record<ExhibitId, CameraPose>> = {
  books: FOCUS.books,
  spine: { position: [-0.3, 1.9, -0.28], target: [-2.38, 0.9, 1.22], zoom: 1 },
  research: { position: [-0.05, 2.5, -2.92], target: [0.38, 0.8, -1.66], zoom: 1 },
  education: FOCUS.education,
  ai: FOCUS.ai,
  family: FOCUS.family,
  'award-photo': FOCUS['award-photo'],
  award: { position: [ROOM.award.position[0], 1.60, 2.135], target: [ROOM.award.position[0], 1.448, 3.06], zoom: 1 },
  projects: { position: [0.635, 1.7, -2.325], target: [-0.055, 0.815, -1.155], zoom: 1 },
  bjj: { position: [-0.7, 2.05, -0.88], target: [-2.505, 1.30, -2.318], zoom: 1 },
  surfing: { position: [1.05, 2.15, -4.5], target: [-2.382, 1.46, -3.01], zoom: 1 },
};

export const MOTION = { camera: 4.5, object: 8, hoverLift: 0.008 } as const;

export const SIDE_READER_SPACE = 438;

export function tvReadingSize(width: number, height: number) {
  const tvWidth = Math.min(Math.max(32, width - 32), Math.max(32, height - (width > height && height < 560 ? 32 : 128)) * WALL_TV.width / WALL_TV.height);
  return tvWidth * WALL_TV.screenWidth / WALL_TV.width;
}

export function focusFov(id: ExhibitId | null, compact: boolean, width: number, height: number): number {
  const base = width < height ? 60 : 42;
  if (id === 'education') {
    const distance = ROOM.gallery.position[2] - WALL_TV.depth / 2 - .001 - FOCUS.education.position[2];
    return 2 * Math.atan(WALL_TV.screenWidth * height / (2 * distance * tvReadingSize(width, height))) * 180 / Math.PI;
  }
  if (id === 'family' || id === 'award-photo' || id === 'books') {
    const pose = FOCUS[id];
    const distance = Math.hypot(...pose.position.map((value, index) => value - pose.target[index]));
    const availableWidth = Math.max(32, width - (compact ? 48 : 400));
    const frameWidth = id === 'family' ? 0.286 : id === 'books' ? 0.44 : 0.334;
    return Math.max(base, 2 * Math.atan(frameWidth * height / (2 * distance * availableWidth)) * 180 / Math.PI);
  }
  if (id !== 'ai') return base;
  const availableWidth = Math.max(32, width - (compact ? 48 : SIDE_READER_SPACE + 56));
  const pose = compact ? MOBILE_FOCUS[id] : FOCUS[id];
  const distance = Math.hypot(...pose.position.map((value, index) => value - pose.target[index]));
  const fitted = 2 * Math.atan(0.8 * height / (2 * distance * availableWidth)) * 180 / Math.PI;
  return Math.max(base, fitted);
}
