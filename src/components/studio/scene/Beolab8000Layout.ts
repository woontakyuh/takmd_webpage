// B&O 2005 catalogue, p.117: 170 × 1320 × 170 mm; intermediate profile follows its drawing.
export const BEOLAB_8000 = {
  height: 1.32,
  baseWidth: .17,
  baseBottom: .004,
  baseTop: .04,
  coneBottom: .055,
  coneTop: .295,
  columnRadius: .06,
  grilleRadius: .0607,
  grilleTop: 1.318,
} as const;

export const BEOLAB_8000_PAIR = [
  { channel: 'left', position: [-2.57, .0185, 2.87], rotation: Math.PI },
  { channel: 'right', position: [2.57, .0185, 2.87], rotation: Math.PI },
] as const;
