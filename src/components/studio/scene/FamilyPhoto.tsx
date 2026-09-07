import { useTexture } from '@react-three/drei';
import { useEffect, useMemo, useState } from 'react';
import { SRGBColorSpace } from 'three';
import type { StudioSceneProps } from '../types';
import photos from '../../../data/photo-frame.json';
import { profileImage } from '../../../data/cv';
import { Interactive } from './Interactive';
import { Block } from './Primitives';

function Photograph({ src }: { readonly src: string }) {
  const source = useTexture(src);
  const texture = useMemo(() => {
    const copy = source.clone(); copy.colorSpace = SRGBColorSpace; copy.anisotropy = 4; copy.needsUpdate = true;
    return copy;
  }, [source]);
  useEffect(() => () => texture.dispose(), [texture]);
  const image = source.image;
  const ratio = image instanceof HTMLImageElement ? image.naturalWidth / image.naturalHeight : 4 / 3;
  const width = Math.min(0.21, 0.146 * ratio), height = width / ratio;
  return <mesh position={[0, 0, 0.0102]}><planeGeometry args={[width, height]} /><meshStandardMaterial map={texture} emissiveMap={texture} emissive="#ffffff" emissiveIntensity={0.15} roughness={0.4} /></mesh>;
}

export function FamilyPhoto(props: Pick<StudioSceneProps, 'selected' | 'onSelect' | 'reducedMotion'>) {
  const [photo] = useState(() => {
    const choices: readonly { readonly src: string }[] = photos;
    if (!choices.length) return profileImage;
    let previous: string | null = null;
    try { previous = sessionStorage.getItem('takmd-frame-photo'); } catch { /* Storage can be unavailable in private browsing. */ }
    const candidates = choices.length > 1 ? choices.filter(item => item.src !== previous) : choices;
    const selected = candidates[Math.floor(Math.random() * candidates.length)].src;
    try { sessionStorage.setItem('takmd-frame-photo', selected); } catch { /* Photo selection remains available without storage. */ }
    return selected;
  });
  return <Interactive id="family" {...props} position={[-0.72, 0.874, -0.23]}>
    <group rotation={[-0.16, 0.13, 0]}>
      <Block size={[0.246, 0.19, 0.018]} color="#30332F" radius={0.0025} roughness={0.48} />
      <Block size={[0.23, 0.174, 0.001]} position={[0, 0, 0.0095]} color="#151815" radius={0.0004} />
      <Photograph src={photo} />
      <Block size={[0.052, 0.139, 0.006]} position={[0, -0.018, -0.048]} rotation={[-0.42, 0, 0]} color="#30332F" radius={0.002} roughness={0.6} />
    </group>
  </Interactive>;
}
