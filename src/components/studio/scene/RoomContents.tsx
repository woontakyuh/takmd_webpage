import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useProgress } from '@react-three/drei';
import type { Object3D, SpotLight } from 'three';
import { Architecture } from './Architecture';
import { Furniture } from './Furniture';
import { OfficeLounge } from './OfficeLounge';
import { OfficeLighting, WindowDaylight } from './OfficeLighting';
import { RoomSwitches } from './RoomSwitches';
import { BookshelfBooks } from './BookshelfBooks';
import { PersonalCorner } from './PersonalCorner';
import { CalendarClock } from './CalendarClock';
import { GoldAward } from './GoldAward';
import { Greenery } from './Greenery';
import { SpineExhibit } from './SpineExhibit';
import { WorkshopObjects } from './WorkshopObjects';
import { Movable } from './Movable';
import { Displays } from './Displays';
import { PERSONAL_LINKS } from '../personal';
import { ROOM } from './config';
import { ACADEMIC_OFFICE, TV_WALL_SHIFT } from './roomEdition';
import { preloadRoomAssets } from './preloadRoomAssets';
import type { StudioSceneProps } from '../types';

// The loading picture stands outside the canvas bundle, so the share of room files received reaches it as an event.
function LoadProgress() {
  const { loaded, total } = useProgress();
  useEffect(() => { if (total) window.dispatchEvent(new CustomEvent('office:load-progress', { detail: loaded / total })); }, [loaded, total]);
  return null;
}

// Three compiles a shader for each distinct lighting setup the first time it draws with it. The Talks and UBE views
// unmount the desk and with it the ScreenBar's spot lights, so the first visit to either recompiled about sixty programs
// and froze a phone for a moment. Once the room is in, both lighting setups are compiled ahead of time.
function ShaderWarmup() {
  const gl = useThree(state => state.gl), scene = useThree(state => state.scene), camera = useThree(state => state.camera);
  useEffect(() => {
    let cancelled = false;
    const idle = window.requestIdleCallback ?? ((callback: () => void) => window.setTimeout(callback, 200));
    idle(() => {
      if (cancelled) return;
      void gl.compileAsync(scene, camera).catch(() => undefined);
      const deskLights: Object3D[] = [];
      scene.traverse(object => { if (object.visible && object.name.startsWith('ScreenBar Halo 2') && (object as SpotLight).isSpotLight) deskLights.push(object); });
      if (!deskLights.length) return;
      // compileAsync settles every program's parameters synchronously, so the lights are back before the next frame.
      for (const light of deskLights) light.visible = false;
      try { void gl.compileAsync(scene, camera).catch(() => undefined); } finally { for (const light of deskLights) light.visible = true; }
    });
    return () => { cancelled = true; };
  }, [gl, scene, camera]);
  return null;
}

function StageReady({ onReady }: { readonly onReady: () => void }) {
  const frames = useRef(0);
  useFrame(() => { if (++frames.current === 2) onReady(); });
  return null;
}

export function RoomContents(props: StudioSceneProps & { readonly phone: boolean; readonly daylight: number }) {
  const [stage, setStage] = useState(0);
  const pending = useRef<number | null>(null);
  useEffect(() => { preloadRoomAssets(props.phone); }, [props.phone]);
  useEffect(() => () => { if (pending.current !== null) cancelAnimationFrame(pending.current); }, []);
  const advance = useCallback(() => {
    pending.current = requestAnimationFrame(() => setStage(value => value + 1));
  }, []);
  return <group name="office-surroundings">
    <LoadProgress />
    <Suspense fallback={null}>
      <Architecture night={props.night} sky={props.lighting.sun.windowSky} blindLift={props.blindLift} reducedMotion={props.reducedMotion} phone={props.phone} />
      {!ACADEMIC_OFFICE && <WindowDaylight daylight={props.daylight} blindLift={props.blindLift} />}
      <StageReady onReady={advance} />
    </Suspense>
    {stage >= 1 && <Suspense fallback={null}>
      <Furniture {...props} lamp={props.lighting.sun.lamp} />
      {!ACADEMIC_OFFICE && <OfficeLounge />}
      <Displays {...props} display="tv" />
      <OfficeLighting palette={props.roomPalette} power={props.lighting.sun.lamp} tvFocused={props.selected === 'education'} reducedMotion={props.reducedMotion} />
      <RoomSwitches onControl={props.onRoomControl} panel={props.roomControlPanel} />
      <StageReady onReady={advance} />
    </Suspense>}
    {stage >= 2 && <Suspense fallback={null}>
      {<group position={ACADEMIC_OFFICE ? [0, -.482, TV_WALL_SHIFT] : [0, 0, 0]}><BookshelfBooks selected={props.selected} selectedBook={props.selectedBook} pageIndex={props.bookPageIndex} reducedMotion={props.reducedMotion} onBookSelect={props.onBookSelect} onBookStep={props.onBookStep} onApproach={props.onBookshelfApproach} shelfReady={props.bookshelfReady} onShelfReady={props.onBookshelfReady} /></group>}
      <PersonalCorner {...props} />
      <CalendarClock reducedMotion={props.reducedMotion} />
      {!ACADEMIC_OFFICE && <GoldAward channelUrl={PERSONAL_LINKS.awardShort} position={ROOM.award.position} rotation={ROOM.award.rotation} focused={props.selected === 'award-photo'} reducedMotion={props.reducedMotion} onSelect={props.onAwardPhoto} />}
      <StageReady onReady={advance} />
    </Suspense>}
    {stage >= 3 && <Suspense fallback={null}>
      <Movable id="plant"><Greenery reducedMotion={props.reducedMotion} /></Movable>
      <SpineExhibit {...props} />
      <WorkshopObjects focused={props.focused} onApproach={() => props.onSelect('spine')} />
      <StageReady onReady={props.onRoomReady} />
      <ShaderWarmup />
    </Suspense>}
  </group>;
}
