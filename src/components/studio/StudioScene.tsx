import { Movable } from './scene/Movable';
import { Canvas } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { MathUtils, PCFSoftShadowMap } from 'three';
import { OfficeRenderer } from './scene/OfficeRenderer';
import { needsWholePixelRatio } from './scene/renderBudget';
import { SceneFrameLoop } from './scene/SceneFrameLoop';
import { StaticMerge } from './scene/StaticMerge';
import { GuidedViewProvider } from './scene/GuidedView';
import { RoomReadyProvider } from './scene/DeferredAssets';
import { DeviceProvider } from './scene/Device';
import { serveRoomImages } from './scene/phoneImages';
import type { StudioSceneProps } from './types';
import { CameraRig } from './scene/CameraRig';
import { DeskFurniture } from './scene/DeskFurniture';
import { Folio } from './scene/Folio';
import { Displays } from './scene/Displays';
import { PALETTE, ROOM, TOUR } from './scene/config';

const RoomContents = lazy(() => import('./scene/RoomContents').then(module => ({ default: module.RoomContents })));

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
  const [wholePixels] = useState(() => typeof navigator !== 'undefined' && needsWholePixelRatio(navigator.userAgent));
  const [pixelRatio, setPixelRatio] = useState(wholePixels ? 1 : 0.85);
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
      dpr={props.entry === 'capture' ? 2 : pixelRatio} shadows={{ type: PCFSoftShadowMap }}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      // A phone's web process is killed near 1.5 GB and the room held 858 MB of textures alone, fifteen of them 2048².
      // Three resizes any image above this limit on a canvas before upload, so capping it here caps every loader at once.
      onCreated={({ gl }) => { gl.capabilities.maxTextureSize = Math.min(gl.capabilities.maxTextureSize, mobile ? 1024 : 2048); serveRoomImages(); }}
      style={{ touchAction: props.selected === 'ai' ? 'pan-y pinch-zoom' : 'none' }}>
      <DeviceProvider phone={mobile}>
      <RoomReadyProvider ready={props.roomReady}>
      <GuidedViewProvider section={props.guidedSection ?? null}>
      <SceneFrameLoop onPixelRatioChange={setPixelRatio} wholePixels={wholePixels} capture={props.entry === 'capture'} active={visible && (!props.paused || !props.roomReady)} settled={props.roomReady && (props.entry === 'complete' || props.entry === 'reading')} />
      <StaticMerge />
      {ROOM_ENVIRONMENT}
      <ambientLight intensity={0.06 + skyFill * 0.16} color={PALETTE.paperLight} />
      <hemisphereLight args={[sun.skyColor, PALETTE.walnut, 0.10 + skyFill * 0.48]} />
      <directionalLight position={[...position]} intensity={sun.sunIntensity}
        color={sun.sunColor} castShadow shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-5} shadow-camera-right={5} shadow-camera-top={6} shadow-camera-bottom={-5}
        shadow-normalBias={0.018} shadow-bias={-0.0001} shadow-radius={3} />
      <directionalLight position={[4, 4, -3]} intensity={0.04 + skyFill * 0.18} color={PALETTE.paperLight} />
      <spotLight name="Room ceiling fill" position={[0, ROOM.architecture.height - 0.13, 0]} intensity={sun.lamp * 0.85} distance={7} decay={2}
        angle={1.3} penumbra={1} color={props.roomPalette.color} />
      <DeskFurniture {...props} />
      {props.ready && <Suspense fallback={null}><RoomContents {...props} phone={mobile} daylight={skyFill} /></Suspense>}
      <Movable id="desk" handle={false}><Folio {...props} /></Movable>
      <Displays {...props} display="monitor" />
      <CameraRig {...props} reading={props.selected !== null} selected={props.focused ?? props.selected} />
      <OfficeRenderer lighting={props.lighting} environmentIntensity={0.12 + skyFill * (0.2 + windowOpen * 0.38)} />
      </GuidedViewProvider>
      </RoomReadyProvider>
      </DeviceProvider>
    </Canvas>
  );
}
