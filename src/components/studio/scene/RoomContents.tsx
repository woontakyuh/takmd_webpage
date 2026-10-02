import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
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
import { preloadRoomAssets } from './preloadRoomAssets';
import type { StudioSceneProps } from '../types';

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
    <Suspense fallback={null}>
      <Architecture night={props.night} sky={props.lighting.sun.windowSky} blindLift={props.blindLift} reducedMotion={props.reducedMotion} phone={props.phone} />
      <WindowDaylight daylight={props.daylight} blindLift={props.blindLift} />
      <StageReady onReady={advance} />
    </Suspense>
    {stage >= 1 && <Suspense fallback={null}>
      <Furniture {...props} lamp={props.lighting.sun.lamp} />
      <OfficeLounge />
      <Displays {...props} display="tv" />
      <OfficeLighting palette={props.roomPalette} power={props.lighting.sun.lamp} tvFocused={props.selected === 'education'} reducedMotion={props.reducedMotion} />
      <RoomSwitches onControl={props.onRoomControl} panel={props.roomControlPanel} />
      <StageReady onReady={advance} />
    </Suspense>}
    {stage >= 2 && <Suspense fallback={null}>
      <BookshelfBooks selected={props.selected} selectedBook={props.selectedBook} pageIndex={props.bookPageIndex} reducedMotion={props.reducedMotion} onBookSelect={props.onBookSelect} onBookStep={props.onBookStep} onApproach={props.onBookshelfApproach} shelfReady={props.bookshelfReady} onShelfReady={props.onBookshelfReady} />
      <PersonalCorner {...props} />
      <CalendarClock reducedMotion={props.reducedMotion} />
      <GoldAward channelUrl={PERSONAL_LINKS.awardShort} position={ROOM.award.position} rotation={ROOM.award.rotation} focused={props.selected === 'award-photo'} reducedMotion={props.reducedMotion} onSelect={props.onAwardPhoto} />
      <StageReady onReady={advance} />
    </Suspense>}
    {stage >= 3 && <Suspense fallback={null}>
      <Movable id="plant"><Greenery reducedMotion={props.reducedMotion} /></Movable>
      <SpineExhibit {...props} />
      <WorkshopObjects focused={props.focused} onApproach={() => props.onSelect('spine')} />
      <StageReady onReady={props.onRoomReady} />
    </Suspense>}
  </group>;
}
