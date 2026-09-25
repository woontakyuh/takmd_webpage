import { Html, useTexture } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useCallback, useEffect, useRef } from 'react';
import { SRGBColorSpace } from 'three';
import type { Group } from 'three';
import { useArrangement } from '../arrangement';
import { Block } from './Primitives';
import { useCabinetAction } from './WhiskyCabinetDoor';
import { useSceneInspection } from './SceneInspection';
import { archivePose } from './roomArchiveLayout';
import { RoomArchiveCaption } from './RoomArchiveCaption';
import { INTERIOR, ROOM } from './config';

const WIDTH = .42;
const PRINT = .345;
const RIM = .018;

export function PersonalArtworkFrame() {
  const art = useTexture('/models/personal-art/painting-2018.webp');
  art.colorSpace = SRGBColorSpace;
  const group = useRef<Group>(null);
  const size = useThree(state => state.size);
  const { editing } = useArrangement();
  const { inspection, setInspection } = useSceneInspection();
  const active = inspection?.id === 'personal-artwork';
  const approach = useCallback(() => {
    if (!group.current) return;
    const pose = archivePose(group.current, size, WIDTH, WIDTH, true);
    setInspection({ id: 'personal-artwork', position: pose.position, target: pose.target });
  }, [size, setInspection]);
  const close = useCallback(() => setInspection(null), [setInspection]);
  const { handlers } = useCabinetAction({ disabled: editing || active, onActivate: approach, visualAccent: true });
  useEffect(() => { if (active) approach(); }, [active, approach]);
  return <group ref={group} name="Personal painting above the garment rack"
    position={[ROOM.architecture.leftX + .036, 2.35, ROOM.wardrobe.position[2] + .27]}
    rotation={[0, Math.PI / 2, 0]} {...handlers}>
    <Block size={[WIDTH, WIDTH, .022]} color={INTERIOR.oak} radius={.002} roughness={.8} />
    <mesh position={[0, 0, .012]}>
      <planeGeometry args={[WIDTH - RIM * 2, WIDTH - RIM * 2]} />
      <meshStandardMaterial color="#F8F6F0" roughness={.96} />
    </mesh>
    <mesh name="Original painting, uncropped" position={[0, 0, .013]} rotation={[0, 0, -Math.PI / 2]}>
      <planeGeometry args={[PRINT, PRINT]} />
      <meshStandardMaterial map={art} roughness={.96} />
    </mesh>
    {!active && !editing && <Html center position={[0, 0, .018]} style={{ pointerEvents: 'none' }}>
      <button type="button" className="whisky-lecture-trigger" aria-label="View original painting"
        onClick={event => { event.stopPropagation(); if (event.detail === 0) approach(); }} />
    </Html>}
    {active && <RoomArchiveCaption object={group} width={WIDTH} height={WIDTH} side
      label="27 January 2018" title="On paper." description="Artwork by Woon Tak Yuh · SZQ Gallery, Seoul." onClose={close} />}
  </group>;
}
