import { talkMedia } from '../collection';
import { EDBM_PHOTOS } from '../edbmArchive';
import type { WhiskyPhoto } from './WhiskyPhotoCaption';
import type { TalkSlide } from '../types';
import { WHISKY_LECTURE } from './WhiskyLectureLayout';

export type WhiskyCardSlide = TalkSlide & { readonly photo?: WhiskyPhoto };
const lecture = talkMedia.find(talk => talk.id === WHISKY_LECTURE.id)?.slides ?? [];
const cover = lecture[0];
export const whiskyLecturePages: readonly WhiskyCardSlide[] = cover ? [
  cover,
  ...EDBM_PHOTOS.map(photo => ({ src: photo.src, caption: `Eat Drink & Be Merry · Sangsu-dong, Seoul · ${photo.dateLabel}. From the days I ran a little bar in Sangsu.`, photo })),
  ...lecture.slice(1),
] : [];
