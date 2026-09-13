import type { PersonalBookId } from './personalBooks';
import type { RefObject } from 'react';
import type { RoomLightPalette } from './lightingPresets';
import type { RoomControl } from './OfficeRoomControls';
import type { OfficeLight } from './localTime';
import type { OfficeEntryPhase } from './officeEntry';

export type ExhibitId = 'spine' | 'research' | 'education' | 'ai' | 'bjj' | 'surfing' | 'projects' | 'family' | 'award' | 'award-photo' | 'bookshelf' | 'books';

export type Publication = {
  readonly id: string;
  readonly title: string;
  readonly journal: string;
  readonly year: number;
  readonly role: string;
  readonly doiUrl: string;
};

export type Presentation = {
  readonly id: string;
  readonly title: string;
  readonly date: string;
  readonly venue: string;
  readonly topic: string;
};

export type PaperMedia = {
  readonly doiUrl: string;
  readonly pageImage: string;
  readonly sourceUrl: string;
  readonly credit: string;
  readonly license: string;
};

export type TalkSlide = { readonly src: string; readonly caption: string; readonly thumbnail?: string; readonly width?: number; readonly height?: number };
export type TalkMedia = { readonly id: string; readonly slides: readonly TalkSlide[]; readonly kind?: 'full' | 'selected' | 'photos'; readonly role?: string };
export type ProjectId = 'imaging' | 'workflow';

export type OfficeCollection = {
  readonly publication: Publication | null;
  readonly paperMedia: PaperMedia | null;
  readonly paperTurn: number;
  readonly paperDirection: 1 | -1;
  readonly paperIndex: number;
  readonly paperCount: number;
  readonly presentation: Presentation | null;
  readonly talkSlide: TalkSlide | null;
};

export type HaloSettings = {
  readonly enabled: boolean | null;
  readonly brightness: number;
  readonly temperature: number;
};

export type BlindLift = readonly [number, number];

export type StudioSceneProps = {
  readonly entry: OfficeEntryPhase;
  readonly onEntryComplete: () => void;
  readonly ready: boolean;
  readonly paused?: boolean;
  readonly focused: ExhibitId | null;
  readonly monitorScroll: { scrollTop: number };
  readonly selectedBook: PersonalBookId;
  readonly bookPageIndex: number;
  readonly onBookSelect: (id: PersonalBookId) => void;
  readonly onBookStep: (direction: 1 | -1) => void;
  readonly onBookshelfApproach: () => void;
  readonly bookshelfVisit: number;
  readonly bookshelfReady: boolean;
  readonly onBookshelfReady: (ready: boolean) => void;
  readonly familyPhotoSrc: string;
  readonly progress: RefObject<number>;
  readonly selected: ExhibitId | null;
  readonly night: boolean;
  readonly lighting: OfficeLight;
  readonly roomPalette: RoomLightPalette;
  readonly blindLift: BlindLift;
  readonly halo: { readonly power: number; readonly brightness: number; readonly temperature: number };
  readonly onRoomControl: (control: RoomControl) => void;
  readonly roomControlPanel?: RefObject<HTMLDivElement | null>;
  readonly onHaloControls: () => void;
  readonly reducedMotion: boolean;
  readonly compact: boolean;
  readonly collection: OfficeCollection;
  readonly viewCommand: { readonly sequence: number; readonly view: 0 | 1 | 2 };
  readonly presentations: readonly Presentation[];
  readonly onSelect: (id: ExhibitId) => void;
  readonly onClose: () => void;
  readonly onClaudeSticker: () => void;
  readonly onAwardPhoto: () => void;
  readonly onPaperStep: (direction: 1 | -1) => void;
  readonly onReady: () => void;
  readonly onTalk: (id: string | null) => void;
  readonly onTalkSlide: (index: number) => void;
};

export type StudioContent = {
  readonly publications: readonly Publication[];
  readonly presentations: readonly Presentation[];
  readonly updatedAt: string;
  readonly presentationsUpdatedAt: string;
};
