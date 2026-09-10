import { Movable } from './Movable';
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import { MathUtils } from 'three';
import type { MeshStandardMaterial } from 'three';
import { featuredPresentation, talkMedia } from '../collection';
import type { StudioSceneProps } from '../types';
import { Interactive } from './Interactive';
import { MonitorArm } from './MonitorArm';
import { Block } from './Primitives';
import { ScreenBarHalo2 } from './ScreenBarHalo2';
import { useWorkstationTexture } from './CollectionTextures';
import { useTvPresentationTexture } from './TvPresentationTexture';
import { TvScreenReader } from './TvScreenReader';
import { MonitorScreenReader } from './MonitorScreenReader';
import { MONITOR_SCREEN } from './monitorReading';
import { MONITOR, MOTION, PALETTE, ROOM, WALL_TV } from './config';
import { setWallTvContentColors, setWallTvHovered, useWallTvBacklight } from './hoverReactions';

type DisplaysProps = Pick<StudioSceneProps, 'ready' | 'selected' | 'onSelect' | 'reducedMotion' | 'halo' | 'presentations' | 'collection' | 'onTalk' | 'onTalkSlide' | 'onClose' | 'monitorScroll'>;
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

function sampleTvContentColors(source: HTMLCanvasElement) {
  const canvas = document.createElement('canvas');
  canvas.width = 24; canvas.height = 16;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return;
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const left = sampleTvEdge(pixels, canvas.width, canvas.height, 0, 4);
  const right = sampleTvEdge(pixels, canvas.width, canvas.height, canvas.width - 4, canvas.width);
  setWallTvContentColors(left && right ? [left, right] : TV_CONTENT_FALLBACK);
}

export function Displays({ ready, selected, onSelect, reducedMotion, halo, presentations, collection, onTalk, onTalkSlide, onClose, monitorScroll }: DisplaysProps) {
  const monitorMaterial = useRef<MeshStandardMaterial>(null);
  const tvMaterial = useRef<MeshStandardMaterial>(null);
  const { hovered: tvHovered } = useWallTvBacklight();
  const [monitorHovered, setMonitorHovered] = useState(false);
  useFrame((_, delta) => {
    if (tvMaterial.current) {
      const target = tvHovered || selected === 'education' ? 0.5 : 0.1;
      tvMaterial.current.emissiveIntensity = reducedMotion ? target
        : MathUtils.damp(tvMaterial.current.emissiveIntensity, target, MOTION.object, delta);
    }
    if (!monitorMaterial.current) return;
    const targetBrightness = monitorHovered || selected === 'ai' ? 0.5 : 0.1;
    monitorMaterial.current.emissiveIntensity = reducedMotion ? targetBrightness
      : MathUtils.damp(monitorMaterial.current.emissiveIntensity, targetBrightness, MOTION.object, delta);
  });
  const monitor = useWorkstationTexture();
  const featured = featuredPresentation(presentations);
  const talk = collection.presentation ?? featured;
  const cover = collection.presentation ? collection.talkSlide?.src : talkMedia.find(media => media.id === featured?.id)?.slides[0]?.src;
  const board = useTvPresentationTexture({ cover: cover ?? null, talk, presentations });
  useEffect(() => {
    const sample = () => {
      const image: unknown = board.image;
      if (image instanceof HTMLCanvasElement) sampleTvContentColors(image);
    };
    board.onUpdate = sample;
    sample();
    return () => { board.onUpdate = null; };
  }, [board]);
  return (
    <group>
      <Movable id="desk" handle={false}><Interactive id="ai" selected={selected} onSelect={onSelect} reducedMotion={reducedMotion}
        position={ROOM.monitor.position} rotation={ROOM.monitor.rotation} onHoverChange={setMonitorHovered}>
        <MonitorArm />
        <group position={MONITOR_SCREEN.mount} rotation={[MONITOR_SCREEN.tilt, 0, 0]}>
          <Block size={[MONITOR.width, MONITOR.height, 0.027]} radius={0.008} color={PALETTE.ink} roughness={0.3} metalness={0.25} />
          <Block size={[0.3, 0.26, 0.035]} position={[0, 0, -0.025]} color={PALETTE.ink} radius={0.028} />
          <mesh name="Desk monitor screen" position={MONITOR_SCREEN.surface}><planeGeometry args={[MONITOR.screenWidth, MONITOR.screenHeight]} /><meshStandardMaterial ref={monitorMaterial} map={monitor} emissiveMap={monitor} emissive={PALETTE.white} emissiveIntensity={0.1} roughness={0.4} /></mesh>
          {<MonitorScreenReader active={selected === 'ai' && ready} hovered={monitorHovered} scrollState={monitorScroll} publicationCount={collection.paperCount} presentationCount={presentations.length} onClose={onClose} />}
          <mesh position={[0.332, -0.203, 0.015]}><sphereGeometry args={[0.002, 8, 6]} /><meshBasicMaterial color={PALETTE.tealLight} /></mesh>
          <ScreenBarHalo2 power={halo.power} temperature={halo.temperature} />
        </group>
      </Interactive></Movable>
      <Interactive id="education" selected={selected} onSelect={onSelect} reducedMotion={reducedMotion} position={ROOM.gallery.position} rotation={ROOM.gallery.rotation}
        fixed onHoverChange={setWallTvHovered}>
        <group name={WALL_TV.model}>
          <Block size={[WALL_TV.width, WALL_TV.height, WALL_TV.depth]} color={PALETTE.graphite} radius={0.005} roughness={0.32} metalness={0.5} />
          <mesh name="Wall TV screen" position={[0, 0.003, WALL_TV.depth / 2 + 0.001]}><planeGeometry args={[WALL_TV.screenWidth, WALL_TV.screenHeight]} /><meshStandardMaterial ref={tvMaterial} map={board} emissiveMap={board} emissive={PALETTE.white} emissiveIntensity={0.1} roughness={0.4} /></mesh>
          {<TvScreenReader active={selected === 'education'} hovered={tvHovered} talk={talk} slide={collection.talkSlide} presentations={presentations} onTalk={onTalk} onSlide={onTalkSlide} onClose={onClose} />}
          <mesh position={[WALL_TV.width / 2 - 0.034, -WALL_TV.height / 2 + 0.008, 0.017]}><sphereGeometry args={[0.0015, 8, 6]} /><meshBasicMaterial color={PALETTE.tealLight} /></mesh>
        </group>

      </Interactive>
    </group>
  );
}
