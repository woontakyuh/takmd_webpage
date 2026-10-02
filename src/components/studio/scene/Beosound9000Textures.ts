import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BEOSOUND_ALBUMS } from './BeosoundAlbums';
import { CanvasTexture, SRGBColorSpace } from 'three';
import type { BeosoundState } from './Beosound9000State';
import { BEOSOUND_PANEL_KEYS, panelKeyAppearance } from './BeosoundPanel';
import { beosoundDisplay } from './Beosound9000State';

function texture(canvas: HTMLCanvasElement): CanvasTexture {
  const map = new CanvasTexture(canvas);
  map.colorSpace = SRGBColorSpace;
  map.anisotropy = 4;
  return map;
}

export function useBeosoundPanelTexture(state: BeosoundState) {
  const label = beosoundDisplay(state);
  const albumId = state.slots[state.disc - 1];
  const album = albumId ? BEOSOUND_ALBUMS[albumId] : undefined;
  const track = album?.tracks.find(item => item.number === state.track);
  const title = track ? `${String(state.track).padStart(2, '0')} · ${track.title} · ${album?.artist}` : '';
  const reducedMotion = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);
  const elapsed = useRef(0), lastPaint = useRef(-1);
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
      context.save(); context.beginPath(); context.rect(32, 180, 620, 54); context.clip();
      context.font = '26px Arial, sans-serif'; context.fillStyle = '#f0b58b'; context.fillText(title, 32, 222); context.restore();
      context.textAlign = 'center';
      for (const key of BEOSOUND_PANEL_KEYS) {
        const appearance = panelKeyAppearance(key, state);
        context.fillStyle = appearance.selected ? '#ffbf83' : appearance.primary ? (appearance.available ? '#f5f0e6' : '#69716c') : '#b7bcb7';
        context.font = appearance.primary ? '600 30px Arial, sans-serif' : '24px Arial, sans-serif';
        context.fillText(key.label, key.x, key.y);
        if (appearance.selected) context.fillRect(key.x - 13, key.y + 12, 26, 3);
      }
    }
    return texture(canvas);
  }, [label, state, title]);
  useEffect(() => { elapsed.current = 0; lastPaint.current = -1; }, [map]);
  useFrame((_, delta) => {
    if (state.playback !== 'playing' || !title || reducedMotion) return;
    const canvas: HTMLCanvasElement = map.image;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.font = '26px Arial, sans-serif';
    const width = context.measureText(title).width;
    if (width <= 620) return;
    elapsed.current += delta;
    const frame = Math.floor(elapsed.current * 15);
    if (frame === lastPaint.current) return;
    lastPaint.current = frame;
    const offset = Math.max(0, elapsed.current - 2) * 38 % (width + 64);
    context.save(); context.beginPath(); context.rect(32, 180, 620, 54); context.clip();
    context.fillStyle = '#101210'; context.fillRect(32, 180, 620, 54);
    context.textAlign = 'left'; context.fillStyle = '#f0b58b';
    context.fillText(title, 32 - offset, 222); context.fillText(title, 32 - offset + width + 64, 222);
    context.restore(); map.needsUpdate = true;
  });
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
