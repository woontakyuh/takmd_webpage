import type { BookSurface } from './personalBookSurfaces';

export const EDBM_MAGAZINE = {
  width: .207, height: .27, thickness: .006,
  cover: { src: '/models/edbm/cover.webp', quad: [[.066, .027], [.977, .03], [1, .987], [.004, .96]] },
  spreads: [
    { label: 'Contributors · photographed excerpt', leftLeaves: 2,
      right: { src: '/models/edbm/contributors.webp', quad: [[0, 0], [1, 0], [1, 1], [0, 1]] } },
    { label: 'Small but special · pp. 52–53', leftLeaves: 26,
      left: { src: '/models/edbm/feature.webp', quad: [[.988, 0], [.972, .498], [0, .513], [0, 0]] },
      right: { src: '/models/edbm/feature.webp', quad: [[.972, .498], [.921, .993], [0, .993], [0, .513]] } },
  ],
} as const satisfies {
  readonly width: number; readonly height: number; readonly thickness: number;
  readonly cover: BookSurface;
  readonly spreads: readonly { readonly label: string; readonly leftLeaves: number; readonly left?: BookSurface; readonly right: BookSurface }[];
};

export const EDBM_PHOTOS = [
  { src: '/models/edbm/exterior.webp', aspect: 4 / 3, label: 'An evening in Sangsu',
    description: 'Eat Drink & Be Merry, the little bar I ran in Seoul.' },
  { src: '/models/edbm/evening.webp', aspect: 1, label: 'Around the bar',
    description: 'Warm lights, good company, and a place to spend the evening.' },
] as const;
