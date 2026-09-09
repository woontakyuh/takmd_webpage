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
  publication: 'Elsevier · 2021 · 5판',
  source: { label: 'YES24 도서 정보', url: 'https://www.yes24.com/product/goods/98923966' },
} as const;

export const PERSONAL_BOOK_INFO: Readonly<Record<PersonalBookId, PersonalBookInfo>> = {
  'benzel-1': {
    ...BENZEL_INFO,
    description: '척추질환의 평가, 수술 기법과 합병증 관리를 다루는 2권 교과서의 첫째 권.',
  },
  'benzel-2': {
    ...BENZEL_INFO,
    description: '척추질환의 평가, 수술 기법과 합병증 관리를 다루는 2권 교과서의 둘째 권.',
  },
  emory: {
    publication: 'Wolters Kluwer · 2019 · 1판',
    description: 'Emory 척추외과의 수술 경험을 바탕으로, 술기의 세부 단계와 주의점을 그림으로 설명하는 참고서.',
    source: {
      label: '출판사 도서 정보',
      url: 'https://shop.lww.com/Emory-s-Illustrated-Tips-and-Tricks-in-Spine-Surgery/p/9781496375193',
    },
  },
  csrs: {
    publication: 'Cervical Spine Research Society · 2022',
    description: 'CSRS 제50회 연례학술대회의 발표 일정과 초록을 담은 자료집. 여운탁의 Paper 23을 펼쳐볼 수 있습니다.',
    source: { label: 'CSRS 공식 초록집 · PDF', url: 'https://www.csrs.org/UserFiles/am22-abs-bk-v5-HIRES.pdf' },
    details: {
      label: '학회·발표 정보',
      paragraphs: [
        '현장 행사 · 2022.11.16–19\n제50회 연례학술대회 및 제27회 Instructional Course',
        'Manchester Grand Hyatt · San Diego, California, USA',
        'Paper 23 · Woon Tak Yuh, MD\n2022.11.17 · 12:56–13:01 (현지 시각)',
        'Spinal Cord Shift May Not Be a Cause of C5 Palsy After Cervical Laminoplasty: Protective Effect of Medial Gutter',
        '발표 일정 11쪽 · 초록 86–87쪽',
      ],
      source: { label: 'CSRS 행사 기록', url: 'https://www.csrs.org/meetings/meeting-archives' },
    },
  },
  consciousness: {
    publication: '알마 · 2014',
    description: '신경과학자 크리스토퍼 코흐가 의식 연구의 과학적 쟁점과 자신의 삶을 함께 돌아보는 책.',
    source: { label: 'YES24 도서 정보', url: 'https://www.yes24.com/product/goods/14377245' },
  },
  memoir: {
    publication: '연장통 · 2020',
    description: '신경외과 의사 김동규가 은퇴 후 펴낸 세 번째 수필집. 가족, 일상과 지나온 삶의 기억을 담았습니다.',
    source: { label: 'YES24 도서 정보', url: 'https://m.yes24.com/Goods/Detail/95860769' },
  },
  woodpecker: {
    publication: '일조각 · 2026',
    description: '의사 시절의 경험, 가족에 대한 기억과 노년의 일상을 담은 김동규의 네 번째 수필집.',
    source: { label: 'YES24 도서 정보', url: 'https://m.yes24.com/goods/detail/192113056' },
  },
} as const;
