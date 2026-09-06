import type { ExhibitId } from '../types';

export const PALETTE = {
  paper: '#EAE8E1', paperLight: '#F8F6F0', plaster: '#DCD8CC', ink: '#202D2A',
  muted: '#5C655F', teal: '#355A50', tealLight: '#769B88', clay: '#AC5737',
  walnut: '#77503A', walnutDark: '#463729', bone: '#E7DDC6', line: '#CBCDC3',
  board: '#283C3D', steel: '#65716D', linen: '#454C40', stone: '#CAC5B8',
  white: '#FFFFFF', nightBg: '#182824', nightSurface: '#34463D', sun: '#FFE0AC',
  aluminium: '#B8BDBF', aluminiumEdge: '#D8DCDE', graphite: '#34393B',
  rubber: '#222626', keyIvory: '#E4E2DB', keySage: '#9CB7A3',
} as const;

export type Point = readonly [number, number, number];
export type CameraPose = {
  readonly position: Point;
  readonly target: Point;
  readonly zoom: number;
};

export const ROOM = {
  platform: { size: [4.8, 0.08, 6.4], position: [0, -0.045, 0], radius: 0.008 },
  desk: { position: [-0.05, 0, -1.1], rotation: Math.PI, width: 1.8, depth: 0.85, height: 0.75 },
  spine: { position: [-1.9, 0.685, 0.85], height: 0.54, rotation: -0.12 },
  folio: { position: [0.38, 0.7845, -1.26], rotation: Math.PI - 0.17 },
  monitor: { position: [-0.24, 0.785, -0.8], rotation: Math.PI - 0.08 },
  clock: { position: [-0.55, 1.88, 3.105], rotation: Math.PI, scale: 1.15 },
  gallery: { position: [0.55, 1.78, 3.065], rotation: Math.PI },
  chair: { position: [-0.2, 0, -2.19], rotation: Math.PI - 0.23 },
  credenza: { position: [-2.1, 0, 0.8], width: 1.6, depth: 0.44, height: 0.74 },
  plant: { position: [-2.03, 0, 2.12] },
  wardrobe: { position: [1.9, 0, 0.2], rotation: Math.PI - 0.37, width: 1.2, height: 1.7 },
  surfboard: { position: [2, 0, 2.55], rotation: -0.2 },
} as const;

export const TOUR: readonly [CameraPose, CameraPose, CameraPose] = [
  { position: [4.55, 3.35, -6.65], target: [0, 1.05, 0.45], zoom: 1 },
  { position: [4.6, 2.35, -1.6], target: [-0.3, 1.05, 0.45], zoom: 1 },
  { position: [-1.75, 2.25, -3.2], target: [-0.05, 0.85, -1.0], zoom: 1 },
];

export const FOCUS: Readonly<Record<ExhibitId, CameraPose>> = {
  spine: { position: [-0.15, 1.55, -0.15], target: [-1.9, 1.02, 0.85], zoom: 1 },
  research: { position: [0.08, 1.9, -2.52], target: [0.38, 0.8, -1.26], zoom: 1 },
  education: { position: [-0.18, 2.08, 1.1], target: [0.55, 1.7, 3], zoom: 1 },
  ai: { position: [-1.25, 1.65, -2.49], target: [-0.24, 1.15, -0.8], zoom: 1 },
  bjj: { position: [2.75, 1.7, -1.9], target: [1.9, 0.95, 0.2], zoom: 1 },
  surfing: { position: [0.35, 1.8, 0.7], target: [2, 1.05, 2.55], zoom: 1 },
};

export const MOBILE_TOUR: readonly [CameraPose, CameraPose, CameraPose] = [
  { position: [5.8, 4.15, -10.45], target: [0, 1.05, 0.45], zoom: 1 },
  { position: [5.6, 2.8, -2.5], target: [-0.25, 1.05, 0.45], zoom: 1 },
  { position: [-2.5, 2.9, -3.95], target: [-0.05, 0.85, -1.0], zoom: 1 },
];

export const MOBILE_FOCUS: Readonly<Record<ExhibitId, CameraPose>> = {
  spine: { position: [-0.15, 1.8, -0.55], target: [-1.9, 1.02, 0.85], zoom: 1 },
  research: { position: [-0.05, 2.5, -2.52], target: [0.38, 0.8, -1.26], zoom: 1 },
  education: { position: [-0.4, 2.25, 0.25], target: [0.55, 1.7, 3], zoom: 1 },
  ai: { position: [-1.65, 1.9, -2.52], target: [-0.24, 1.15, -0.8], zoom: 1 },
  bjj: { position: [2.95, 2.05, -2.45], target: [1.9, 0.95, 0.2], zoom: 1 },
  surfing: { position: [-0.1, 2.1, 0.15], target: [2, 1.05, 2.55], zoom: 1 },
};

export const MOTION = { camera: 4.5, object: 8, hoverLift: 0.008 } as const;
