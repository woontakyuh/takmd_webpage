import type { WorkshopSlug } from './workshops';

export type AppearanceRelation = 'team-dispatch' | 'team-support' | 'individual';

export type FacultyAppearance = {
  readonly id: string;
  readonly date: string;
  readonly endDate?: string;
  readonly status: 'held' | 'planned';
  readonly event: string;
  readonly title?: string;
  readonly modality: WorkshopSlug;
  /**
   * team-dispatch: the team was asked and sent faculty as a team.
   * team-support: another organizer's event that team faculty helped run.
   * individual: a personal faculty invitation.
   */
  readonly relation: AppearanceRelation;
  readonly venue: { readonly name: string; readonly city: string; readonly country: string };
  readonly requestedBy?: { readonly name: string; readonly affiliation: string };
  readonly teamMembers?: readonly string[];
  readonly note?: string;
  readonly links?: { readonly presentationId?: string; readonly mediaCaption?: string };
  readonly sources: readonly string[];
};

export const facultyAppearances = [
  {
    id: '2026-02-26-spine-summit',
    date: '2026-02-26',
    endDate: '2026-02-28',
    status: 'held',
    event: 'Spine Summit',
    title: 'Special Course 4 — cadaver lab instructor',
    modality: 'cadaver',
    relation: 'individual',
    venue: { name: 'Spine Summit 2026', city: 'Phoenix, AZ', country: 'USA' },
    note: 'Personal faculty invitation; already listed under presentations.',
    links: { presentationId: '2c7908af25b980edbfc6df234f22a8f1' },
    sources: ['Spine Summit faculty letter', 'Notion Schedule'],
  },
  {
    id: '2026-06-08-tsess-hualien',
    date: '2026-06-08',
    endDate: '2026-06-09',
    status: 'held',
    event: 'TSESS 2026 endoscopic spine cadaver workshop',
    title: 'FE/BE interlaminar and transforaminal decompression, PCF and TLIF stations',
    modality: 'cadaver',
    relation: 'team-dispatch',
    venue: { name: 'Tzu Chi University Medical Simulation Center', city: 'Hualien', country: 'Taiwan' },
    requestedBy: { name: 'Chien-Min Chen', affiliation: 'Taiwan Society of Endoscopic Spine Surgery' },
    note: 'Requested as a team; both societies agreed to keep exchanging faculty on request.',
    sources: ['Notion Schedule', 'Team discussion'],
  },
  {
    id: '2026-09-12-cgbio-cadaver',
    date: '2026-09-12',
    status: 'held',
    event: 'CGBIO Academy cadaver workshop',
    title: 'Mastering the Endoscope Essentials: From Heritage to Hybrid',
    modality: 'cadaver',
    relation: 'individual',
    venue: { name: 'Catholic International Bioskills Education Center', city: 'Seoul', country: 'Korea' },
    note: 'Faculty; participants from Korea and Brazil.',
    sources: ['Workshop program', 'GCal Conference'],
  },
  {
    id: '2026-11-29-wsc-dummy',
    date: '2026-11-29',
    status: 'planned',
    event: 'WSC 2026 / 25th KOMISS Symposium',
    title: 'Dummy workshop day (Room 4)',
    modality: 'dummy',
    relation: 'team-support',
    venue: { name: 'Songdo ConvensiA', city: 'Incheon', country: 'Korea' },
    note: 'KOMISS-hosted congress; team faculty support the dummy workshop that Woon Tak Yuh coordinates as academic secretary.',
    sources: ['WSC academic committee notes'],
  },
] as const satisfies readonly FacultyAppearance[];
