import { useEffect, useMemo } from 'react';
import { CanvasTexture, SRGBColorSpace } from 'three';
import { projectById, projects } from '../projects';
import type { ProjectId } from '../types';
import { PALETTE } from './config';

type Surface = {
  readonly image: string | null;
  readonly title: string;
  readonly eyebrow: string;
  readonly detail: string;
  readonly dark?: boolean;
};

function wrapped(context: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, leading: number, limit: number) {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (context.measureText(next).width > width && line) { lines.push(line); line = word; }
    else line = next;
  }
  if (line) lines.push(line);
  lines.slice(0, limit).forEach((value, index) => context.fillText(value, x, y + index * leading, width));
}

export function useDocumentTexture({ image, title, eyebrow, detail, dark = false }: Surface) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = dark ? 1600 : 850;
    canvas.height = dark ? 944 : 1200;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = dark ? PALETTE.board : PALETTE.paperLight;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.textBaseline = 'top';
      context.fillStyle = dark ? PALETTE.tealLight : PALETTE.clay;
      context.fillRect(70, 80, 80, 5);
      context.font = '24px Arial';
      context.fillText(eyebrow, 70, 130, canvas.width - 140);
      context.fillStyle = dark ? PALETTE.paperLight : PALETTE.ink;
      context.font = dark ? '56px Georgia' : '46px Georgia';
      wrapped(context, title, 70, 230, canvas.width - 140, dark ? 76 : 66, 7);
      context.font = '26px Arial';
      wrapped(context, detail, 70, canvas.height - 210, canvas.width - 140, 38, 4);
    }
    const result = new CanvasTexture(canvas);
    result.colorSpace = SRGBColorSpace;
    result.anisotropy = 4;
    return result;
  }, [title, eyebrow, detail, dark]);
  useEffect(() => {
    if (!image) return;
    let active = true;
    const source = new Image();
    source.onload = () => {
      if (!active) return;
      const canvas: unknown = texture.image;
      if (!(canvas instanceof HTMLCanvasElement)) return;
      const context = canvas.getContext('2d');
      if (!context) return;
      context.fillStyle = dark ? PALETTE.board : PALETTE.paperLight;
      context.fillRect(0, 0, canvas.width, canvas.height);
      const scale = Math.min(canvas.width / source.naturalWidth, canvas.height / source.naturalHeight);
      const width = source.naturalWidth * scale;
      const height = source.naturalHeight * scale;
      context.drawImage(source, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
      texture.needsUpdate = true;
    };
    source.src = image;
    return () => { active = false; source.onload = null; };
  }, [texture, image, dark]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

export function useWorkstationTexture(selected: ProjectId | null) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048; canvas.height = 920;
    const context = canvas.getContext('2d');
    const project = projectById(selected);
    if (context) {
      context.fillStyle = PALETTE.ink; context.fillRect(0, 0, 2048, 920);
      context.fillStyle = PALETTE.tealLight; context.fillRect(70, 62, 8, 30);
      context.font = '25px Arial'; context.fillText('TAKMD  /  WORKSTATION', 100, 87);
      context.fillStyle = PALETTE.paperLight; context.font = '76px Georgia';
      context.fillText(project?.title ?? 'Questions worth working on.', 90, 245, 1830);
      context.fillStyle = PALETTE.stone; context.font = '28px Arial';
      context.fillText(project?.eyebrow ?? 'Clinical AI, research & the working process.', 94, 315);
      const steps = project?.steps ?? projects.map(item => item.title);
      const gap = 1840 / steps.length;
      context.strokeStyle = PALETTE.tealLight; context.lineWidth = 2;
      context.beginPath(); context.moveTo(100, 540); context.lineTo(100 + (steps.length - 1) * gap, 540); context.stroke();
      steps.forEach((step, index) => {
        const x = 100 + index * gap;
        context.fillStyle = PALETTE.ink; context.beginPath(); context.arc(x, 540, 28, 0, Math.PI * 2); context.fill(); context.stroke();
        context.fillStyle = PALETTE.paperLight; context.font = '22px Arial'; context.fillText(String(index + 1).padStart(2, '0'), x - 13, 548);
        context.font = '29px Arial'; wrapped(context, step, x - 10, 625, gap - 55, 42, 3);
      });
      context.fillStyle = PALETTE.steel; context.fillRect(90, 820, 1868, 1);
      context.fillStyle = PALETTE.stone; context.font = '22px Arial';
      context.fillText(project ? 'OPEN PROJECT / FOLLOW THE WORK' : 'SELECT A PROJECT IN THE READER', 90, 865);
    }
    const result = new CanvasTexture(canvas); result.colorSpace = SRGBColorSpace; result.anisotropy = 4;
    return result;
  }, [selected]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}
