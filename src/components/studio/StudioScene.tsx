import { BookshelfBooks } from './scene/BookshelfBooks';
import { Movable } from './scene/Movable';
import { Canvas } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { useEffect, useRef, useState } from 'react';
import { MathUtils, PCFSoftShadowMap } from 'three';
import { OfficeRenderer } from './scene/OfficeRenderer';
import { SceneFrameLoop } from './scene/SceneFrameLoop';
import { GoldAward } from './scene/GoldAward';
import { PERSONAL_LINKS } from './personal';
import type { StudioSceneProps } from './types';
import { Architecture } from './scene/Architecture';
import { CameraRig } from './scene/CameraRig';
import { Furniture } from './scene/Furniture';
import { Greenery } from './scene/Greenery';
import { WorkshopObjects } from './scene/WorkshopObjects';
import { SpineExhibit } from './scene/SpineExhibit';
import { Folio } from './scene/Folio';
import { Displays } from './scene/Displays';
import { CalendarClock } from './scene/CalendarClock';
import { RoomSwitches } from './scene/RoomSwitches';
import { OfficeLighting, WindowDaylight } from './scene/OfficeLighting';
import { OfficeLounge } from './scene/OfficeLounge';
import { PersonalCorner } from './scene/PersonalCorner';
import { PALETTE, ROOM, TOUR } from './scene/config';

const ROOM_ENVIRONMENT = (
  <Environment resolution={128} frames={1} environmentIntensity={0.12}>
    <color attach="background" args={[PALETTE.plaster]} />
    <Lightformer form="rect" color="#fff8ed" intensity={2} scale={[6, 3, 1]}
      position={[-4, 2.5, 0]} rotation={[0, Math.PI / 2, 0]} />
    <Lightformer form="rect" color="#ffffff" intensity={1.5} scale={[4, 4, 1]}
      position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]} />
    <Lightformer form="rect" color="#ffffff" intensity={1} scale={[3, 3, 1]}
      position={[3, 2, -4]} rotation={[0, -Math.PI / 4, 0]} />
  </Environment>
);

export function StudioScene(props: StudioSceneProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(true);
  const [coarsePointer, setCoarsePointer] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(pointer: coarse)');
    const update = () => setCoarsePointer(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const mobile = props.compact || coarsePointer;
  useEffect(() => {
    let inViewport = true;
    const update = () => setVisible(inViewport && !document.hidden);
    const observer = new IntersectionObserver(entries => {
      inViewport = entries.some(entry => entry.isIntersecting);
      update();
    });
    if (canvas.current) observer.observe(canvas.current);
    document.addEventListener('visibilitychange', update);
    update();
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update); };
  }, []);
  const { sun, position } = props.lighting;
  const skyFill = MathUtils.smoothstep(sun.altitude, -6, 32);
  const windowOpen = (props.blindLift[0] + props.blindLift[1]) / 2;
  return (
    <Canvas ref={canvas} frameloop="never" camera={{ position: [...TOUR[0].position], fov: 42, near: 0.015, far: 60 }}
      dpr={[1, mobile ? 1 : props.selected === 'books' ? 2 : 1.25]} shadows={{ type: PCFSoftShadowMap }}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      style={{ touchAction: props.selected === 'ai' ? 'pan-y pinch-zoom' : 'none' }}>
      <SceneFrameLoop active={visible && (!props.paused || !props.ready)} />
      {ROOM_ENVIRONMENT}
      <ambientLight intensity={0.06 + skyFill * 0.16} color={PALETTE.paperLight} />
      <hemisphereLight args={[sun.skyColor, PALETTE.walnut, 0.10 + skyFill * 0.48]} />
      <directionalLight position={[...position]} intensity={sun.sunIntensity}
        color={sun.sunColor} castShadow shadow-mapSize={[mobile ? 1024 : 2048, mobile ? 1024 : 2048]}
        shadow-camera-left={-5} shadow-camera-right={5} shadow-camera-top={6} shadow-camera-bottom={-5}
        shadow-normalBias={0.018} shadow-bias={-0.0001} shadow-radius={3} />
      <directionalLight position={[4, 4, -3]} intensity={0.04 + skyFill * 0.18} color={PALETTE.paperLight} />
      <WindowDaylight daylight={skyFill} blindLift={props.blindLift} />
      <spotLight name="Room ceiling fill" position={[0, ROOM.architecture.height - 0.13, 0]} intensity={sun.lamp * 0.85} distance={7} decay={2}
        angle={1.3} penumbra={1} color={props.roomPalette.color} />
      <Architecture night={props.night} sky={sun.windowSky} blindLift={props.blindLift} reducedMotion={props.reducedMotion} />
      <Furniture familyPhotoSrc={props.familyPhotoSrc} lamp={sun.lamp} halo={props.halo} onHaloControls={props.onHaloControls} roomControlPanel={props.roomControlPanel} reducedMotion={props.reducedMotion} selected={props.selected} onSelect={props.onSelect} onClaudeSticker={props.onClaudeSticker} onAwardPhoto={props.onAwardPhoto} />
      <BookshelfBooks selected={props.selected} selectedBook={props.selectedBook} pageIndex={props.bookPageIndex} reducedMotion={props.reducedMotion} onBookSelect={props.onBookSelect} onBookStep={props.onBookStep} onApproach={props.onBookshelfApproach} shelfReady={props.bookshelfReady} onShelfReady={props.onBookshelfReady} />
      <OfficeLounge />
      <RoomSwitches onControl={props.onRoomControl} panel={props.roomControlPanel} />
      <OfficeLighting palette={props.roomPalette} power={sun.lamp} tvFocused={props.selected === 'education'} reducedMotion={props.reducedMotion} />
      <GoldAward channelUrl={PERSONAL_LINKS.awardShort} position={ROOM.award.position} rotation={ROOM.award.rotation}
        focused={props.selected === 'award-photo'} reducedMotion={props.reducedMotion} onSelect={props.onAwardPhoto} />
      <PersonalCorner {...props} />
      <CalendarClock reducedMotion={props.reducedMotion} />
      <Movable id="plant"><Greenery reducedMotion={props.reducedMotion} /></Movable>
      <SpineExhibit {...props} />
      <WorkshopObjects focused={props.focused} onApproach={() => props.onSelect('spine')} />
      <Movable id="desk" handle={false}><Folio {...props} /></Movable>
      <Displays {...props} />
      <CameraRig {...props} reading={props.selected !== null} selected={props.focused ?? props.selected} />
      <OfficeRenderer lighting={props.lighting} environmentIntensity={0.12 + skyFill * (0.2 + windowOpen * 0.38)} />
    </Canvas>
  );
}
