import { CanvasTexture, SRGBColorSpace } from 'three';
import type { EDBM_PHOTOS } from '../edbmArchive';
import { PALETTE } from './config';
import { WHISKY_LECTURE } from './WhiskyLectureLayout';

export type WhiskyPhoto = (typeof EDBM_PHOTOS)[number];

export function createWhiskyPhotoCaption(photo: WhiskyPhoto) {
  const canvas = document.createElement('canvas');
  canvas.width = matchMedia('(pointer: coarse), (max-width: 700px)').matches ? 1024 : 1536;
  canvas.height = Math.round(canvas.width * WHISKY_LECTURE.height / WHISKY_LECTURE.width);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.scale(canvas.width / 1920, canvas.width / 1920);
  const editorial = getComputedStyle(document.querySelector('.studio') ?? document.documentElement).getPropertyValue('--studio-editorial').trim() || 'Georgia, serif';
  ctx.fillStyle = PALETTE.paperLight;
  ctx.fillRect(0, 0, 1920, 1920 * WHISKY_LECTURE.height / WHISKY_LECTURE.width);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.ink;
  ctx.font = `500 112px ${editorial}`;
  ctx.fillText('Eat Drink & Be Merry', 960, 1100);
  ctx.font = '400 76px "Manrope Variable", sans-serif';
  ctx.fillText(`Sangsu-dong, Seoul · ${photo.dateLabel}`, 960, 1190);
  ctx.font = `400 70px ${editorial}`;
  ctx.fillText('From the days I ran a little bar in Sangsu.', 960, 1290);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}
