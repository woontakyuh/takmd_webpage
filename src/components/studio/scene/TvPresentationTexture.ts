import { useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { CanvasTexture, SRGBColorSpace } from 'three';
import type { Presentation } from '../types';
import { talkMedia } from '../collection';

type Props = {
  readonly cover: string | null;
  readonly talk: Presentation | null;
  readonly presentations: readonly Presentation[];
  readonly treeScrollOffset?: number;
};

const TREE_WIDTH = 304;
const FOOTER_HEIGHT = 80;

function fittedText(context: CanvasRenderingContext2D, text: string, width: number): string {
  if (context.measureText(text).width <= width) return text;
  let value = text;
  while (value.length > 1 && context.measureText(`${value}…`).width > width) value = value.slice(0, -1);
  return `${value}…`;
}

function wrappedText(context: CanvasRenderingContext2D, text: string, width: number): readonly string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  for (const word of words) {
    const candidate = lines.length ? `${lines.at(-1)} ${word}` : word;
    if (!lines.length || context.measureText(candidate).width > width) lines.push(word);
    else lines[lines.length - 1] = candidate;
  }
  if (lines.length <= 3) return lines;
  return [lines[0] ?? '', lines[1] ?? '', fittedText(context, lines.slice(2).join(' '), width)];
}

function drawLectureTree(context: CanvasRenderingContext2D, talk: Presentation | null, presentations: readonly Presentation[], scrollOffset: number): void {
  const ordered = presentations.toSorted((a, b) => b.date.localeCompare(a.date));
  const selectedYear = talk?.date.slice(0, 4) ?? ordered[0]?.date.slice(0, 4);
  const years = [...new Set(ordered.map(item => item.date.slice(0, 4)))];
  const yearTalks = ordered.filter(item => item.date.startsWith(selectedYear ?? ''));
  const dates = [...new Set(yearTalks.map(item => item.date))];
  const visibleDates = dates;

  context.fillStyle = '#182824';
  context.fillRect(0, 0, TREE_WIDTH, 900);
  context.save();
  context.beginPath();
  context.rect(0, 0, TREE_WIDTH, 900);
  context.clip();
  context.translate(0, -scrollOffset * 900);
  context.textBaseline = 'top';
  context.fillStyle = '#ADBEB3';
  context.font = '14px Arial';
  context.fillText('LECTURE ARCHIVE', 22, 22);
  const selectedYearIndex = Math.max(0, years.indexOf(selectedYear ?? ''));
  let yearTop = 62;
  for (const year of years.slice(0, selectedYearIndex)) {
    const count = ordered.filter(item => item.date.startsWith(year)).length;
    context.fillStyle = '#D3DED4';
    context.font = '17px Arial';
    context.fillText(`▸  ${year}`, 22, yearTop);
    context.fillStyle = '#93A399';
    context.font = '14px Arial';
    context.fillText(String(count), 270, yearTop + 2);
    yearTop += 63;
  }
  context.fillStyle = '#F6F3EA';
  context.font = '17px Arial';
  context.fillText(`▾  ${selectedYear ?? 'Talks'}`, 22, yearTop);
  context.fillStyle = '#93A399';
  context.font = '14px Arial';
  context.fillText(String(yearTalks.length), 270, yearTop + 2);

  let top = 137 + selectedYearIndex * 63;
  for (const date of visibleDates) {
    const items = yearTalks.filter(item => item.date === date);
    const label = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
      .format(new Date(`${date}T00:00:00Z`));
    context.fillStyle = '#93A399';
    context.font = '14px Arial';
    context.fillText(label, 34, top + 8);
    let entryTop = top + 25;
    for (const item of items) {
      const selected = item.id === talk?.id;
      context.font = selected ? '500 17px "Manrope Variable", "Avenir Next", sans-serif' : '17px "Manrope Variable", "Avenir Next", sans-serif';
      context.letterSpacing = '-0.34px';
      const lines = wrappedText(context, item.title, TREE_WIDTH - 70);
      const rowHeight = lines.length > 2 ? 85 : 62;
      if (selected) {
        context.fillStyle = '#355A50';
        context.fillRect(31, entryTop, TREE_WIDTH - 42, rowHeight);
        context.fillStyle = '#D9C596';
        context.fillRect(31, entryTop, 3, rowHeight);
      }
      context.fillStyle = selected ? '#FFFFFF' : '#D3DED4';
      lines.forEach((line, index) => context.fillText(line, 43, entryTop + 14 + index * 23));
      entryTop += rowHeight;
      if (entryTop > 844) break;
    }
    context.letterSpacing = '0px';
    top = entryTop + 29;
    if (top > 844) break;
  }

  const adjacentYears = years.slice(selectedYearIndex + 1, selectedYearIndex + 3);
  for (const year of adjacentYears) {
    if (top > 844) break;
    const count = ordered.filter(item => item.date.startsWith(year)).length;
    context.fillStyle = '#D3DED4';
    context.font = '17px Arial';
    context.fillText(`▸  ${year}`, 22, top);
    context.fillStyle = '#93A399';
    context.font = '14px Arial';
    context.fillText(String(count), 270, top + 2);
    top += 63;
  }
  context.restore();
}

export function useTvPresentationTexture({ cover, talk, presentations, treeScrollOffset = 0 }: Props) {
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
    const media = talkMedia.find(item => item.id === talk?.id);
    const current = Math.max(0, media?.slides.findIndex(slide => slide.src === cover) ?? 0);
    const count = media?.slides.length ?? 0;
    const photos = media?.kind === 'photos';
    drawLectureTree(context, talk, presentations, treeScrollOffset);
    let cancelled = false;
    void document.fonts.ready.then(() => {
      if (cancelled) return;
      drawLectureTree(context, talk, presentations, treeScrollOffset);
      texture.needsUpdate = true;
    });
    context.fillStyle = photos ? '#17241F' : '#F6F3EA';
    context.fillRect(TREE_WIDTH, 0, 1600 - TREE_WIDTH, 900 - FOOTER_HEIGHT);
    context.fillStyle = '#22312B';
    context.fillRect(TREE_WIDTH, 900 - FOOTER_HEIGHT, 1600 - TREE_WIDTH, FOOTER_HEIGHT);
    const images: HTMLImageElement[] = [];
    const load = (src: string, draw: (image: HTMLImageElement) => void) => {
      const image = new Image(); images.push(image);
      image.onload = () => { draw(image); texture.needsUpdate = true; };
      image.src = src;
    };
    if (cover) load(cover, image => {
      const areaWidth = 1600 - TREE_WIDTH - (photos ? 48 : 0);
      const areaHeight = 900 - FOOTER_HEIGHT - (photos ? 48 : 0);
      const scale = Math.min(areaWidth / image.naturalWidth, areaHeight / image.naturalHeight);
      const width = image.naturalWidth * scale, height = image.naturalHeight * scale;
      context.drawImage(image, TREE_WIDTH + (1600 - TREE_WIDTH - width) / 2, (900 - FOOTER_HEIGHT - height) / 2, width, height);
    });
    context.textBaseline = 'top';
    context.fillStyle = '#F6F3EA';
    context.font = '500 17px "Manrope Variable", "Avenir Next", sans-serif';
    context.fillText(fittedText(context, talk?.topic || talk?.title || 'Talks & teaching', 980), TREE_WIDTH + 17, 827);
    context.fillStyle = '#C3D0C7';
    context.font = '14px "Manrope Variable", "Avenir Next", sans-serif';
    context.fillText(fittedText(context, [talk?.date, talk?.venue].filter(Boolean).join(' · '), 980), TREE_WIDTH + 17, 855);
    context.fillStyle = '#D3DED4';
    context.font = '17px "Manrope Variable", "Avenir Next", sans-serif';
    context.fillText(count ? `${current + 1} / ${count}` : 'Record', 1510, 836);
    context.font = '14px "Manrope Variable", "Avenir Next", sans-serif';
    context.fillText(count ? (photos ? 'Photos' : 'Slides') : '', 1510, 861);
    texture.needsUpdate = true;
    return () => {
      cancelled = true;
      images.forEach(image => { image.onload = null; });
    };
  }, [texture, cover, talk, presentations, treeScrollOffset]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}
