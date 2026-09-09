import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { MathUtils, SRGBColorSpace, Vector3 } from 'three';
import type { MeshStandardMaterial } from 'three';
import { Block } from './Primitives';

const FRAME = { tilt: -0.16, radius: 0.0025, depth: 0.018, width: 0.246, height: 0.19 } as const;

type DigitalPhotoFrameProps = {
  readonly src: string;
  readonly hovered: boolean;
  readonly active: boolean;
  readonly reducedMotion: boolean;
  readonly width?: number;
  readonly height?: number;
};

function Photograph({ src, hovered, active, reducedMotion, width, height }: Required<DigitalPhotoFrameProps>) {
  const source = useTexture(src);
  const material = useRef<MeshStandardMaterial>(null);
  const texture = useMemo(() => {
    const copy = source.clone();
    copy.colorSpace = SRGBColorSpace;
    copy.anisotropy = 4;
    copy.needsUpdate = true;
    return copy;
  }, [source]);
  useEffect(() => () => texture.dispose(), [texture]);
  const image = source.image;
  const ratio = image instanceof HTMLImageElement ? image.naturalWidth / image.naturalHeight : 4 / 3;
  const photoWidth = Math.min(width - 0.036, (height - 0.044) * ratio);
  useFrame((_, delta) => {
    if (!material.current) return;
    const targetBrightness = hovered || active ? 0.5 : 0.1;
    material.current.emissiveIntensity = reducedMotion ? targetBrightness
      : MathUtils.damp(material.current.emissiveIntensity, targetBrightness, 8, delta);
  });
  return <mesh name="digital-photo-screen" position={[0, 0, 0.0102]}>
    <planeGeometry args={[photoWidth, photoWidth / ratio]} />
    <meshStandardMaterial ref={material} map={texture} emissiveMap={texture} emissive="#ffffff"
      emissiveIntensity={0.1} roughness={0.4} />
  </mesh>;
}

export function DigitalPhotoFrame({ src, hovered, active, reducedMotion, width = FRAME.width, height = FRAME.height }: DigitalPhotoFrameProps) {
  const support = useMemo(() => {
    const centerY = (height / 2 - FRAME.radius) * Math.cos(FRAME.tilt)
      + (FRAME.depth / 2 - FRAME.radius) * Math.abs(Math.sin(FRAME.tilt)) + FRAME.radius;
    const hinge = new Vector3(0, height * 0.2, -0.0115)
      .applyAxisAngle(new Vector3(1, 0, 0), FRAME.tilt).add(new Vector3(0, centerY, 0));
    const foot = new Vector3(0, 0.003, -height * 0.1 / FRAME.height);
    return {
      centerY, hinge, foot,
      center: hinge.clone().add(foot).multiplyScalar(0.5),
      length: hinge.distanceTo(foot),
      angle: Math.atan2(hinge.z - foot.z, hinge.y - foot.y),
    };
  }, [height]);
  return <group name="electronic-photo-frame">
    <group name="photo-frame-body" position={[0, support.centerY, 0]} rotation={[FRAME.tilt, 0, 0]}>
      <Block size={[width, height, FRAME.depth]} color="#30332F" radius={FRAME.radius} roughness={0.48} />
      <Block size={[width - 0.016, height - 0.016, 0.001]} position={[0, 0, 0.0095]}
        color="#151815" radius={0.0004} />
      <Photograph src={src} hovered={hovered} active={active} reducedMotion={reducedMotion} width={width} height={height} />
    </group>
    <group name="photo-frame-hinged-easel">
      <mesh name="photo-frame-easel-hinge" position={support.hinge} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.0025, 0.0025, 0.047, 16]} />
        <meshStandardMaterial color="#585953" metalness={0.7} roughness={0.52} />
      </mesh>
      <Block size={[0.045, support.length, 0.003]} position={[support.center.x, support.center.y, support.center.z]}
        rotation={[support.angle, 0, 0]} color="#30332F" radius={0.0008} roughness={0.86} />
      <group name="photo-frame-easel-foot">
        <Block size={[0.046, 0.003, 0.008]} position={[0, 0.0015, support.foot.z]}
          color="#252923" radius={0.0006} roughness={0.94} />
      </group>
    </group>
  </group>;
}
