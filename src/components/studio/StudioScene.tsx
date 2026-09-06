import { Canvas } from '@react-three/fiber';
import { PCFShadowMap } from 'three';
import type { StudioSceneProps } from './types';
import { Architecture } from './scene/Architecture';
import { CameraRig } from './scene/CameraRig';
import { Furniture } from './scene/Furniture';
import { Greenery } from './scene/Greenery';
import { SpineExhibit } from './scene/SpineExhibit';
import { Folio } from './scene/Folio';
import { Displays } from './scene/Displays';
import { CalendarClock } from './scene/CalendarClock';
import { OfficeLounge } from './scene/OfficeLounge';
import { PALETTE, TOUR } from './scene/config';

export function StudioScene(props: StudioSceneProps) {
  const { sun, position } = props.lighting;
  return (
    <Canvas camera={{ position: [...TOUR[0].position], fov: 42, near: 0.05, far: 60 }}
      dpr={[1, props.compact ? 1.35 : 1.75]} shadows={{ type: PCFShadowMap }}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      style={{ touchAction: 'none' }}>
      <ambientLight intensity={0.5 + sun.ambientIntensity * 0.6} color={PALETTE.paperLight} />
      <hemisphereLight args={[sun.skyColor, PALETTE.walnut, 0.35 + sun.daylight * 0.7]} />
      <directionalLight position={[...position]} intensity={sun.sunIntensity}
        color={sun.sunColor} castShadow shadow-mapSize={[props.compact ? 1024 : 2048, props.compact ? 1024 : 2048]}
        shadow-camera-left={-5} shadow-camera-right={5} shadow-camera-top={6} shadow-camera-bottom={-5}
        shadow-normalBias={0.018} shadow-bias={-0.0001} shadow-radius={3} />
      <directionalLight position={[4, 4, 3]} intensity={0.65 + sun.daylight * 0.25} color={PALETTE.paperLight} />
      <Architecture night={props.night} sky={sun.windowSky} />
      <Furniture lamp={sun.lamp} />
      <OfficeLounge />
      <CalendarClock reducedMotion={props.reducedMotion} />
      <Greenery />
      <SpineExhibit {...props} />
      <Folio {...props} />
      <Displays {...props} />
      <CameraRig {...props} />
    </Canvas>
  );
}
