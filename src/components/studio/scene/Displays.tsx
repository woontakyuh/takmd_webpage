import { Movable } from './Movable';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { MathUtils } from 'three';
import type { MeshBasicMaterial } from 'three';
import { featuredPresentation, presentationNavigation, talkMedia } from '../collection';
import type { StudioSceneProps } from '../types';
import { Interactive } from './Interactive';
import { MonitorArm } from './MonitorArm';
import { Block } from './Primitives';
import { ScreenBarHalo2 } from './ScreenBarHalo2';
import { useDocumentTexture, useWorkstationTexture } from './CollectionTextures';
import { MONITOR, MOTION, PALETTE, ROOM, WALL_TV } from './config';
import { setWallTvContentColors, setWallTvHovered } from './hoverReactions';

type DisplaysProps = Pick<StudioSceneProps, 'selected' | 'onSelect' | 'reducedMotion' | 'night' | 'halo' | 'presentations' | 'collection' | 'onTalk'>;
type RgbTotals = { red: number; green: number; blue: number; count: number };

const TV_CONTENT_FALLBACK = ['#9D998F', '#9AA7A4'] as const;

function toHex(value: number) {
  return Math.round(Math.max(0, Math.min(255, value))).toString(16).padStart(2, '0');
}

function sampleTvEdge(data: Uint8ClampedArray, width: number, height: number, startX: number, endX: number) {
  const totals: RgbTotals = { red: 0, green: 0, blue: 0, count: 0 };
  for (let y = 0; y < height; y += 1) {
    for (let x = startX; x < endX; x += 1) {
      const offset = (y * width + x) * 4;
      const alpha = data[offset + 3] ?? 0;
      if (alpha < 220) continue;
      totals.red += data[offset] ?? 0;
      totals.green += data[offset + 1] ?? 0;
      totals.blue += data[offset + 2] ?? 0;
      totals.count += 1;
    }
  }
  if (!totals.count) return null;
  return `#${toHex(totals.red / totals.count)}${toHex(totals.green / totals.count)}${toHex(totals.blue / totals.count)}`;
}

function loadTvContentColors(source: string, onColors: (colors: readonly [string, string]) => void) {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 24;
    canvas.height = 16;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) {
      onColors(TV_CONTENT_FALLBACK);
      return;
    }
    try {
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      const left = sampleTvEdge(pixels, canvas.width, canvas.height, 0, 4);
      const right = sampleTvEdge(pixels, canvas.width, canvas.height, canvas.width - 4, canvas.width);
      onColors(left && right ? [left, right] : TV_CONTENT_FALLBACK);
    } catch {
      onColors(TV_CONTENT_FALLBACK);
    }
  };
  image.onerror = () => onColors(TV_CONTENT_FALLBACK);
  image.src = source;
  return () => {
    image.onload = null;
    image.onerror = null;
  };
}

export function Displays({ selected, onSelect, reducedMotion, night, halo, presentations, collection, onTalk }: DisplaysProps) {
  const monitorMaterial = useRef<MeshBasicMaterial>(null);
  const monitorHovered = useRef(false);
  const monitorBrightness = useRef(0.84);
  useFrame((_, delta) => {
    if (!monitorMaterial.current) return;
    const targetBrightness = monitorHovered.current ? 1 : 0.84;
    monitorBrightness.current = reducedMotion ? targetBrightness
      : MathUtils.damp(monitorBrightness.current, targetBrightness, MOTION.object, delta);
    monitorMaterial.current.color.set(night ? PALETTE.paper : PALETTE.white).multiplyScalar(monitorBrightness.current);
  });
  const monitor = useWorkstationTexture();
  const today = new Date().toISOString().slice(0, 10);
  const featured = featuredPresentation(presentations);
  const talk = collection.presentation ?? featured;
  const navigation = presentationNavigation(presentations, talk?.id);
  const cover = collection.presentation ? collection.talkSlide?.src : talkMedia.find(media => media.id === featured?.id)?.slides[0]?.src;
  const board = useDocumentTexture({ image: cover ?? null, title: talk?.topic || talk?.title || 'Talks & teaching', eyebrow: collection.presentation ? `${collection.presentation.date} / ${collection.presentation.date > today ? 'UPCOMING' : 'TALKS & TEACHING'}` : 'TALKS & TEACHING / FROM THE OFFICE', detail: talk ? `${talk.title} / ${talk.venue}` : 'Select a presentation to explore the work.', dark: true });
  useEffect(() => {
    if (!cover) {
      setWallTvContentColors(TV_CONTENT_FALLBACK);
      return;
    }
    return loadTvContentColors(cover, setWallTvContentColors);
  }, [cover]);
  return (
    <group>
      <Movable id="desk" handle={false}><Interactive id="ai" selected={selected} onSelect={onSelect} reducedMotion={reducedMotion}
        position={ROOM.monitor.position} rotation={ROOM.monitor.rotation} onHoverChange={hovered => { monitorHovered.current = hovered; }}>
        <MonitorArm />
        <group position={[0, 0.37, 0]} rotation={[-0.04, 0, 0]}>
          <Block size={[MONITOR.width, MONITOR.height, 0.027]} radius={0.008} color={PALETTE.ink} roughness={0.3} metalness={0.25} />
          <Block size={[0.3, 0.26, 0.035]} position={[0, 0, -0.025]} color={PALETTE.ink} radius={0.028} />
          <mesh position={[0, 0.004, 0.0145]}><planeGeometry args={[MONITOR.screenWidth, MONITOR.screenHeight]} /><meshBasicMaterial ref={monitorMaterial} map={monitor} toneMapped={false} color={night ? PALETTE.paper : PALETTE.white} /></mesh>
          <mesh position={[0.332, -0.203, 0.015]}><sphereGeometry args={[0.002, 8, 6]} /><meshBasicMaterial color={PALETTE.tealLight} /></mesh>
          <ScreenBarHalo2 power={halo.power} temperature={halo.temperature} />
        </group>
      </Interactive></Movable>
      <Interactive id="education" selected={selected} onSelect={onSelect} reducedMotion={reducedMotion} position={ROOM.gallery.position} rotation={ROOM.gallery.rotation}
        fixed onHoverChange={setWallTvHovered}>
        <group name={WALL_TV.model}>
          <Block size={[WALL_TV.width, WALL_TV.height, WALL_TV.depth]} color={PALETTE.graphite} radius={0.005} roughness={0.32} metalness={0.5} />
          <mesh name="Wall TV screen" position={[0, 0.003, WALL_TV.depth / 2 + 0.001]}><planeGeometry args={[WALL_TV.screenWidth, WALL_TV.screenHeight]} /><meshStandardMaterial color="#000000" roughness={0.3} envMapIntensity={0.08} emissive={PALETTE.white} emissiveMap={board} emissiveIntensity={0.88} toneMapped={false} /></mesh>
          <mesh position={[WALL_TV.width / 2 - 0.034, -WALL_TV.height / 2 + 0.008, 0.017]}><sphereGeometry args={[0.0015, 8, 6]} /><meshBasicMaterial color={PALETTE.tealLight} /></mesh>
        </group>
        {selected === 'education' && <Html center position={[0, -WALL_TV.height / 2 - 0.09, 0.045]} zIndexRange={[15, 10]}>
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
