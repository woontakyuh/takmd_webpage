import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { MathUtils } from 'three';
import type { MeshStandardMaterial } from 'three';
import { featuredPresentation, presentationNavigation, talkMedia } from '../collection';
import type { StudioSceneProps } from '../types';
import { Interactive } from './Interactive';
import { MonitorArm } from './MonitorArm';
import { Block } from './Primitives';
import { ScreenBarHalo2 } from './ScreenBarHalo2';
import { useDocumentTexture, useWorkstationTexture } from './CollectionTextures';
import { MONITOR, MOTION, PALETTE, ROOM } from './config';

type DisplaysProps = Pick<StudioSceneProps, 'selected' | 'onSelect' | 'reducedMotion' | 'night' | 'halo' | 'presentations' | 'collection' | 'onTalk'>;

export function Displays({ selected, onSelect, reducedMotion, night, halo, presentations, collection, onTalk }: DisplaysProps) {
  const screenMaterial = useRef<MeshStandardMaterial>(null);
  const screenHovered = useRef(false);
  useFrame((_, delta) => {
    if (!screenMaterial.current) return;
    const brightness = screenHovered.current ? 1.08 : 0.88;
    screenMaterial.current.emissiveIntensity = reducedMotion ? brightness
      : MathUtils.damp(screenMaterial.current.emissiveIntensity, brightness, MOTION.object, delta);
  });
  const monitor = useWorkstationTexture();
  const today = new Date().toISOString().slice(0, 10);
  const featured = featuredPresentation(presentations);
  const talk = collection.presentation ?? featured;
  const navigation = presentationNavigation(presentations, talk?.id);
  const cover = collection.presentation ? collection.talkSlide?.src : talkMedia.find(media => media.id === featured?.id)?.slides[0]?.src;
  const board = useDocumentTexture({ image: cover ?? null, title: talk?.topic || talk?.title || 'Talks & teaching', eyebrow: collection.presentation ? `${collection.presentation.date} / ${collection.presentation.date > today ? 'UPCOMING' : 'TALKS & TEACHING'}` : 'TALKS & TEACHING / FROM THE OFFICE', detail: talk ? `${talk.title} / ${talk.venue}` : 'Select a presentation to explore the work.', dark: true });
  return (
    <group>
      <Interactive id="ai" selected={selected} onSelect={onSelect} reducedMotion={reducedMotion}
        position={ROOM.monitor.position} rotation={ROOM.monitor.rotation}>
        <MonitorArm />
        <group position={[0, 0.37, 0]} rotation={[-0.04, 0, 0]}>
          <Block size={[MONITOR.width, MONITOR.height, 0.027]} radius={0.008} color={PALETTE.ink} roughness={0.3} metalness={0.25} />
          <Block size={[0.3, 0.26, 0.035]} position={[0, 0, -0.025]} color={PALETTE.ink} radius={0.028} />
          <mesh position={[0, 0.004, 0.0145]}><planeGeometry args={[MONITOR.screenWidth, MONITOR.screenHeight]} /><meshBasicMaterial map={monitor} toneMapped={false} color={night ? PALETTE.paper : PALETTE.white} /></mesh>
          <mesh position={[0.332, -0.203, 0.015]}><sphereGeometry args={[0.002, 8, 6]} /><meshBasicMaterial color={PALETTE.tealLight} /></mesh>
          <ScreenBarHalo2 power={halo.power} temperature={halo.temperature} />
        </group>
      </Interactive>
      <Interactive id="education" selected={selected} onSelect={onSelect} reducedMotion={reducedMotion} position={ROOM.gallery.position} rotation={ROOM.gallery.rotation}
        fixed onHoverChange={hovered => { screenHovered.current = hovered; }}>
        <Block size={[1.60, 0.924, 0.035]} color={PALETTE.graphite} radius={0.012} roughness={0.32} metalness={0.5} />
        <mesh name="Wall TV screen" position={[0, 0, 0.021]}><planeGeometry args={[1.568, 0.882]} /><meshStandardMaterial ref={screenMaterial} color="#000000" roughness={0.3} envMapIntensity={0.08} emissive={PALETTE.white} emissiveMap={board} emissiveIntensity={0.88} toneMapped={false} /></mesh>
        <mesh position={[0.73, -0.451, 0.021]}><sphereGeometry args={[0.002, 8, 6]} /><meshBasicMaterial color={PALETTE.tealLight} /></mesh>
        {selected === 'education' && <Html center position={[0, -0.555, 0.045]} zIndexRange={[15, 10]}>
          <nav className="wall-tv-controls" aria-label="Wall TV presentations" onPointerDown={event => event.stopPropagation()} onWheel={event => event.stopPropagation()}>
            <button aria-label="Previous presentation on wall TV" disabled={!navigation.previous} onClick={() => { if (navigation.previous) onTalk(navigation.previous.id); }}>←</button>
            <span>Presentation {navigation.index + 1} / {navigation.total}</span>
            <button aria-label="Next presentation on wall TV" disabled={!navigation.next} onClick={() => { if (navigation.next) onTalk(navigation.next.id); }}>→</button>
          </nav>
        </Html>}
      </Interactive>
    </group>
  );
}
