import type { MagazineSurface } from './scene/MagazinePrint';

export const EDBM_MAGAZINE = {
  width: .207, height: .27, thickness: .006,
  cover: { src: '/models/edbm/cover.webp', restoration: 'cover', quad: [[.066, .027], [.977, .03], [.999, .955], [.004, .94]] },
  spreads: [
    { label: 'Contributors · photographed excerpt', leftLeaves: 2,
      right: { src: '/models/edbm/contributors.webp', restoration: 'contributors', quad: [[0, 0], [1, 0], [1, 1], [0, 1]] } },
    { label: 'Small but special · pp. 52–53', leftLeaves: 26,
      left: { src: '/models/edbm/feature.webp', restoration: 'feature-left', quad: [[.997, 0], [.915, .498], [0, .513], [0, 0]] },
      right: { src: '/models/edbm/feature.webp', restoration: 'feature-right', quad: [[.919, .504], [.921, .993], [0, .993], [0, .513]] } },
  ],
} as const satisfies {
  readonly width: number; readonly height: number; readonly thickness: number;
  readonly cover: MagazineSurface;
  readonly spreads: readonly { readonly label: string; readonly leftLeaves: number; readonly left?: MagazineSurface; readonly right: MagazineSurface }[];
};

export const EDBM_PHOTOS = [
  { src: '/models/edbm/exterior.webp', aspect: 4 / 3, date: '2017-09-14', dateLabel: '14 September 2017', label: 'An evening in Sangsu',
    description: 'Eat Drink & Be Merry, the little bar I ran in Seoul.' },
  { src: '/models/edbm/evening.webp', aspect: 1, date: '2017-09-02', dateLabel: '2 September 2017', label: 'Around the bar',
    description: 'Warm lights, good company, and a place to spend the evening.' },
] as const;
