import { useEffect, useMemo } from 'react';
import { CanvasTexture, Mesh, SRGBColorSpace } from 'three';
import { createLumbarBox } from './LumbarBoxGeometry';

export function EndoscopicLumbarBox() {
  const model = useMemo(createLumbarBox, []);
  const badge = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = '#454B4E';
      context.fillRect(0, 0, 256, 64);
      context.fillStyle = '#ECEDEA';
      context.font = '32px Arial, sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText('UpSurgeOn', 128, 34);
    }
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    return texture;
  }, []);
  useEffect(() => () => {
    model.traverse(node => {
      if (!(node instanceof Mesh)) return;
      node.geometry.dispose();
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      materials.forEach(material => material.dispose());
    });
    badge.dispose();
  }, [model, badge]);
  return (
    <group position={[0, -0.013, 0]}>
      <primitive object={model} dispose={null} />
      <mesh name="LumbarBox manufacturer badge" position={[0, 0.051, 0.1917]}>
        <planeGeometry args={[0.074, 0.017]} />
        <meshStandardMaterial map={badge} roughness={0.38} metalness={0.55} />
      </mesh>
    </group>
  );
}
