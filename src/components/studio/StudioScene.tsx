import { Canvas } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { PCFSoftShadowMap } from 'three';
import { useCallback, useState } from 'react';
import { AdaptiveQuality } from './scene/AdaptiveQuality';
import { OfficeRenderer } from './scene/OfficeRenderer';
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
import { OfficeLounge } from './scene/OfficeLounge';
import { PersonalCorner } from './scene/PersonalCorner';
import { PALETTE, ROOM, TOUR } from './scene/config';

export function StudioScene(props: StudioSceneProps) {
  const { sun, position } = props.lighting;
  const [quality, setQuality] = useState(1.75);
  const changeQuality = useCallback((step: number) => {
    setQuality(current => Math.max(0.75, Math.min(1.75, current + step)));
  }, []);
  return (
    <Canvas camera={{ position: [...TOUR[0].position], fov: 42, near: 0.015, far: 60 }}
      dpr={[0.75, Math.min(quality, props.compact ? 1.35 : 1.75)]} shadows={{ type: PCFSoftShadowMap }}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      style={{ touchAction: 'none' }}>
      <Environment resolution={128} frames={1} environmentIntensity={0.45 + sun.daylight * 0.2}>
        <color attach="background" args={[PALETTE.plaster]} />
        <Lightformer form="rect" color="#fff8ed" intensity={2} scale={[6, 3, 1]}
          position={[-4, 2.5, 0]} rotation={[0, Math.PI / 2, 0]} />
        <Lightformer form="rect" color="#ffffff" intensity={1.5} scale={[4, 4, 1]}
          position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]} />
        <Lightformer form="rect" color="#ffffff" intensity={1} scale={[3, 3, 1]}
          position={[3, 2, -4]} rotation={[0, -Math.PI / 4, 0]} />
      </Environment>
      <ambientLight intensity={0.45 + sun.ambientIntensity * 0.45} color={PALETTE.paperLight} />
      <hemisphereLight args={[sun.skyColor, PALETTE.walnut, 0.35 + sun.daylight * 0.7]} />
      <directionalLight position={[...position]} intensity={sun.sunIntensity}
        color={sun.sunColor} castShadow shadow-mapSize={[props.compact ? 1024 : 2048, props.compact ? 1024 : 2048]}
        shadow-camera-left={-5} shadow-camera-right={5} shadow-camera-top={6} shadow-camera-bottom={-5}
        shadow-normalBias={0.018} shadow-bias={-0.0001} shadow-radius={3} />
      <directionalLight position={[4, 4, -3]} intensity={0.65 + sun.daylight * 0.25} color={PALETTE.paperLight} />
      <spotLight position={[0, ROOM.architecture.height - 0.13, 0]} intensity={12 + sun.lamp * 8} distance={7} decay={2}
        angle={1.3} penumbra={1} color={PALETTE.paperLight} castShadow
        shadow-mapSize={[1024, 1024]} shadow-normalBias={0.008} shadow-bias={-0.0001} />
      <Architecture night={props.night} sky={sun.windowSky} />
      <Furniture lamp={sun.lamp} reducedMotion={props.reducedMotion} selected={props.selected} onSelect={props.onSelect} onClaudeSticker={props.onClaudeSticker} />
      <OfficeLounge />
      <GoldAward channelUrl={PERSONAL_LINKS.awardShort} position={[1.58, 1.3025, 2.985]} rotation={Math.PI}
        focused={props.selected === 'award'} reducedMotion={props.reducedMotion} onSelect={() => props.onSelect('award')} />
      <PersonalCorner {...props} />
      <CalendarClock reducedMotion={props.reducedMotion} />
      <Greenery />
      <SpineExhibit {...props} />
      <WorkshopObjects />
      <Folio {...props} />
      <Displays {...props} />
      <CameraRig {...props} />
      <AdaptiveQuality onChange={changeQuality} />
      <OfficeRenderer lighting={props.lighting} />
    </Canvas>
  );
}
