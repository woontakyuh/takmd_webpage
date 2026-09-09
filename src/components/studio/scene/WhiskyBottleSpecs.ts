import type { WHISKY_SILHOUETTES } from './WhiskySilhouettes';
import { WHISKY_CABINET_SLOTS } from './WhiskyCabinetLayout';

export type BottleLabelSpec = {
  readonly low: number;
  readonly high: number;
  readonly halfAngle: number;
  readonly kind: 'paper' | 'crest';
};
export type BottleSpec = {
  readonly name: string;
  readonly image: keyof typeof WHISKY_SILHOUETTES;
  readonly position: readonly [number, number, number];
  readonly height: number;
  readonly radius: number;
  readonly shape: 'round' | 'faceted';
  readonly glass: string;
  readonly darkGlass: boolean;
  readonly liquid: string;
  readonly cap: string;
  readonly capTop?: string;
  readonly capRidges?: number;
  readonly capBand?: { readonly height: number; readonly color: string };
  readonly cork?: boolean;
  readonly capsuleHeight: number;
  readonly fillHeight: number;
  readonly closure: 'capsule' | 'crystal';
  readonly labels: readonly BottleLabelSpec[];
};

export const WHISKY_BOTTLES = [
  { name: "Hibiki Japanese Harmony Master's Select 700 ml", image: '/models/whisky/hibiki-masters-select.jpg',
    position: WHISKY_CABINET_SLOTS[14], height: .255, radius: .06112, shape: 'faceted',
    glass: '#f5f7e9', darkGlass: false, liquid: '#bf8029', cap: '#f1f4ed', capsuleHeight: 0, fillHeight: .67, closure: 'crystal',
    labels: [{low: .247, high: .58, halfAngle: .9, kind: 'paper'}, {low: .78, high: .85, halfAngle: 1.3, kind: 'paper'}] },
  { name: "Ballantine's 30 Year Old 750 ml", image: '/models/whisky/ballantines-30.png',
    position: WHISKY_CABINET_SLOTS[15], height: .35, radius: .05163, shape: 'round',
    glass: '#493b23', darkGlass: true, liquid: '#a06d22', cap: '#513322', capsuleHeight: .066, fillHeight: .72, closure: 'capsule',
    labels: [{low: .215, high: .565, halfAngle: 1.38, kind: 'paper'}, {low: .132, high: .193, halfAngle: .85, kind: 'paper'}] },
  { name: 'Lagavulin 16 Year Old 700 ml', image: '/models/whisky/lagavulin-16-classic.jpg',
    position: WHISKY_CABINET_SLOTS[11], height: .35, radius: .04534, shape: 'round',
    glass: '#637244', darkGlass: true, liquid: '#a26b27', cap: '#183b30', capTop: '#a76d32', capsuleHeight: .032, fillHeight: .75, closure: 'capsule',
    labels: [{low: .066, high: .289, halfAngle: 1.37, kind: 'paper'}, {low: .301, high: .537, halfAngle: .435, kind: 'crest'}] },
  { name: 'Bowmore 17 Year Old White Sands 700 ml', image: '/models/whisky/bowmore-17-white-sands.png',
    position: WHISKY_CABINET_SLOTS[6], height: .34, radius: .04377567, shape: 'round',
    glass: '#f5f4e7', darkGlass: false, liquid: '#b88130', cap: '#161b18', capTop: '#b47b42', capBand: { height: .824, color: '#b47b42' }, capsuleHeight: .07627172, fillHeight: .73934, closure: 'capsule',
    labels: [{low: .290679, high: .605055, halfAngle: 1.38, kind: 'paper'}] },
  { name: "Booker's Kentucky Straight Bourbon 750 ml", image: '/models/whisky/bookers.png',
    position: WHISKY_CABINET_SLOTS[2], height: .35, radius: .0459, shape: 'round',
    glass: '#f5f5e4', darkGlass: false, liquid: '#9c6322', cap: '#181b19', capsuleHeight: .098, fillHeight: .715, closure: 'capsule',
    labels: [{low: .106, high: .36, halfAngle: 1.4, kind: 'paper'}] },
  { name: 'GlenDronach 18 Year Old 700 ml', image: '/models/whisky/glendronach-18-current.png',
    position: WHISKY_CABINET_SLOTS[3], height: .34, radius: .04607722, shape: 'round',
    glass: '#f5f3e3', darkGlass: false, liquid: '#8d491c', cap: '#233c63', capTop: '#ba9a59', capBand: { height: .835, color: '#ba9a59' }, capsuleHeight: .05776062, fillHeight: .70193, closure: 'capsule',
    labels: [{low: .293436, high: .549035, halfAngle: 1.48, kind: 'paper'}] },
  { name: "Castarède Bas Armagnac XO 20 ans d'âge 70 cl 40%", image: '/models/whisky/castarede-xo-20-label.svg',
    position: WHISKY_CABINET_SLOTS[4], height: .37, radius: .0422, shape: 'round',
    glass: '#f5f4e7', darkGlass: false, liquid: '#963d14', cap: '#131514', capRidges: 32, cork: true,
    capsuleHeight: .0133, fillHeight: .55, closure: 'capsule',
    labels: [{low: .22, high: .49, halfAngle: 1.3, kind: 'paper'}] },
] as const satisfies readonly BottleSpec[];
