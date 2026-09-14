import { useEffect, useMemo } from 'react';
import { CanvasTexture, SRGBColorSpace } from 'three';
import type { BeosoundState } from './Beosound9000State';
import { BEOSOUND_PANEL_KEYS } from './BeosoundPanel';
import { beosoundDisplay } from './Beosound9000State';

function texture(canvas: HTMLCanvasElement): CanvasTexture {
  const map = new CanvasTexture(canvas);
  map.colorSpace = SRGBColorSpace;
  map.anisotropy = 4;
  return map;
}

export function useBeosoundPanelTexture(state: BeosoundState) {
  const label = beosoundDisplay(state);
  const map = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048; canvas.height = 256;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = '#101210'; context.fillRect(0, 0, 2048, 256);
      context.fillStyle = '#b7bcb7'; context.font = '22px Arial, sans-serif';
      context.fillText('BANG & OLUFSEN', 32, 55);
      context.fillStyle = '#e66f4e'; context.font = '30px monospace';
      context.fillText(label, 32, 163);
      context.fillStyle = '#b7bcb7'; context.font = '24px Arial, sans-serif';
      context.textAlign = 'center';
      for (const key of BEOSOUND_PANEL_KEYS) context.fillText(key.label, key.x, key.y);
    }
    return texture(canvas);
  }, [label]);
  useEffect(() => () => map.dispose(), [map]);
  return map;
}

export function useCompactDiscTexture() {
  const map = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const context = canvas.getContext('2d');
    if (context) {
      const sheen = context.createConicGradient(.3, 256, 256);
      for (const [stop, color] of [[0, '#bbc1bd'], [.12, '#e2e5de'], [.23, '#bbc1c5'], [.34, '#d9ded1'],
        [.49, '#9da8aa'], [.6, '#dfe5e3'], [.75, '#b4b9be'], [.87, '#e2e4db'], [1, '#bbc1bd']] as const) sheen.addColorStop(stop, color);
      context.fillStyle = sheen; context.fillRect(0, 0, 512, 512);
      for (let radius = 65; radius < 254; radius += 2) {
        context.beginPath(); context.arc(256, 256, radius, 0, Math.PI * 2);
        context.strokeStyle = `rgba(240,245,240,${radius % 3 === 0 ? .13 : .04})`;
        context.lineWidth = .6; context.stroke();
      }
    }
    return texture(canvas);
  }, []);
  useEffect(() => () => map.dispose(), [map]);
  return map;
}
