export const workshopSlugs = ['dummy', 'cadaver', 'animal-pig'] as const;

export type WorkshopSlug = (typeof workshopSlugs)[number];

export type Workshop = {
  readonly slug: WorkshopSlug;
  readonly title: string;
  readonly objectLabel: string;
  readonly description: string;
  readonly focus: readonly string[];
};

export const workshops = [
  {
    slug: 'dummy',
    title: 'Dummy workshop',
    objectLabel: 'Spine training dummy',
    description: 'Simulation-based spine training for portal setup, instrument orientation, and stepwise rehearsal.',
    focus: ['Portal setup', 'Instrument orientation', 'Stepwise rehearsal'],
  },
  {
    slug: 'cadaver',
    title: 'Cadaver workshop',
    objectLabel: 'Biportal instruments',
    description: 'Anatomy-based training for orientation, portal planning, and technique sequence.',
    focus: ['Anatomical orientation', 'Portal planning', 'Technique sequence'],
  },
  {
    slug: 'animal-pig',
    title: 'Animal (pig) live workshop',
    objectLabel: 'Pig workshop',
    description: 'Live animal workshop materials organized around program context and training scope.',
    focus: ['Workshop format', 'Training scope', 'Teaching materials'],
  },
] as const satisfies readonly Workshop[];

export function getWorkshop(slug: string): Workshop | undefined {
  return workshops.find((workshop) => workshop.slug === slug);
}
