import { Movable } from './Movable';
import { useFrame } from '@react-three/fiber';
import { useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MathUtils, Vector3 } from 'three';
import type { MeshStandardMaterial } from 'three';
import { moveFocus, useArrangement } from '../arrangement';
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
import { FOCUS, MONITOR, MOTION, PALETTE, ROOM, WALL_TV } from './config';
import { setWallTvHovered, useWallTvBacklight } from './hoverReactions';
import { monitorReadingPose } from './monitorReading';
import { isScreenFocusSettled } from './screenFocus';

type DisplaysProps = Pick<StudioSceneProps, 'ready' | 'selected' | 'onSelect' | 'reducedMotion' | 'halo' | 'presentations' | 'collection' | 'onTalk' | 'onTalkSlide' | 'onClose' | 'monitorScroll'>;

export function Displays({ ready, selected, onSelect, reducedMotion, halo, presentations, collection, onTalk, onTalkSlide, onClose, monitorScroll }: DisplaysProps) {
  const camera = useThree(state => state.camera);
  const { layout } = useArrangement();
  const monitorMaterial = useRef<MeshStandardMaterial>(null);
  const tvMaterial = useRef<MeshStandardMaterial>(null);
  const focusedScreenRef = useRef<'ai' | 'education' | null>(null);
  const cameraDirection = useMemo(() => new Vector3(), []);
  const { hovered: tvHovered } = useWallTvBacklight();
  const [monitorHovered, setMonitorHovered] = useState(false);
  const [focusedScreen, setFocusedScreen] = useState<'ai' | 'education' | null>(null);
  const [tvTreeScrollOffset, setTvTreeScrollOffset] = useState(0);
  useEffect(() => {
    focusedScreenRef.current = null;
    setFocusedScreen(null);
  }, [selected]);
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
    if (selected !== 'ai' && selected !== 'education') return;
    const pose = moveFocus(selected === 'ai' ? monitorReadingPose() : FOCUS.education, selected, layout);
    const next = isScreenFocusSettled(true, camera.position, camera.getWorldDirection(cameraDirection), pose) ? selected : null;
    if (next === focusedScreenRef.current) return;
    focusedScreenRef.current = next;
    setFocusedScreen(next);
  });
  const monitor = useWorkstationTexture();
  const featured = featuredPresentation(presentations);
  const talk = collection.presentation ?? featured;
  const cover = collection.talkSlide?.src ?? talkMedia.find(media => media.id === talk?.id)?.slides[0]?.src;
  const board = useTvPresentationTexture({ cover: cover ?? null, talk, presentations, treeScrollOffset: tvTreeScrollOffset });
  return (
    <group>
      <Movable id="desk" handle={false}><Interactive id="ai" selected={selected} onSelect={onSelect} reducedMotion={reducedMotion}
        position={ROOM.monitor.position} rotation={ROOM.monitor.rotation} onHoverChange={setMonitorHovered}>
        <MonitorArm />
        <group position={MONITOR_SCREEN.mount} rotation={[MONITOR_SCREEN.tilt, 0, 0]}>
          <Block size={[MONITOR.width, MONITOR.height, 0.027]} radius={0.008} color={PALETTE.ink} roughness={0.3} metalness={0.25} />
          <Block size={[0.3, 0.26, 0.035]} position={[0, 0, -0.025]} color={PALETTE.ink} radius={0.028} />
          <mesh visible={focusedScreen !== 'ai'} name="Desk monitor screen" position={MONITOR_SCREEN.surface}><planeGeometry args={[MONITOR.screenWidth, MONITOR.screenHeight]} /><meshStandardMaterial ref={monitorMaterial} map={monitor} emissiveMap={monitor} emissive={PALETTE.white} emissiveIntensity={0.1} roughness={0.4} /></mesh>
          {focusedScreen === 'ai' && ready && <MonitorScreenReader active hovered={monitorHovered} texture={monitor} scrollState={monitorScroll} publicationCount={collection.paperCount} presentationCount={presentations.length} onClose={onClose} />}
          <mesh position={[0.332, -0.203, 0.015]}><sphereGeometry args={[0.002, 8, 6]} /><meshBasicMaterial color={PALETTE.tealLight} /></mesh>
          <ScreenBarHalo2 power={halo.power} temperature={halo.temperature} />
        </group>
      </Interactive></Movable>
      <Interactive id="education" selected={selected} onSelect={onSelect} reducedMotion={reducedMotion} position={ROOM.gallery.position} rotation={ROOM.gallery.rotation}
        fixed onHoverChange={setWallTvHovered}>
        <group name={WALL_TV.model}>
          <Block size={[WALL_TV.width, WALL_TV.height, WALL_TV.depth]} color={PALETTE.graphite} radius={0.005} roughness={0.32} metalness={0.5} />
          <mesh visible={focusedScreen !== 'education'} name="Wall TV screen" position={[0, 0.003, WALL_TV.depth / 2 + 0.001]}>
            <planeGeometry args={[WALL_TV.screenWidth, WALL_TV.screenHeight]} />
            {/* Keep the shallow screen clear of its chassis at distant, oblique camera angles. */}
            <meshStandardMaterial ref={tvMaterial} map={board} emissiveMap={board} emissive={PALETTE.white} emissiveIntensity={0.1} roughness={0.4}
              polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
          </mesh>
          {focusedScreen === 'education' && <TvScreenReader active hovered={tvHovered} talk={talk} slide={collection.talkSlide} presentations={presentations}
            onTalk={onTalk} onSlide={onTalkSlide} onClose={onClose} treeScrollOffset={tvTreeScrollOffset} onTreeScrollOffset={setTvTreeScrollOffset} />}
          <mesh position={[WALL_TV.width / 2 - 0.034, -WALL_TV.height / 2 + 0.008, 0.017]}><sphereGeometry args={[0.0015, 8, 6]} /><meshBasicMaterial color={PALETTE.tealLight} /></mesh>
        </group>

      </Interactive>
    </group>
  );
}
