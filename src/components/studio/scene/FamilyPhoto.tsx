import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MathUtils, SRGBColorSpace, Vector3 } from 'three';
import type { MeshStandardMaterial } from 'three';
import type { StudioSceneProps } from '../types';
import photos from '../../../data/photo-frame.json';
import { profileImage } from '../../../data/cv';
import { Interactive } from './Interactive';
import { Block } from './Primitives';
import { ROOM } from './config';

const FRAME_TILT = -0.16;
const FRAME_RADIUS = 0.0025;
const FRAME_CENTER_Y = (0.095 - FRAME_RADIUS) * Math.cos(FRAME_TILT)
  + (0.009 - FRAME_RADIUS) * Math.abs(Math.sin(FRAME_TILT)) + FRAME_RADIUS;
const EASEL_HINGE = new Vector3(0, 0.038, -0.0115)
  .applyAxisAngle(new Vector3(1, 0, 0), FRAME_TILT).add(new Vector3(0, FRAME_CENTER_Y, 0));
const EASEL_FOOT = new Vector3(0, 0.003, -0.1);
const EASEL_CENTER = EASEL_HINGE.clone().add(EASEL_FOOT).multiplyScalar(0.5);
const EASEL_LENGTH = EASEL_HINGE.distanceTo(EASEL_FOOT);
const EASEL_ANGLE = Math.atan2(EASEL_HINGE.z - EASEL_FOOT.z, EASEL_HINGE.y - EASEL_FOOT.y);

function Photograph({ src, hovered, reducedMotion }: { readonly src: string; readonly hovered: boolean; readonly reducedMotion: boolean }) {
  const source = useTexture(src);
  const material = useRef<MeshStandardMaterial>(null);
  const texture = useMemo(() => {
    const copy = source.clone(); copy.colorSpace = SRGBColorSpace; copy.anisotropy = 4; copy.needsUpdate = true;
    return copy;
  }, [source]);
  useEffect(() => () => texture.dispose(), [texture]);
  const image = source.image;
  const ratio = image instanceof HTMLImageElement ? image.naturalWidth / image.naturalHeight : 4 / 3;
  const width = Math.min(0.21, 0.146 * ratio), height = width / ratio;
  useFrame((_, delta) => {
    if (!material.current) return;
    const targetBrightness = hovered ? 0.32 : 0.1;
    material.current.emissiveIntensity = reducedMotion ? targetBrightness
      : MathUtils.damp(material.current.emissiveIntensity, targetBrightness, 8, delta);
  });
  return <mesh position={[0, 0, 0.0102]}><planeGeometry args={[width, height]} /><meshStandardMaterial ref={material} map={texture} emissiveMap={texture} emissive="#ffffff" emissiveIntensity={0.1} roughness={0.4} /></mesh>;
}

export function FamilyPhoto(props: Pick<StudioSceneProps, 'selected' | 'onSelect' | 'reducedMotion'>) {
  const [hovered, setHovered] = useState(false);
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
  return <Interactive id="family" {...props} position={[-0.72, 0.0185 + ROOM.desk.height, -0.23]} rotation={0.13} onHoverChange={setHovered}>
    <group name="photo-frame-body" position={[0, FRAME_CENTER_Y, 0]} rotation={[FRAME_TILT, 0, 0]}>
      <Block size={[0.246, 0.19, 0.018]} color="#30332F" radius={0.0025} roughness={0.48} />
      <Block size={[0.23, 0.174, 0.001]} position={[0, 0, 0.0095]} color="#151815" radius={0.0004} />
      <Photograph src={photo} hovered={hovered} reducedMotion={props.reducedMotion} />
    </group>
    <group name="photo-frame-hinged-easel">
      <mesh name="photo-frame-easel-hinge" position={EASEL_HINGE} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.0025, 0.0025, 0.047, 16]} />
        <meshStandardMaterial color="#585953" metalness={0.7} roughness={0.52} />
      </mesh>
      <Block size={[0.045, EASEL_LENGTH, 0.003]} position={[EASEL_CENTER.x, EASEL_CENTER.y, EASEL_CENTER.z]}
        rotation={[EASEL_ANGLE, 0, 0]} color="#30332F" radius={0.0008} roughness={0.86} />
      <group name="photo-frame-easel-foot">
        <Block size={[0.046, 0.003, 0.008]} position={[0, 0.0015, EASEL_FOOT.z]}
          color="#252923" radius={0.0006} roughness={0.94} />
      </group>
    </group>
  </Interactive>;
}
