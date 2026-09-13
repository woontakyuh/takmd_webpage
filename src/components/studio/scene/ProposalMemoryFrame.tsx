import { useThree } from '@react-three/fiber';
import { Html, useCursor } from '@react-three/drei';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Group } from 'three';
import { useArrangement } from '../arrangement';
import { DigitalPhotoFrame } from './DigitalPhotoFrame';
import { ProposalPlaybackControls } from './ProposalPlaybackControls';
import { RoomArchiveCaption } from './RoomArchiveCaption';
import { archivePose } from './roomArchiveLayout';
import { useSceneInspection } from './SceneInspection';
import type { SceneInspection } from './SceneInspection';
import { useProposalPlayback } from './useProposalPlayback';

export type ProposalMemory = { readonly posterSrc: string | null; readonly videoSrc?: string | null; readonly hlsSrc?: string | null; readonly title?: string; readonly kicker?: string; readonly story?: string };
type Props = ProposalMemory & { readonly reducedMotion?: boolean; readonly onVideoPlay?: () => void };
const FRAME = { width: 0.232, height: 0.1375, tilt: -0.16, inset: 0.008 } as const;
const CENTER_Y = (FRAME.height / 2 - 0.0025) * Math.cos(FRAME.tilt) + 0.0065 * Math.abs(Math.sin(FRAME.tilt)) + 0.0025;
type Gesture = { readonly id: number; readonly x: number; readonly y: number };

export function ProposalMemoryFrame({ posterSrc, videoSrc, hlsSrc, title = 'Marry me.', kicker = 'A personal recording', story = 'An original song, played and sung on this Stratocaster. My proposal to her.', reducedMotion = false, onVideoPlay }: Props) {
  const frame = useRef<Group>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const wasSelected = useRef(false);
  const returnInspection = useRef<SceneInspection | null>(null);
  const [hovered, setHovered] = useState(false);
  const { size } = useThree();
  const { inspection, setInspection } = useSceneInspection();
  const { editing } = useArrangement();
  const playback = useProposalPlayback({ src: videoSrc, hlsSrc }, onVideoPlay);
  const { play, reset } = playback;
  const available = typeof posterSrc === 'string' && posterSrc.length > 0;
  const selected = inspection?.id === 'proposal-memory';
  const enabled = available && !editing;
  useCursor(hovered && enabled);
  const approach = useCallback(() => {
    if (!frame.current) return;
    const pose = archivePose(frame.current, size, FRAME.width, FRAME.height, true);
    setInspection({ id: 'proposal-memory', position: pose.position, target: pose.target });
  }, [setInspection, size]);
  const activate = useCallback(() => {
    if (!enabled || selected) return;
    returnInspection.current = inspection?.id === 'music-corner' ? inspection : null;
    play();
    approach();
  }, [approach, enabled, inspection, play, selected]);
  const onClose = useCallback(() => { reset(); setInspection(returnInspection.current); }, [reset, setInspection]);
  useEffect(() => { if (selected && !editing) approach(); }, [approach, editing, selected]);
  useEffect(() => {
    if ((!selected || editing) && wasSelected.current) reset();
    if (!selected && wasSelected.current && !inspection) trigger.current?.focus({ preventScroll: true });
    wasSelected.current = selected;
    if (editing && selected) setInspection(null);
  }, [editing, inspection, reset, selected, setInspection]);
  useEffect(() => {
    const cancel = () => { gesture.current = null; setHovered(false); };
    const move = (event: PointerEvent) => {
      const start = gesture.current;
      if (start && (event.pointerId !== start.id || Math.hypot(event.clientX - start.x, event.clientY - start.y) >= 5)) cancel();
    };
    window.addEventListener('pointermove', move, true);
    window.addEventListener('pointerup', cancel);
    window.addEventListener('pointercancel', cancel, true);
    window.addEventListener('blur', cancel);
    return () => {
      window.removeEventListener('pointermove', move, true);
      window.removeEventListener('pointerup', cancel);
      window.removeEventListener('pointercancel', cancel, true);
      window.removeEventListener('blur', cancel);
    };
  }, []);
  if (!available) return null;
  return <group name="proposal memory frame" position={[0.14, 0.410, 0.045]}
    onPointerOver={event => { event.stopPropagation(); setHovered(enabled && event.pointerType !== 'touch' && event.buttons === 0); }}
    onPointerOut={() => setHovered(false)}
    onPointerDown={event => {
      event.stopPropagation();
      gesture.current = enabled && event.button === 0 && event.isPrimary && !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey
        ? { id: event.pointerId, x: event.clientX, y: event.clientY } : null;
    }}
    onPointerUp={event => {
      event.stopPropagation();
      const start = gesture.current;
      gesture.current = null;
      if (start && start.id === event.pointerId && event.button === 0 && event.isPrimary && event.delta < 5
        && !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey
        && Math.hypot(event.clientX - start.x, event.clientY - start.y) < 5) activate();
    }}
    onClick={event => event.stopPropagation()} onDoubleClick={event => event.stopPropagation()}>
    <DigitalPhotoFrame src={posterSrc} width={FRAME.width} height={FRAME.height} screenInset={[FRAME.inset, FRAME.inset]}
      screenTexture={selected ? playback.texture : null} hovered={hovered} active={selected} reducedMotion={reducedMotion} />
    <group ref={frame} position={[0, CENTER_Y, 0]} rotation={[FRAME.tilt, 0, 0]} />
    {!selected && !editing && <Html center position={[0, CENTER_Y, .014]} style={{ pointerEvents: 'none' }}>
      <button ref={trigger} type="button" className="whisky-lecture-trigger" aria-label="Play proposal recording"
        onClick={event => { event.stopPropagation(); if (event.detail === 0) activate(); }} />
    </Html>}
    {selected && <RoomArchiveCaption object={frame} width={FRAME.width} height={FRAME.height} side title={title} label={kicker} description={story} onClose={onClose}>
      {videoSrc && <ProposalPlaybackControls playback={playback} />}
    </RoomArchiveCaption>}
  </group>;
}
