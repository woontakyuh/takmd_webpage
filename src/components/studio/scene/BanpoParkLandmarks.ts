import { BANPO_APPEARANCE } from './BanpoAppearance';
import { appendParkPolygon, appendParkRibbon, appendParkSides, parkElevation } from './BanpoParkGeometry';
import type { ParkPoint } from './BanpoParkData';

const WATERFRONT_ARC: readonly ParkPoint[] = [
  [507, 267], [523, 259], [542, 256], [558, 251], [574, 250],
  [591, 253], [608, 264], [623, 280], [635, 296], [647, 305],
];
const WATERFRONT_SHORE: readonly ParkPoint[] = [[507, 267], [644, 314], [647, 305]];
export const PARK_LANDMARK_REFERENCE = {
  url: 'https://earth.google.com/web/@37.51264,126.99844,4a,700d,35y,0h,0t,0r',
  imageryDate: '2026-05-24', inspected: '2026-09-12',
  precision: 'Aerial-photo interpretation calibrated to the mapped fountain and visible scale bar; not surveyed.',
} as const;

export function appendParkLandmarks(batch: (color: number) => number[]): void {
  const palette = BANPO_APPEARANCE.park;
  const height = (p: ParkPoint): number => parkElevation(p) + .24;
  appendParkPolygon(batch(palette.paving), [...WATERFRONT_SHORE, ...WATERFRONT_ARC.slice().reverse()], height);
  for (let tier = 0; tier < 4; tier++) {
    const arc = WATERFRONT_ARC.map(([e, n]): ParkPoint => [e, n + tier * 1.6]);
    appendParkRibbon(batch(palette.stone), arc, { width: .75, height: p => height(p) + .25 + tier * .28 });
  }
  const westPlaza: readonly ParkPoint[] = [[343, 21], [359, 48], [382, 72], [404, 90],
    [421, 122], [419, 144], [457, 157], [475, 99], [480, 58], [448, 34], [402, 24]];
  appendParkPolygon(batch(palette.paving), westPlaza, height);
  for (let tier = 0; tier < 4; tier++) {
    const arc = [[345, 24], [362, 52], [386, 76], [407, 94], [424, 126], [423, 145]]
      .map(([e, n]): ParkPoint => [e + tier * 1.5, n - tier]);
    appendParkRibbon(batch(palette.stone), arc, { width: .6, height: p => height(p) + .2 + tier * .25 });
  }
  const circle = Array.from({ length: 40 }, (_, i): ParkPoint => [428 + Math.cos(i * Math.PI / 20) * 10.2,
    177 + Math.sin(i * Math.PI / 20) * 10.2]);
  appendParkPolygon(batch(palette.paving), circle, height);
  appendParkSides(batch(palette.stone), circle, { top: height, bottom: p => height(p) - .18 });
}
