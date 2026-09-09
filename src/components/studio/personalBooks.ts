import { BOOK_SURFACES } from './personalBookSurfaces';
import type { BookQuad, BookSurface, BookUv } from './personalBookSurfaces';

export type PersonalBookId = 'benzel-1' | 'benzel-2' | 'emory' | 'csrs' | 'consciousness' | 'memoir' | 'woodpecker';
export type BookPage = {
  readonly label: string;
  readonly right: BookSurface;
  readonly left?: BookSurface;
  readonly leftLeaves?: number;
};
export type PersonalBook = {
  readonly id: PersonalBookId;
  readonly title: string;
  readonly author: string;
  readonly width: number;
  readonly height: number;
  readonly thickness: number;
  readonly coverThickness?: number;
  readonly binding: string;
  readonly spine: BookSurface;
  readonly cover: BookSurface;
  readonly back: BookSurface;
  readonly pages: readonly BookPage[];
};

function spine(quad: BookQuad): BookSurface {
  const uv = ([x, y]: BookUv): BookUv => [(x - 373) / 525, (y - 82) / 740];
  return { src: '/models/books/spines.webp', quad: [uv(quad[0]), uv(quad[1]), uv(quad[2]), uv(quad[3])] };
}

export const PERSONAL_BOOKS = [
  { id: 'benzel-1', title: 'Benzel’s Spine Surgery · Volume 1', author: 'Michael P. Steinmetz · Sigurd H. Berven · Edward C. Benzel',
    width: .217, height: .286, thickness: .038, binding: '#d6c8ac',
    spine: spine([[384,94],[472,94],[464,802],[380,803]]),
    cover: BOOK_SURFACES['benzel-1-cover'], back: BOOK_SURFACES['benzel-1-back'], pages: [] },
  { id: 'benzel-2', title: 'Benzel’s Spine Surgery · Volume 2', author: 'Michael P. Steinmetz · Sigurd H. Berven · Edward C. Benzel',
    width: .217, height: .286, thickness: .038, binding: '#d6c8ac',
    spine: spine([[493,95],[573,91],[562,804],[480,804]]),
    cover: BOOK_SURFACES['benzel-2-cover'], back: BOOK_SURFACES['benzel-2-back'], pages: [] },
  { id: 'emory', title: 'Emory University Spine: Illustrated Tips and Tricks in Spine Surgery', author: 'John M. Rhee · M. Bradford Henley',
    width: .218, height: .285, thickness: .025, binding: '#173d63',
    spine: spine([[594,94],[645,95],[627,800],[578,800]]),
    cover: BOOK_SURFACES['emory-cover'], back: BOOK_SURFACES['emory-back'], pages: [] },
  { id: 'csrs', title: 'CSRS 50th Annual Meeting · Abstract Book 2022', author: 'Cervical Spine Research Society',
    width: .16, height: .238, thickness: .019, coverThickness: .0005, binding: '#eee9df',
    spine: spine([[658,226],[695,226],[683,813],[644,812]]),
    cover: BOOK_SURFACES['csrs-cover'], back: BOOK_SURFACES['csrs-back'],
    pages: [
      { label: '발표 일정 · 11쪽', right: BOOK_SURFACES['csrs-program'], leftLeaves: 5 },
      { label: 'Paper 23 · 86–87쪽', left: BOOK_SURFACES['csrs-paper-left'], right: BOOK_SURFACES['csrs-paper-right'], leftLeaves: 43 },
    ] },
  { id: 'consciousness', title: '의식', author: '크리스토프 코흐 · 이정진 옮김',
    width: .163, height: .226, thickness: .026, binding: '#e5ded1',
    spine: spine([[708,257],[759,256],[748,812],[697,812]]),
    cover: BOOK_SURFACES['consciousness-cover'], back: BOOK_SURFACES['consciousness-back'], pages: [] },
  { id: 'memoir', title: '마음놓고 뀌는 방귀', author: '김동규',
    width: .138, height: .195, thickness: .03, binding: '#e8e0cd',
    spine: spine([[776,338],[834,338],[827,812],[764,812]]),
    cover: BOOK_SURFACES['memoir-cover'], back: BOOK_SURFACES['memoir-back'], pages: [] },
  { id: 'woodpecker', title: '산책길에 만난 딱따구리를 벗삼다', author: '김동규',
    width: .159, height: .218, thickness: .02, binding: '#e5e6d8',
    spine: spine([[853,279],[890,278],[879,811],[844,811]]),
    cover: BOOK_SURFACES['woodpecker-cover'], back: BOOK_SURFACES['woodpecker-back'],
    pages: [{ label: '김동규 선생님의 서명 · 2026. 9. 8.', right: BOOK_SURFACES['woodpecker-dedication'] }] },
] as const satisfies readonly PersonalBook[];

export function personalBook(id: PersonalBookId): PersonalBook {
  return BOOK_BY_ID[id];
}

const BOOK_BY_ID = {
  'benzel-1': PERSONAL_BOOKS[0], 'benzel-2': PERSONAL_BOOKS[1], emory: PERSONAL_BOOKS[2],
  csrs: PERSONAL_BOOKS[3], consciousness: PERSONAL_BOOKS[4], memoir: PERSONAL_BOOKS[5], woodpecker: PERSONAL_BOOKS[6],
} as const satisfies Readonly<Record<PersonalBookId, PersonalBook>>;

export const BOOK_READING_CENTER = [-1.8, 1.25, 2.15] as const;
export const BOOK_SHELF_TOP = 2.002;
