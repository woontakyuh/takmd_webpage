import { useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useCallback, useEffect, useRef } from 'react';
import type { Group } from 'three';
import { useArrangement } from '../arrangement';
import { DigitalPhotoFrame } from './DigitalPhotoFrame';
import { RoomArchiveCaption } from './RoomArchiveCaption';
import { archivePose } from './roomArchiveLayout';
import { useCabinetAction } from './WhiskyCabinetDoor';
import { useSceneInspection, type SceneInspection } from './SceneInspection';

export type ProposalMemory = { readonly posterSrc: string | null; readonly videoSrc?: string | null; readonly title?: string; readonly kicker?: string; readonly story?: string };
type Props = ProposalMemory & { readonly reducedMotion?: boolean; readonly onVideoPlay?: () => void };

export function ProposalMemoryFrame({ posterSrc, videoSrc, title = 'A song for a question', kicker = 'A personal memory', story = 'Written, played and sung on this Stratocaster, for the moment I asked her to marry me.', reducedMotion = false, onVideoPlay }: Props) {
  const frame = useRef<Group>(null);
  const video = useRef<HTMLVideoElement>(null);
  const { size } = useThree();
  const { inspection, setInspection } = useSceneInspection();
  const { editing } = useArrangement();
  const available = typeof posterSrc === 'string' && posterSrc.length > 0;
  const selected = inspection?.id === 'proposal-memory';
  const openMemory = useCallback(() => {
    if (!available || !frame.current || editing) return;
    const pose = archivePose(frame.current, { width: size.width, height: size.height }, 0.22, 0.188, true);
    const next: SceneInspection = { id: 'proposal-memory', position: pose.position, target: pose.target };
    setInspection(next);
  }, [available, editing, setInspection, size.width, size.height]);
  const action = useCabinetAction({ disabled: !available || selected || editing, onActivate: openMemory });
  const onClose = useCallback(() => { video.current?.pause(); setInspection(null); }, [setInspection]);
  useEffect(() => { if (selected) openMemory(); }, [openMemory, selected]);
  useEffect(() => {
    const element = video.current;
    return () => element?.pause();
  }, [selected]);
  if (!available) return null;
  return <group name="proposal memory frame" position={[0.18, 0.410, 0.07]} {...action.handlers}>
    <DigitalPhotoFrame src={posterSrc} width={0.22} height={0.188} hovered={action.hovered} active={selected} reducedMotion={reducedMotion} />
    <group ref={frame} position={[0, 0.094, 0]} />
    {!selected && !editing && <Html center position={[0, .094, .014]} occlude style={{ pointerEvents: 'none' }}>
      <button className="whisky-lecture-trigger" aria-label="Open proposal memory" onClick={event => { if (event.detail === 0) openMemory(); }} />
    </Html>}
    {selected && <RoomArchiveCaption object={frame} width={0.22} height={0.188} side title={title} label={kicker} description={story} onClose={onClose}>
      {videoSrc && <video ref={video} controls preload="metadata" src={videoSrc} data-office-memory="proposal"
        onPlay={onVideoPlay} style={{ width: '100%', maxHeight: '22dvh' }} />}
    </RoomArchiveCaption>}
  </group>;
}
