import { useEffect, useMemo } from 'react';
import { CanvasTexture, SRGBColorSpace } from 'three';
import { PALETTE } from './config';
import { Block } from './Primitives';

export function OfficeGuide({ compact }: { readonly compact: boolean }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 160;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = PALETTE.paperLight;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = PALETTE.ink;
      context.font = '36px Arial';
      const instructions = compact
        ? ['Drag to rotate', 'Two fingers to move', 'Pinch to zoom', 'Tap to open']
        : ['Drag to rotate', 'Shift + drag to move', 'Scroll to zoom', 'Click to open'];
      instructions.forEach((text, index) => context.fillText(text, index % 2 === 0 ? 60 : 670, index < 2 ? 56 : 127));
      context.strokeStyle = PALETTE.line;
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(625, 22);
      context.lineTo(625, 141);
      context.stroke();

    }
    const result = new CanvasTexture(canvas);
    result.colorSpace = SRGBColorSpace;
    result.anisotropy = 4;
    return result;
  }, [compact]);
  useEffect(() => () => texture.dispose(), [texture]);

  return <group name="Office controls guide" position={[0, 1.07, 3.313]} rotation={[0, Math.PI, 0]}>
    <Block size={[1.68, 0.22, 0.012]} color={PALETTE.stone} radius={0.004} roughness={0.85} />
    <mesh position={[0, 0, 0.0065]}>
      <planeGeometry args={[1.656, 0.207]} />
      <meshStandardMaterial map={texture} roughness={0.95} />
    </mesh>
  </group>;
}
