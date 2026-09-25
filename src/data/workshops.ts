export const workshopSlugs = ['dummy', 'cadaver', 'animal-pig'] as const;

export type WorkshopSlug = (typeof workshopSlugs)[number];

export type WorkshopVenue = {
  readonly name: string;
  readonly city: string;
};

export type Workshop = {
  readonly slug: WorkshopSlug;
  readonly title: string;
  readonly titleKo: string;
  /** Position in the five-step curriculum (see workshop-curriculum.ts). */
  readonly stage: 3 | 4 | 5;
  readonly objectLabel: string;
  readonly description: string;
  readonly focus: readonly string[];
  readonly defaultVenue?: WorkshopVenue;
};

export const workshops = [
  {
    slug: 'dummy',
    title: 'Dummy workshop',
    titleKo: '더미 워크샵',
    stage: 3,
    objectLabel: 'UpSurgeOn Endoscopic LumbarBox',
    description: 'Simulation-based spine training with the UpSurgeOn Endoscopic LumbarBox for portal setup, instrument orientation, and stepwise rehearsal.',
    focus: ['Portal setup', 'Instrument orientation', 'Stepwise rehearsal'],
    defaultVenue: { name: 'Hallym University Dongtan Sacred Heart Hospital', city: 'Hwaseong' },
  },
  {
    slug: 'cadaver',
    title: 'Cadaver workshop',
    titleKo: '카데바 워크샵',
    stage: 5,
    objectLabel: 'Biportal instruments',
    description: 'Anatomy-based training for orientation, portal planning, and technique sequence.',
    focus: ['Anatomical orientation', 'Portal planning', 'Technique sequence'],
  },
  {
    slug: 'animal-pig',
    title: 'Animal (pig) live workshop',
    titleKo: '동물(돼지) 라이브 워크샵',
    stage: 4,
    objectLabel: 'Pig workshop',
    description: 'Live animal workshop materials organized around program context and training scope.',
    focus: ['Workshop format', 'Training scope', 'Teaching materials'],
    defaultVenue: { name: 'HLB Biostep training lab', city: 'Incheon' },
  },
] as const satisfies readonly Workshop[];

export function getWorkshop(slug: string): Workshop | undefined {
  return workshops.find((workshop) => workshop.slug === slug);
}
