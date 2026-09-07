import { useTexture } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { SRGBColorSpace } from 'three';

export function MacMiniStickers() {
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
    <mesh name="Claude heart sticker" position={[-0.032, 0.0502, 0.038]} rotation={[-Math.PI / 2, 0, -0.07]}>
      <planeGeometry args={[0.028, 0.02128]} />
      <meshBasicMaterial map={textures[0]} transparent alphaTest={0.3} toneMapped={false} />
    </mesh>
    <group position={[-0.007, 0.0502, 0.038]} rotation={[-Math.PI / 2, 0, 0.06]}>
      <mesh><planeGeometry args={[0.020, 0.02087]} /><meshStandardMaterial color="#faf9f4" roughness={0.7} /></mesh>
      <mesh name="Codex pet sticker" position={[0, 0, 0.00002]}>
        <planeGeometry args={[0.018, 0.01887]} />
        <meshBasicMaterial map={textures[1]} toneMapped={false} />
      </mesh>
    </group>
  </group>;
}
