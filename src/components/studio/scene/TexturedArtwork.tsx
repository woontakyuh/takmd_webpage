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
import { PALETTE, ROOM } from './config';

const WIDTH = .30;
const HEIGHT = .40;
const DEPTH = .02;

export function TexturedArtwork() {
  const [art, relief] = useTexture([
    '/models/personal-art/szq-canvas-2020.webp',
    '/models/personal-art/szq-canvas-2020-relief.webp',
  ]);
  art.colorSpace = SRGBColorSpace;
  const group = useRef<Group>(null);
  const size = useThree(state => state.size);
  const { editing } = useArrangement();
  const { inspection, setInspection } = useSceneInspection();
  const active = inspection?.id === 'szq-textured-artwork';
  const approach = useCallback(() => {
    if (!group.current) return;
    const pose = archivePose(group.current, size, WIDTH, HEIGHT, true);
    setInspection({ id: 'szq-textured-artwork', position: pose.position, target: pose.target });
  }, [size, setInspection]);
  const close = useCallback(() => setInspection(null), [setInspection]);
  const { handlers } = useCabinetAction({ disabled: editing || active, onActivate: approach, visualAccent: true });
  useEffect(() => { if (active) approach(); }, [active, approach]);
  return <group ref={group} name="SZQ Gallery textured canvas, 2020"
    position={[ROOM.architecture.leftX + .036, 2.35, ROOM.wardrobe.position[2] - .37]}
    rotation={[0, Math.PI / 2, 0]} {...handlers}>
    <Block size={[WIDTH, HEIGHT, DEPTH]} color={PALETTE.paperLight} radius={.001} roughness={.96} />
    <mesh name="Original SZQ canvas paint and signature" position={[0, 0, DEPTH / 2 + .0008]} castShadow receiveShadow>
      <planeGeometry args={[WIDTH, HEIGHT, 48, 64]} />
      <meshStandardMaterial map={art} bumpMap={relief} bumpScale={.00065}
        displacementMap={relief} displacementScale={.001} displacementBias={-.0005} roughness={.96} />
    </mesh>
    {!active && !editing && <Html center position={[0, 0, .014]} style={{ pointerEvents: 'none' }}>
      <button type="button" className="whisky-lecture-trigger" aria-label="View textured painting from SZQ Gallery"
        onClick={event => { event.stopPropagation(); if (event.detail === 0) approach(); }} />
    </Html>}
    {active && <RoomArchiveCaption object={group} width={WIDTH} height={HEIGHT} side
      label="10 December 2020" title="On canvas."
      description="Made alongside my wife at SZQ Gallery, Seoul. A heart traced in layers of textured paint."
      onClose={close} />}
  </group>;
}
