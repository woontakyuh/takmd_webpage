import photos from '../../data/photo-frame.json';
import { profileImage } from '../../data/cv';

export type PhotoMemory = {
  readonly src: string;
  readonly width?: number;
  readonly height?: number;
  readonly alt: string;
  readonly title: string;
  readonly kicker: string;
  readonly heart?: boolean;
  readonly occasion?: string;
  readonly dateTime?: string;
  readonly dateLabel?: string;
  readonly place?: string;
  readonly people?: string;
};

export const PHOTO_MEMORIES: Readonly<Record<'ppomppu' | 'kosess-award', PhotoMemory>> = {
  ppomppu: {
    kicker: '우리만의 첫 번째 이스터에그', title: '뽐뿌방', heart: true,
    src: '/studio/memories/ppomppu.webp', width: 1800, height: 1399,
    alt: '서래본갈비에서 함께한 여운탁, 고용산, 박용진. 왼쪽부터 순서대로.',
    occasion: 'KOSESS 2026 뒷풀이', dateTime: '2026-08-29T20:13:39', dateLabel: '2026.08.29 · 20:13',
    place: '서래본갈비', people: '왼쪽부터 여운탁 · 고용산 · 박용진',
  },
  'kosess-award': {
    kicker: '수상의 기록', title: 'Best Shorts Award',
    src: '/models/award-photo/kosess-ceremony.webp', width: 1600, height: 1241,
    alt: 'KOSESS 정기학술대회에서 Best Shorts Award를 수상하는 여운탁.',
    occasion: 'KOSESS 정기학술대회', dateTime: '2026-08-29', dateLabel: '2026.08.29',
    place: '서울성모병원',
  },
};

const FAMILY_CAPTIONS: Readonly<Record<string, Pick<PhotoMemory, 'occasion' | 'dateTime' | 'dateLabel' | 'place'>>> = {
  '/images/photo-frame/d763025245ba26e9.webp': {
    occasion: 'AO Spine Fellowship', dateTime: '2025-08-05', dateLabel: '2025.08.05',
    place: 'Keio University Mita Campus',
  },
};

export function selectFamilyPhoto(): PhotoMemory {
  let previous: string | null = null;
  try { previous = sessionStorage.getItem('takmd-frame-photo'); } catch { /* Storage may be unavailable. */ }
  const candidates = photos.length > 1 ? photos.filter(item => item.src !== previous) : photos;
  const photo = candidates[Math.floor(Math.random() * candidates.length)] ?? { src: profileImage };
  try { sessionStorage.setItem('takmd-frame-photo', photo.src); } catch { /* Selection works without storage. */ }
  return { ...photo, ...FAMILY_CAPTIONS[photo.src], title: '가족과 함께', kicker: '책상 위의 한 장', alt: '책상 액자에 놓인 가족사진' };
}
