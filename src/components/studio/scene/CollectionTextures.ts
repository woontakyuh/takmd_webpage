import { createElement, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { useThree } from '@react-three/fiber';
import { CanvasTexture, SRGBColorSpace } from 'three';
import { CvCover } from '../CvReader';
import { captureMonitorSurface } from './MonitorSurfaceSnapshot';
import { monitorReadingSize } from './monitorReading';
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

export function useWorkstationTexture(enabled = true) {
  const size = useThree(state => state.size);
  const invalidate = useThree(state => state.invalidate);
  const anisotropy = useThree(state => Math.max(1, Math.min(16, state.gl.capabilities.getMaxAnisotropy())));
  const mobile = size.width < 760 || (size.height < 500 && window.matchMedia('(pointer: coarse)').matches);
  const width = mobile ? monitorReadingSize(size.width, size.height) : 1440;
  const height = width * 9 / 16;
  const pixelRatio = Math.min(2, 2560 / width);
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = enabled ? Math.ceil(width * pixelRatio) : 1;
    canvas.height = enabled ? Math.ceil(height * pixelRatio) : 1;
    const context = canvas.getContext('2d');
    if (context) { context.fillStyle = PALETTE.paperLight; context.fillRect(0, 0, canvas.width, canvas.height); }
    const result = new CanvasTexture(canvas);
    result.colorSpace = SRGBColorSpace; result.anisotropy = anisotropy;
    return result;
  }, [anisotropy, enabled, width, height, pixelRatio]);
  useEffect(() => {
    if (!enabled) return;
    const host = document.createElement('div');
    host.className = mobile ? 'monitor-inline-reader' : '';
    host.setAttribute('aria-hidden', 'true');
    host.inert = true;
    Object.assign(host.style, { position: 'fixed', left: '-10000px', top: '0', width: `${width}px`, height: `${height}px`, pointerEvents: 'none' });
    document.body.append(host);
    const root = createRoot(host);
    let active = true, disposed = false;
    const dispose = () => { if (!disposed) { disposed = true; root.unmount(); host.remove(); } };
    const capture = async (element: HTMLDivElement | null) => {
      if (!element) return;
      await document.fonts.ready;
      await Promise.allSettled([...element.querySelectorAll('img')].map(image => image.decode()));
      if (!active) return;
      if (await captureMonitorSurface(element, texture, pixelRatio)) invalidate();
      queueMicrotask(dispose);
    };
    root.render(createElement('section', { className: 'monitor-screen-reader', 'data-active': 'false', style: { width, height } },
      createElement('div', { className: 'monitor-screen-content', ref: (element: HTMLDivElement | null) => { void capture(element); } }, createElement(CvCover))));
    return () => { active = false; queueMicrotask(dispose); };
  }, [enabled, mobile, width, height, pixelRatio, texture, invalidate]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}
