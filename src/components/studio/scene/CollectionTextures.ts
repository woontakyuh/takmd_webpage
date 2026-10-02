import { useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
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
  const anisotropy = useThree(state => Math.max(1, Math.min(16, state.gl.capabilities.getMaxAnisotropy())));
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    const width = dark ? 1600 : 850;
    const height = dark ? 900 : 1200;
    const scale = dark ? 1 : 1.5;
    canvas.width = width * scale;
    canvas.height = height * scale;
    const context = canvas.getContext('2d');
    if (context) {
      context.scale(scale, scale);
      context.fillStyle = dark ? PALETTE.board : PALETTE.paperLight;
      context.fillRect(0, 0, width, height);
      context.textBaseline = 'top';
      context.fillStyle = dark ? PALETTE.tealLight : PALETTE.clay;
      context.fillRect(70, 80, 80, 5);
      context.font = '24px Arial';
      context.fillText(eyebrow, 70, 130, width - 140);
      context.fillStyle = dark ? PALETTE.paperLight : PALETTE.ink;
      context.font = dark ? '56px Georgia' : '46px Georgia';
      wrapped(context, title, 70, 230, width - 140, dark ? 76 : 66, 7);
      context.font = '26px Arial';
      wrapped(context, detail, 70, height - 210, width - 140, 38, 4);
    }
    const result = new CanvasTexture(canvas);
    result.colorSpace = SRGBColorSpace;
    result.anisotropy = dark ? Math.min(4, anisotropy) : anisotropy;
    return result;
  }, [title, eyebrow, detail, dark, anisotropy]);
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
      context.resetTransform();
      context.imageSmoothingQuality = 'high';
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
  const anisotropy = useThree(state => Math.max(1, Math.min(16, state.gl.capabilities.getMaxAnisotropy())));
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2560; canvas.height = 1440;
    const context = canvas.getContext('2d');
    if (context) {
      context.scale(2560 / 1440, 1440 / 810);
      context.textBaseline = 'top';
      context.fillStyle = PALETTE.paperLight; context.fillRect(0, 0, 1440, 810);
      context.fillStyle = PALETTE.teal; context.fillRect(60, 55, 32, 2);
      context.font = '16px Arial'; context.fillText('CURRICULUM VITAE / TAKMD', 107, 44);
      context.fillStyle = PALETTE.ink; context.font = '51px Georgia';
      context.fillText('Woon Tak Yuh, MD.', 60, 91);
      context.font = '19px Arial'; context.fillStyle = PALETTE.muted;
      context.fillText('Neurosurgeon · Research · Teaching', 60, 162);
      context.font = '17px Arial'; context.fillText(currentRoles[0], 60, 202);
      context.fillStyle = PALETTE.teal; context.font = '15px Arial';
      context.fillText('ACADEMIC INTERESTS', 60, 226);
      context.fillStyle = PALETTE.ink; context.font = '22px Arial';
      academicInterests.forEach((interest, index) => context.fillText(interest, 60, 259 + index * 31.9));
      context.fillStyle = PALETTE.line; context.fillRect(60, 362, 825, 1);
      context.fillStyle = PALETTE.teal; context.font = '15px Arial';
      context.fillText('ACADEMIC & PROFESSIONAL ACTIVITIES', 60, 386);
      const drawActivityText = (text: string, x: number, y: number, leading: number) => {
        let line = '';
        let baseline = y;
        for (const word of text.split(/\s+/)) {
          const next = line ? `${line} ${word}` : word;
          if (line && context.measureText(next).width > 396.5) {
            context.fillText(line, x, baseline);
            baseline += leading;
            line = word;
          } else line = next;
        }
        context.fillText(line, x, baseline);
        return baseline + leading;
      };
      const columnBaselines: [number, number] = [423, 423];
      activities.forEach((activity, index) => {
        const column = index < 5 ? 0 : 1;
        const x = column === 0 ? 60 : 488.5;
        const y = columnBaselines[column];
        context.fillStyle = PALETTE.ink;
        context.font = activity.organization === 'Neurospine' || activity.organization === 'JMISST' ? 'italic 17px Georgia' : '17px Arial';
        const roleY = drawActivityText(activity.organization, x, y, 20.4);
        context.fillStyle = PALETTE.muted; context.font = '16px Arial';
        columnBaselines[column] = drawActivityText(activity.role, x, roleY + 3, 19.2) + 8;
      });
      context.fillStyle = PALETTE.line; context.fillRect(60, 756, 1320, 1);
      context.fillStyle = PALETTE.teal; context.font = '15px Arial';
      context.fillText('CAREER · EDUCATION · PUBLICATIONS · TEACHING', 60, 772);
    }
    const result = new CanvasTexture(canvas); result.colorSpace = SRGBColorSpace; result.anisotropy = anisotropy;
    return result;
  }, [anisotropy]);
  useEffect(() => {
    let active = true;
    const portrait = new Image();
    portrait.onload = () => {
      if (!active || !(texture.image instanceof HTMLCanvasElement)) return;
      const context = texture.image.getContext('2d');
      if (!context) return;
      context.imageSmoothingQuality = 'high';
      context.drawImage(portrait, 960, 128, 420, 560);
      texture.needsUpdate = true;
    };
    portrait.src = profileImage;
    return () => { active = false; portrait.onload = null; };
  }, [texture]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}
