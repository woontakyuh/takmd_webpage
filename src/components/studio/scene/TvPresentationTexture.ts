import { useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { CanvasTexture, SRGBColorSpace } from 'three';
import type { Presentation } from '../types';
import { talkMedia } from '../collection';
import { tvPreviews } from './tvPreviews';

type Props = {
  readonly cover: string | null;
  readonly talk: Presentation | null;
  readonly presentations: readonly Presentation[];
};

export function useTvPresentationTexture({ cover, talk, presentations }: Props) {
  const anisotropy = useThree(state => Math.min(4, state.gl.capabilities.getMaxAnisotropy()));
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1600; canvas.height = 900;
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
    const { previews, heading, current, count } = tvPreviews(cover, talk, presentations);
    const media = talkMedia.find(item => item.id === talk?.id);
    const photos = media?.kind === 'photos';
    context.fillStyle = '#151E1B'; context.fillRect(0, 0, 1600, 900);
    context.fillStyle = '#F6F3EA'; context.fillRect(0, 0, 1200, 900);
    context.fillStyle = '#22312B'; context.fillRect(1200, 0, 400, 900);
    context.textBaseline = 'top'; context.fillStyle = '#D3DED4'; context.font = '20px Arial';
    context.fillText(heading, 1240, 35);
    context.fillStyle = '#26332C'; context.font = '38px Georgia';
    context.fillText(talk?.topic || talk?.title || 'Talks & teaching', 42, 64, 1116);
    context.font = '23px Arial'; context.fillText(talk?.venue ?? '', 42, 125, 1116);
    const images: HTMLImageElement[] = [];
    const load = (src: string, draw: (image: HTMLImageElement) => void) => {
      const image = new Image(); images.push(image);
      image.onload = () => { draw(image); texture.needsUpdate = true; };
      image.src = src;
    };
    if (cover) load(cover, image => {
      context.fillStyle = photos ? '#17241F' : '#F6F3EA'; context.fillRect(0, 0, 1200, 900);
      const areaWidth = photos ? 1152 : 1200, areaHeight = photos ? 716 : 900;
      const scale = Math.min(areaWidth / image.naturalWidth, areaHeight / image.naturalHeight);
      const width = image.naturalWidth * scale, height = image.naturalHeight * scale;
      context.drawImage(image, photos ? (1200 - width) / 2 : 0, (areaHeight - height) / 2 + (photos ? 24 : 0), width, height);
      if (photos) {
        context.fillStyle = '#F6F3EA'; context.font = '36px Arial';
        context.fillText(talk?.title ?? '', 40, 768, 1120);
        context.fillStyle = '#C3D0C7'; context.font = '23px Arial';
        context.fillText([media.role, talk?.topic, talk?.date, talk?.venue].filter(Boolean).join(' · '), 40, 829, 1120);
      }
    });
    previews.forEach((preview, index) => {
      const top = 94 + index * 255;
      context.fillStyle = '#101814'; context.fillRect(1240, top, 320, 194);
      context.strokeStyle = preview.active ? '#D9C596' : '#516158';
      context.lineWidth = preview.active ? 4 : 1; context.strokeRect(1239, top - 1, 322, 196);
      context.fillStyle = '#D3DED4'; context.font = '17px Arial';
      context.fillText(preview.caption, 1240, top + 206, 320);
      load(preview.src, image => {
        const scale = Math.min(312 / image.naturalWidth, 186 / image.naturalHeight);
        const width = image.naturalWidth * scale, height = image.naturalHeight * scale;
        context.drawImage(image, 1240 + (320 - width) / 2, top + (194 - height) / 2, width, height);
      });
    });
    if (count > 1) {
      context.font = '32px Arial'; context.textAlign = 'center';
      for (const [x, glyph, enabled] of [[1240, '←', current > 0], [1430, '→', current < count - 1]] as const) {
        context.strokeStyle = enabled ? '#8E9C91' : '#3D4B42'; context.lineWidth = 1;
        context.strokeRect(x, 844, 130, 44); context.fillStyle = enabled ? '#EDF0E9' : '#627067';
        context.fillText(glyph, x + 65, 848);
      }
      context.textAlign = 'left';
    }
    texture.needsUpdate = true;
    return () => images.forEach(image => { image.onload = null; });
  }, [texture, cover, talk, presentations]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}
