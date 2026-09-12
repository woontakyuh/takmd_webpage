import { talkMedia } from '../collection';
import { EDBM_PHOTOS } from '../edbmArchive';
import type { TalkSlide } from '../types';
import { WHISKY_LECTURE } from './WhiskyLectureLayout';

export type WhiskyCardSlide = TalkSlide & { readonly photoAspect?: number };
const lecture = talkMedia.find(talk => talk.id === WHISKY_LECTURE.id)?.slides ?? [];
const cover = lecture[0];
export const whiskyLecturePages: readonly WhiskyCardSlide[] = cover ? [
  cover,
  ...EDBM_PHOTOS.map(photo => ({ src: photo.src, caption: `${photo.label}. ${photo.description}`, photoAspect: photo.aspect })),
  ...lecture.slice(1),
] : [];
