import type { RefObject } from 'react';
import type { OfficeLight } from './localTime';

export type ExhibitId = 'spine' | 'research' | 'education' | 'ai';

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

export type TalkSlide = { readonly src: string; readonly caption: string };
export type TalkMedia = { readonly id: string; readonly slides: readonly TalkSlide[] };
export type ProjectId = 'imaging' | 'workflow';

export type OfficeCollection = {
  readonly publication: Publication | null;
  readonly paperMedia: PaperMedia | null;
  readonly paperTurn: number;
  readonly paperDirection: 1 | -1;
  readonly presentation: Presentation | null;
  readonly talkSlide: TalkSlide | null;
  readonly project: ProjectId | null;
};

export type StudioSceneProps = {
  readonly progress: RefObject<number>;
  readonly selected: ExhibitId | null;
  readonly night: boolean;
  readonly lighting: OfficeLight;
  readonly reducedMotion: boolean;
  readonly compact: boolean;
  readonly collection: OfficeCollection;
  readonly viewCommand: { readonly sequence: number; readonly view: 0 | 1 | 2 };
  readonly presentations: readonly Presentation[];
  readonly onSelect: (id: ExhibitId) => void;
  readonly onReady: () => void;
};

export type StudioContent = {
  readonly publications: readonly Publication[];
  readonly presentations: readonly Presentation[];
  readonly updatedAt: string;
  readonly presentationsUpdatedAt: string;
};
