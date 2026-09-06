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
  platform: { size: [4.8, 0.08, 4], position: [0, -0.045, 0], radius: 0.008 },
  desk: { position: [-0.05, 0, -0.33], rotation: Math.PI, width: 1.8, depth: 0.85, height: 0.75 },
  spine: { position: [-1.63, 0.68, -0.62], height: 0.54, rotation: -0.32 },
  folio: { position: [0.38, 0.7845, -0.49], rotation: Math.PI - 0.17 },
  monitor: { position: [-0.24, 0.785, -0.03], rotation: Math.PI - 0.08 },
  clock: { position: [0.6, 0.787, -0.025], rotation: Math.PI - 0.08, scale: 0.7 },
  gallery: { position: [0.55, 1.78, 1.865], rotation: Math.PI },
  chair: { position: [-0.2, 0, -1.42], rotation: Math.PI - 0.23 },
  plant: { position: [-2.05, 0, 0.48] },
} as const;

export const TOUR: readonly [CameraPose, CameraPose, CameraPose] = [
  { position: [4.4, 3.4, -5.6], target: [0, 1.05, 0.1], zoom: 1 },
  { position: [1.3, 2.2, -3.7], target: [-1, 1.1, -0.2], zoom: 1 },
  { position: [-1.9, 2.55, -2.4], target: [-0.05, 0.9, -0.2], zoom: 1 },
];

export const FOCUS: Readonly<Record<ExhibitId, CameraPose>> = {
  spine: { position: [-0.4, 1.65, 1.65], target: [-1.63, 1.0, -0.62], zoom: 1 },
  research: { position: [0.08, 1.9, -1.75], target: [0.38, 0.8, -0.49], zoom: 1 },
  education: { position: [-0.25, 2.12, -0.8], target: [0.55, 1.7, 1.7], zoom: 1 },
  ai: { position: [-1.25, 1.65, -1.72], target: [-0.24, 1.15, -0.03], zoom: 1 },
};

export const MOBILE_TOUR: readonly [CameraPose, CameraPose, CameraPose] = [
  { position: [5.5, 4, -9.3], target: [0, 1.05, 0.1], zoom: 1 },
  { position: [1.4, 2.2, -5.1], target: [-0.9, 1.1, -0.4], zoom: 1 },
  { position: [-1.9, 2.8, -2.6], target: [-0.05, 0.9, -0.2], zoom: 1 },
];

export const MOBILE_FOCUS: Readonly<Record<ExhibitId, CameraPose>> = {
  spine: { position: [-0.6, 1.7, 1.85], target: [-1.63, 1.0, -0.62], zoom: 1 },
  research: { position: [-0.05, 2.5, -1.75], target: [0.38, 0.8, -0.49], zoom: 1 },
  education: { position: [-0.4, 2.1, -2.1], target: [0.55, 1.7, 1.7], zoom: 1 },
  ai: { position: [-1.65, 1.9, -1.75], target: [-0.24, 1.15, -0.03], zoom: 1 },
};

export const MOTION = { camera: 4.5, object: 8, hoverLift: 0.008 } as const;
