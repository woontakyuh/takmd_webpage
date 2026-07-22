import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { ACCENT } from './config';

/**
 * Live visitor-local flip-clock face, drawn to a canvas texture each second.
 * Positioned to sit on the front face of the clock fallback body in config.ts.
 */
export function ClockFace({ position, rotation }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  const canvas = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 320;
    return c;
  }, []);
  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas);
    t.anisotropy = 4;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [canvas]);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  useEffect(() => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const draw = () => {
      const now = new Date();
      ctx.fillStyle = '#181a1f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#9a958a';
      ctx.font = '500 44px "JetBrains Mono Variable", monospace';
      ctx.fillText(
        now.toLocaleDateString(undefined, { month: 'short', day: '2-digit', weekday: 'short' }).toUpperCase(),
        canvas.width / 2,
        86,
      );
      ctx.fillStyle = '#e8e2d5';
      ctx.font = '600 118px "JetBrains Mono Variable", monospace';
      const hm = now.toLocaleTimeString(undefined, { hour12: false, hour: '2-digit', minute: '2-digit' });
      ctx.fillText(hm, canvas.width / 2, 208);
      ctx.fillStyle = ACCENT;
      ctx.font = '500 52px "JetBrains Mono Variable", monospace';
      ctx.fillText(now.getSeconds().toString().padStart(2, '0'), canvas.width / 2, 284);
      texture.needsUpdate = true;
    };
    draw();
    const id = window.setInterval(draw, 1000);
    return () => window.clearInterval(id);
  }, [canvas, texture]);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[0.15, 0.092]} />
      <meshStandardMaterial ref={materialRef} map={texture} roughness={0.4} emissive="#ffffff" emissiveMap={texture} emissiveIntensity={0.35} />
    </mesh>
  );
}
