import { useEffect, useMemo } from 'react';
import { CanvasTexture, SRGBColorSpace } from 'three';

export function WindowSky({ colors }: { readonly colors: readonly [string, string] }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 16; canvas.height = 256;
    const result = new CanvasTexture(canvas);
    result.colorSpace = SRGBColorSpace;
    return result;
  }, []);
  const [top, bottom] = colors;
  useEffect(() => {
    const canvas = texture.image;
    if (!(canvas instanceof HTMLCanvasElement)) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, top); gradient.addColorStop(1, bottom);
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 16, 256);
    texture.needsUpdate = true;
  }, [top, bottom, texture]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <mesh position={[-2.445, 1.45, -0.35]} rotation={[0, Math.PI / 2, 0]}>
    <planeGeometry args={[2, 1.55]} />
    <meshBasicMaterial map={texture} toneMapped={false} />
  </mesh>;
}
