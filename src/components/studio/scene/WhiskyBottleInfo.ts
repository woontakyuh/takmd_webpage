import type { WhiskyBottleId } from './WhiskyInspectionState';

type WhiskyInfo = {
  readonly brand: string;
  readonly expression: string;
  readonly origin: string;
  readonly style: string;
  readonly strength: string;
  readonly age: string;
  readonly volume: string;
  readonly story: string;
  readonly character: string;
  readonly source: string;
};

export const WHISKY_BOTTLE_INFO = {
  '/models/whisky/hibiki-masters-select.jpg': {
    brand: 'Hibiki', expression: 'Japanese Harmony · Master’s Select', origin: 'Japan',
    style: '블렌디드 재패니즈 위스키', strength: '43%', age: '연수 미표기', volume: '700 ml',
    story: '2015년 선보인 Hibiki Japanese Harmony의 면세점 전용 블렌드.',
    character: '시럽에 절인 자두와 장미 향. 오렌지 마멀레이드와 다크 초콜릿, 은은한 쌉쌀함 뒤로 나무와 향신료의 여운이 이어집니다.',
    source: 'https://thewhiskyphiles.com/2015/10/18/hibiki-japanese-harmony-masters-select/',
  },
  '/models/whisky/ballantines-30.png': {
    brand: 'Ballantine’s', expression: '30 Year Old', origin: 'Scotland',
    style: '블렌디드 스카치 위스키', strength: '40%', age: '30년', volume: '750 ml',
    story: '30년 이상 숙성한 희귀 스카치 원액을 블렌딩합니다. 지금은 문을 닫은 증류소의 원액도 포함합니다.',
    character: '배와 복숭아, 꿀과 꽃의 풍미에 바닐라 오크가 겹쳐지고 길고 부드러운 여운으로 이어집니다.',
    source: 'https://www.ballantines.com/en/range/ballantines-30-year-old/',
  },
  '/models/whisky/lagavulin-16-classic.jpg': {
    brand: 'Lagavulin', expression: '16 Year Old', origin: 'Islay · Scotland',
    style: '싱글몰트 스카치 위스키', strength: '43%', age: '16년', volume: '700 ml',
    story: '오크통에서 최소 16년 숙성한 아일라 남부의 싱글몰트.',
    character: '짙은 피트 연기, 해조류와 요오드 계열의 바다 향. 깊은 단맛과 짭짤함이 어우러지며 긴 스모키한 여운을 남깁니다.',
    source: 'https://www.malts.com/en-gb/products/lagavulin-16-year-old-single-malt-scotch-whisky-70cl',
  },
  '/models/whisky/bowmore-17-white-sands.png': {
    brand: 'Bowmore', expression: '17 Year Old · White Sands', origin: 'Islay · Scotland',
    style: '싱글몰트 스카치 위스키', strength: '43%', age: '17년', volume: '700 ml',
    story: '1779년 아일라 최초로 면허를 받은 Bowmore 증류소의 싱글몰트.',
    character: '오크통에서 17년 숙성한 White Sands. 병에 표기된 도수는 43%입니다.',
    source: 'https://www.bowmore.com/',
  },
  '/models/whisky/bookers.png': {
    brand: 'Booker’s', expression: 'Kentucky Straight Bourbon', origin: 'Kentucky · USA',
    style: '켄터키 스트레이트 버번', strength: '배치별 상이', age: '배치별 상이', volume: '750 ml',
    story: '소량의 배럴을 골라 희석하지 않은 배럴 스트렝스로 병입하는 버번. 여과를 최소화해 배럴의 개성을 담습니다.',
    character: '도수와 숙성 기간, 풍미는 배치마다 달라집니다.',
    source: 'https://www.bookersbourbon.com/batches',
  },
  '/models/whisky/glendronach-18-current.png': {
    brand: 'The Glendronach', expression: '18 Year Old', origin: 'Highlands · Scotland',
    style: '싱글몰트 스카치 위스키', strength: '46%', age: '18년', volume: '700 ml',
    story: '스페인 안달루시아의 올로로소 셰리 캐스크에서 숙성한 하이랜드 싱글몰트.',
    character: '퍼지와 진한 흑설탕, 졸인 과일과 체리. 올스파이스, 호두빵, 초콜릿 오렌지의 풍미가 겹쳐집니다.',
    source: 'https://www.glendronachdistillery.com/product/aged-18-years/',
  },
  '/models/whisky/castarede-xo-20-label.svg': {
    brand: 'Castarède', expression: 'Bas Armagnac · XO 20 ans d’âge', origin: 'Bas-Armagnac · France',
    style: '바 아르마냑', strength: '40%', age: '최소 20년', volume: '700 ml',
    story: '여러 빈티지를 블렌딩하며 가장 어린 원액도 오크통에서 20년 이상 숙성합니다.',
    character: '과일과 향신료가 어우러진 따뜻한 향. 부드럽게 녹아든 타닌 위로 당절임 과일과 설탕에 절인 감귤 껍질의 풍미가 이어집니다.',
    source: 'https://shop.armagnac-castarede.fr/products/xo-armagnac-castarede-70cl',
  },
} as const satisfies Record<WhiskyBottleId, WhiskyInfo>;
