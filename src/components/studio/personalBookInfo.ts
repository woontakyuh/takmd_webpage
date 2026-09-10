import type { PersonalBookId } from './personalBooks';

type PersonalBookInfo = {
  readonly publication: string;
  readonly description: string;
  readonly source: { readonly label: string; readonly url: string };
  readonly details?: {
    readonly label: string;
    readonly paragraphs: readonly string[];
    readonly source: { readonly label: string; readonly url: string };
  };
};

const BENZEL_INFO = {
  publication: 'Elsevier · 2021 · 5th edition',
  source: { label: 'Book details on YES24', url: 'https://www.yes24.com/product/goods/98923966' },
} as const;

export const PERSONAL_BOOK_INFO: Readonly<Record<PersonalBookId, PersonalBookInfo>> = {
  'benzel-1': {
    ...BENZEL_INFO,
    description: 'Volume 1 of a two-volume reference on the evaluation of spinal disorders, operative techniques and complication management.',
  },
  'benzel-2': {
    ...BENZEL_INFO,
    description: 'Volume 2 of a two-volume reference on the evaluation of spinal disorders, operative techniques and complication management.',
  },
  emory: {
    publication: 'Wolters Kluwer · 2019 · 1st edition',
    description: 'An illustrated operative reference from Emory spine surgeons, explaining technical steps, practical tips and pitfalls.',
    source: {
      label: 'Publisher’s book details',
      url: 'https://shop.lww.com/Emory-s-Illustrated-Tips-and-Tricks-in-Spine-Surgery/p/9781496375193',
    },
  },
  csrs: {
    publication: 'Cervical Spine Research Society · 2022',
    description: 'The program and abstracts from the 50th CSRS Annual Meeting. Open the marked pages to read Paper 23 by Woon Tak Yuh.',
    source: { label: 'Official CSRS abstract book · PDF', url: 'https://www.csrs.org/UserFiles/am22-abs-bk-v5-HIRES.pdf' },
    details: {
      label: 'Meeting and presentation',
      paragraphs: [
        'In-person meeting · 16–19 November 2022\n50th Annual Meeting and 27th Instructional Course',
        'Manchester Grand Hyatt · San Diego, California, USA',
        'Paper 23 · Woon Tak Yuh, MD\n17 November 2022 · 12:56–13:01 (local time)',
        'Spinal Cord Shift May Not Be a Cause of C5 Palsy After Cervical Laminoplasty: Protective Effect of Medial Gutter',
        'Program p. 11 · Abstract pp. 86–87',
      ],
      source: { label: 'CSRS meeting archive', url: 'https://www.csrs.org/meetings/meeting-archives' },
    },
  },
  consciousness: {
    publication: 'Alma · 2014',
    description: 'Neuroscientist Christof Koch reflects on the science of consciousness alongside the experiences of his own life. Korean edition.',
    source: { label: 'Book details on YES24', url: 'https://www.yes24.com/product/goods/14377245' },
  },
  memoir: {
    publication: 'Yeonjangtong · 2020',
    description: 'Neurosurgeon Dong-Gyu Kim’s third essay collection, published after retirement, with memories of family, everyday life and a career in medicine. In Korean.',
    source: { label: 'Book details on YES24', url: 'https://m.yes24.com/Goods/Detail/95860769' },
  },
  woodpecker: {
    publication: 'Ilchokak · 2026',
    description: 'Dong-Gyu Kim’s fourth essay collection, recalling his medical career, family and daily life in later years. In Korean.',
    source: { label: 'Book details on YES24', url: 'https://m.yes24.com/goods/detail/192113056' },
  },
} as const;
