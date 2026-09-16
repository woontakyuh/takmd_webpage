import { useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { CanvasTexture, SRGBColorSpace } from 'three';
import type { Presentation } from '../types';
import { talkMedia, talkNavigation } from '../collection';
import { containPhoto, photoPageIndex, TV_PHOTO_BOARD, tvPhotoPages } from '../tvPhotoGallery';
import { setWallTvContentEdges } from './hoverReactions';
import { sampleTvImageEdges, TV_DARK_EDGES } from './tvBacklightColor';

type Props = {
  readonly cover: string | null;
  readonly talk: Presentation | null;
  readonly presentations: readonly Presentation[];
};

const BOARD_WIDTH = 1600;
const BOARD_HEIGHT = 900;
const FOOTER_HEIGHT = 80;

function fittedText(context: CanvasRenderingContext2D, text: string, width: number): string {
  if (context.measureText(text).width <= width) return text;
  let value = text;
  while (value.length > 1 && context.measureText(`${value}…`).width > width) value = value.slice(0, -1);
  return `${value}…`;
}

// The wall television shows one lecture across its whole screen; browsing belongs to the reader.
export function useTvPresentationTexture({ cover, talk, presentations }: Props) {
  const anisotropy = useThree(state => Math.min(4, state.gl.capabilities.getMaxAnisotropy()));
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = BOARD_WIDTH; canvas.height = BOARD_HEIGHT;
    const result = new CanvasTexture(canvas);
    result.colorSpace = SRGBColorSpace;
    result.anisotropy = anisotropy;
    return result;
  }, [anisotropy]);
  useEffect(() => {
    const canvas: unknown = texture.image;
    if (!(canvas instanceof HTMLCanvasElement)) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    const media = talkMedia.find(item => item.id === talk?.id);
    const gallery = tvPhotoPages(media);
    const current = gallery.length ? photoPageIndex(gallery, cover) : Math.max(0, media?.slides.findIndex(slide => slide.src === cover) ?? 0);
    const page = gallery[current];
    let remainingPhotos = page?.photos.length ?? 0;
    const photoBounds = { left: Infinity, top: Infinity, right: 0, bottom: 0 };
    const photos = media?.kind === 'photos';
    const lectures = talkNavigation(presentations, talk?.id);
    let cancelled = false;
    const stageHeight = BOARD_HEIGHT - FOOTER_HEIGHT;
    context.fillStyle = page ? TV_PHOTO_BOARD.paper : photos ? '#17241F' : '#F6F3EA';
    context.fillRect(0, 0, BOARD_WIDTH, stageHeight);
    context.fillStyle = '#22312B';
    context.fillRect(0, stageHeight, BOARD_WIDTH, FOOTER_HEIGHT);
    const images: HTMLImageElement[] = [];
    const load = (src: string, draw: (image: HTMLImageElement) => void) => {
      const image = new Image(); images.push(image);
      image.onload = () => { if (cancelled) return; draw(image); texture.needsUpdate = true; };
      image.src = src;
    };
    if (page) {
      const board = containPhoto(TV_PHOTO_BOARD.width, TV_PHOTO_BOARD.height, { x: 0, y: 0, width: BOARD_WIDTH, height: stageHeight });
      for (const photo of page.photos) load(photo.slide.src, image => {
        const frame = photo.frame;
        const fitted = containPhoto(image.naturalWidth, image.naturalHeight, {
          x: board.x + frame.x * board.width, y: board.y + frame.y * board.height,
          width: frame.width * board.width, height: frame.height * board.height,
        });
        context.drawImage(image, fitted.x, fitted.y, fitted.width, fitted.height);
        photoBounds.left = Math.min(photoBounds.left, fitted.x); photoBounds.top = Math.min(photoBounds.top, fitted.y);
        photoBounds.right = Math.max(photoBounds.right, fitted.x + fitted.width); photoBounds.bottom = Math.max(photoBounds.bottom, fitted.y + fitted.height);
        remainingPhotos -= 1;
        if (!remainingPhotos) setWallTvContentEdges(sampleTvImageEdges(canvas, page.photos.map(item => item.slide.src).join('|'), {
          x: photoBounds.left, y: photoBounds.top, width: photoBounds.right - photoBounds.left, height: photoBounds.bottom - photoBounds.top,
        }));
      });
    } else if (cover) load(cover, image => {
      const areaWidth = BOARD_WIDTH - (photos ? 48 : 0);
      const areaHeight = stageHeight - (photos ? 48 : 0);
      const scale = Math.min(areaWidth / image.naturalWidth, areaHeight / image.naturalHeight);
      const width = image.naturalWidth * scale, height = image.naturalHeight * scale;
      context.drawImage(image, (BOARD_WIDTH - width) / 2, (stageHeight - height) / 2, width, height);
      setWallTvContentEdges(sampleTvImageEdges(image, cover));
    });
    else setWallTvContentEdges(TV_DARK_EDGES);
    context.textBaseline = 'top';
    context.fillStyle = '#F6F3EA';
    context.font = '500 17px "Manrope Variable", "Avenir Next", sans-serif';
    context.fillText(fittedText(context, talk?.topic || talk?.title || 'Talks & teaching', 1280), 17, 827);
    context.fillStyle = '#C3D0C7';
    context.font = '14px "Manrope Variable", "Avenir Next", sans-serif';
    context.fillText(fittedText(context, [talk?.date, talk?.venue].filter(Boolean).join(' · '), 1280), 17, 855);
    context.fillStyle = '#D3DED4';
    context.font = '17px "Manrope Variable", "Avenir Next", sans-serif';
    context.fillText(lectures.index >= 0 ? `${lectures.index + 1} / ${lectures.total}` : 'Record', 1510, 836);
    context.font = '14px "Manrope Variable", "Avenir Next", sans-serif';
    context.fillText(media?.slides.length ? `${media.slides.length} ${photos ? 'photos' : 'slides'}` : '', 1510, 861);
    texture.needsUpdate = true;
    return () => {
      cancelled = true;
      images.forEach(image => { image.onload = null; });
    };
  }, [texture, cover, talk, presentations]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}
