import { useTexture } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { SRGBColorSpace } from 'three';

export function MacMiniStickers({ onClaudeSticker }: { readonly onClaudeSticker: () => void }) {
  const { gl } = useThree();
  const pointerStart = useRef<{ readonly x: number; readonly y: number } | null>(null);
  useEffect(() => {
    const rejectMultitouch = (event: PointerEvent) => { if (!event.isPrimary) pointerStart.current = null; };
    gl.domElement.addEventListener('pointerdown', rejectMultitouch);
    return () => gl.domElement.removeEventListener('pointerdown', rejectMultitouch);
  }, [gl]);
  const [claudeSource, codexSource] = useTexture(['/studio/stickers/claude-heart.png', '/studio/stickers/codex-pet.png']);
  const textures = useMemo(() => [claudeSource, codexSource].map(source => {
    const texture = source.clone();
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
    return texture;
  }), [claudeSource, codexSource]);
  useEffect(() => () => textures.forEach(texture => texture.dispose()), [textures]);

  return <group name="Mac mini character stickers">
    <mesh name="Claude heart sticker" position={[-0.032, 0.0502, 0.038]} rotation={[-Math.PI / 2, 0, -0.07]}
      onPointerDown={event => {
        event.stopPropagation();
        pointerStart.current = event.button === 0 && event.isPrimary && !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey
          ? { x: event.clientX, y: event.clientY } : null;
      }}
      onPointerCancel={() => { pointerStart.current = null; }}
      onClick={event => {
        event.stopPropagation();
        const start = pointerStart.current;
        pointerStart.current = null;
        if (!start || event.delta >= 5 || event.shiftKey || event.ctrlKey || event.metaKey || event.altKey
          || Math.hypot(event.clientX - start.x, event.clientY - start.y) >= 5) return;
        onClaudeSticker();
      }}>
      <planeGeometry args={[0.028, 0.02128]} />
      <meshBasicMaterial map={textures[0]} transparent alphaTest={0.3} toneMapped={false} />
    </mesh>
    <mesh name="Codex pet sticker" position={[-0.003, 0.0502, 0.038]} rotation={[-Math.PI / 2, 0, 0.06]}>
      <planeGeometry args={[0.0248, 0.0237]} />
      <meshBasicMaterial map={textures[1]} transparent alphaTest={0.3} toneMapped={false} />
    </mesh>
  </group>;
}
