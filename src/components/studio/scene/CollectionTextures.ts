import { useEffect, useMemo } from 'react';
import { CanvasTexture, SRGBColorSpace } from 'three';
import { academicInterests, activities, currentRoles, profileImage } from '../../../data/cv';
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
    canvas.height = dark ? 900 : 1200;
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

export function useWorkstationTexture() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1920; canvas.height = 1080;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = PALETTE.paperLight; context.fillRect(0, 0, 1920, 1080);
      context.fillStyle = PALETTE.teal; context.fillRect(80, 66, 42, 3);
      context.font = '21px Arial'; context.fillText('LIVING CV  /  TAKMD', 142, 78);
      context.fillStyle = PALETTE.ink; context.font = '68px Georgia';
      context.fillText('Woon Tak Yuh, MD.', 80, 184);
      context.font = '25px Arial'; context.fillStyle = PALETTE.muted;
      context.fillText('Neurosurgeon · Research · Teaching', 83, 234);
      context.font = '23px Arial'; context.fillText(currentRoles[0], 83, 277, 1260);
      context.fillStyle = PALETTE.teal; context.font = '20px Arial';
      context.fillText('ACADEMIC INTERESTS', 80, 347);
      context.fillStyle = PALETTE.ink; context.font = '29px Arial';
      academicInterests.forEach((interest, index) => context.fillText(interest, 80, 393 + index * 45));
      context.strokeStyle = PALETTE.line; context.lineWidth = 2;
      context.beginPath(); context.moveTo(80, 538); context.lineTo(1840, 538); context.stroke();
      context.fillStyle = PALETTE.teal; context.font = '20px Arial';
      context.fillText('ACADEMIC & PROFESSIONAL ACTIVITIES', 80, 583);
      activities.forEach((activity, index) => {
        const x = index < 5 ? 80 : 1035;
        const y = 635 + (index % 5) * 78;
        context.fillStyle = PALETTE.ink;
        context.font = activity.organization === 'Neurospine' || activity.organization === 'JMISST' ? 'italic 26px Georgia' : '25px Arial';
        context.fillText(activity.organization, x, y, index < 5 ? 885 : 800);
        context.fillStyle = PALETTE.muted; context.font = '23px Arial';
        context.fillText(activity.role, x, y + 32, index < 5 ? 885 : 800);
      });
      context.fillStyle = PALETTE.line; context.fillRect(80, 1014, 1760, 1);
      context.fillStyle = PALETTE.teal; context.font = '20px Arial';
      context.fillText('CAREER · EDUCATION · PUBLICATIONS · TEACHING', 80, 1055);

    }
    const result = new CanvasTexture(canvas); result.colorSpace = SRGBColorSpace; result.anisotropy = 4;
    return result;
  }, []);
  useEffect(() => {
    let active = true;
    const portrait = new Image();
    portrait.onload = () => {
      if (!active || !(texture.image instanceof HTMLCanvasElement)) return;
      const context = texture.image.getContext('2d');
      if (!context) return;
      context.drawImage(portrait, 1560, 82, 260, 260 * 4 / 3);
      texture.needsUpdate = true;
    };
    portrait.src = profileImage;
    return () => { active = false; portrait.onload = null; };
  }, [texture]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}
