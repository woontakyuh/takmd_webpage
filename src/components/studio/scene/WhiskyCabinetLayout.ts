export const WHISKY_CABINET = {
  width: .5,
  depth: .46,
  height: 2.12,
  center: [2.46, .0185, -3.02],
  rotation: Math.PI / 2,
  shelfTops: [.53, 1.04, 1.55],
  frame: '#514b40',
} as const;

// Three bottles across, two rows deep, on each shelf; leave room for 130 mm bottles.
export const WHISKY_CABINET_SLOTS = WHISKY_CABINET.shelfTops.flatMap(y =>
  [-.09, .09].flatMap(z => [-.14, 0, .14].map(x => [x, y, z] as const)),
);
