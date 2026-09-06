import { useEffect, useMemo } from 'react';
import { CanvasTexture, SRGBColorSpace } from 'three';
import type { Presentation } from '../types';
import { PALETTE } from './config';

type PrintedSurface = 'folio' | 'gallery' | 'monitor' | 'wood' | 'stone' | 'linen' | 'board';

export function usePrintedTexture(surface: PrintedSurface) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = surface === 'board' ? 220 : 512;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = surface === 'monitor' || surface === 'board' ? PALETTE.ink : PALETTE.paperLight;
      context.fillRect(0, 0, 512, 512);
      context.textBaseline = 'top';
      switch (surface) {
        case 'stone':
        case 'linen': {
          context.fillStyle = PALETTE.white;
          context.fillRect(0, 0, 512, 512);
          let seed = 41;
          for (let i = 0; i < 18000; i += 1) {
            seed = (seed * 16807) % 2147483647;
            const x = seed % 512;
            seed = (seed * 16807) % 2147483647;
            const y = seed % 512;
            context.fillStyle = PALETTE.ink;
            context.globalAlpha = surface === 'linen' ? 0.12 : 0.04;
            context.fillRect(x, y, surface === 'linen' ? 1 : 2, surface === 'linen' ? 8 : 1);
          }
          context.globalAlpha = 1;
          break;
        }
        case 'wood':
          context.strokeStyle = PALETTE.walnutDark;
          for (let line = 0; line < 160; line += 1) {
            context.globalAlpha = 0.025 + (Math.sin(line * 2.4) + 1) * 0.025;
            context.lineWidth = 1 + (line % 3);
            context.beginPath();
            context.moveTo(0, line * 3.4);
            context.bezierCurveTo(150, line * 3.4 + Math.sin(line) * 7, 360, line * 3.4 - 8, 512, line * 3.4);
            context.stroke();
          }
          break;
        case 'folio':
          context.fillStyle = PALETTE.teal;
          context.fillRect(44, 54, 36, 4);
          context.font = '19px Arial';
          context.fillText('WOON TAK YUH', 44, 78);
          context.font = 'italic 58px Georgia';
          context.fillText('Research', 42, 196);
          context.font = '20px Arial';
          context.fillText('Selected publications', 44, 276);
          context.fillStyle = PALETTE.clay;
          context.fillRect(44, 385, 424, 2);
          context.font = '15px Arial';
          context.fillText('CLINICAL PRACTICE · EVIDENCE', 44, 420);
          break;
        case 'board':
        case 'gallery':
          context.fillStyle = PALETTE.paperLight;
          context.font = '17px Arial';
          context.fillText('01 / TOOLS OF THE PRACTICE', 32, 38);
          context.font = '36px Georgia';
          context.fillText('Endoscopic systems', 32, 83);
          context.fillStyle = PALETTE.tealLight;
          context.fillRect(32, 148, 448, 1);
          context.font = '14px Arial';
          context.fillText('YUH ET AL. / BIOENGINEERING / 2023', 32, 177);
          break;
        case 'monitor':
          context.fillStyle = PALETTE.tealLight;
          context.fillRect(0, 0, 12, 512);
          context.font = '600 17px Arial';
          context.fillText('PUBLISHED WORK / OPEN DOCUMENT', 38, 34);
          context.fillStyle = PALETTE.paperLight;
          context.font = 'italic 35px Georgia';
          drawWrappedText(context, 'Future of Endoscopic Spine Surgery: Insights from Cutting-Edge Technology in the Industrial Field', 38, 88, 430, 42, 4);
          context.fillStyle = PALETTE.stone;
          context.font = '16px Arial';
          context.fillText('BIOENGINEERING 10 (2023) 1363', 38, 316);
          context.fillText('YUH, LEE, JEON & CHOI', 38, 346);
          context.fillStyle = PALETTE.steel;
          context.fillRect(38, 395, 430, 1);
          context.fillStyle = PALETTE.paperLight;
          context.font = '15px Arial';
          context.fillText('doi.org/10.3390/bioengineering10121363', 38, 420);
          context.fillStyle = PALETTE.clay;
          context.fillRect(38, 464, 46, 4);
          break;
        default:
          throw new TypeError(surface satisfies never);
      }
    }
    const result = new CanvasTexture(canvas);
    result.colorSpace = SRGBColorSpace;
    result.anisotropy = 4;
    return result;
  }, [surface]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

type BoardRecord = Pick<Presentation, 'title' | 'date' | 'venue' | 'topic'> & {
  readonly status: 'DELIVERED' | 'UPCOMING';
};

export function usePresentationBoardTexture(presentations: readonly Presentation[]) {
  const records = useMemo<readonly BoardRecord[]>(() => {
    const today = new Date().toISOString().slice(0, 10);
    const dated = presentations.filter(({ date, title }) => date.length >= 10 && title.trim().length > 0);
    const delivered = dated.filter(({ date }) => date.slice(0, 10) <= today)
      .toSorted((a, b) => b.date.localeCompare(a.date));
    const upcoming = dated.filter(({ date }) => date.slice(0, 10) > today)
      .toSorted((a, b) => a.date.localeCompare(b.date));
    return [...delivered, ...upcoming].slice(0, 2).map((record) => ({
      ...record,
      status: record.date.slice(0, 10) <= today ? 'DELIVERED' : 'UPCOMING',
    }));
  }, [presentations]);

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 540;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = PALETTE.board;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = PALETTE.tealLight;
      context.fillRect(56, 48, 74, 5);
      context.fillStyle = PALETTE.paperLight;
      context.font = '600 25px Arial';
      context.fillText('TALKS & TEACHING', 56, 82);
      context.fillStyle = PALETTE.stone;
      context.font = 'italic 20px Georgia';
      context.fillText('Selected presentations', 56, 114);
      records.forEach((record, index) => {
        const top = 156 + index * 174;
        context.fillStyle = record.status === 'UPCOMING' ? PALETTE.clay : PALETTE.tealLight;
        context.font = '600 19px Arial';
        context.fillText(`${record.status}  ·  ${record.date.slice(0, 10)}`, 56, top);
        context.fillStyle = PALETTE.paperLight;
        context.font = 'italic 31px Georgia';
        drawWrappedText(context, record.title, 56, top + 38, 850, 38, 2);
        const detail = [record.topic, record.venue].filter((value) => value.trim().length > 0).join('  /  ');
        context.fillStyle = PALETTE.stone;
        context.font = '18px Arial';
        context.fillText(detail, 56, top + 124, 860);
      });
      if (records.length === 0) {
        context.fillStyle = PALETTE.stone;
        context.font = 'italic 32px Georgia';
        context.fillText('No public presentation record available', 56, 190);
      }
      context.fillStyle = PALETTE.steel;
      context.fillRect(56, 500, 912, 2);
    }
    const result = new CanvasTexture(canvas);
    result.colorSpace = SRGBColorSpace;
    result.anisotropy = 4;
    return result;
  }, [records]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

function drawWrappedText(context: CanvasRenderingContext2D, text: string, x: number, y: number,
  maxWidth: number, lineHeight: number, maxLines: number) {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let line = '';
  words.forEach((word) => {
    const candidate = line.length === 0 ? word : `${line} ${word}`;
    if (context.measureText(candidate).width <= maxWidth || line.length === 0) line = candidate;
    else {
      lines.push(line);
      line = word;
    }
  });
  if (line.length > 0) lines.push(line);
  lines.slice(0, maxLines).forEach((value, index) => context.fillText(value, x, y + index * lineHeight, maxWidth));
}
