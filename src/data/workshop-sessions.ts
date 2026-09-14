import type { WorkshopSlug, WorkshopVenue } from './workshops';

export type SessionStatus = 'held' | 'planned';

export type SessionLecture = {
  readonly title: string;
  readonly titleKo?: string;
  readonly speaker: string;
  readonly affiliation: string;
};

export type SessionHandsOn = {
  readonly format: string;
  readonly groups?: number;
  readonly sessions?: number;
  readonly durationMin?: number;
};

export type SessionVenue = WorkshopVenue & { readonly nameKo?: string };

export type WorkshopSession = {
  /** 'YYYY-MM-DD-<slug>'; also the photo folder name. */
  readonly id: string;
  readonly workshop: WorkshopSlug;
  /** Running number across all modalities, in the order sessions were actually held. */
  readonly seriesNo: number;
  /** Running number within one modality. */
  readonly modalityNo: number;
  readonly date: string;
  readonly endDate?: string;
  readonly status: SessionStatus;
  readonly title: string;
  readonly titleKo?: string;
  readonly venue?: SessionVenue;
  readonly host?: readonly string[];
  readonly organizers?: readonly string[];
  readonly audience: string;
  /** Woon Tak Yuh's role in this session. */
  readonly role: 'director' | 'faculty' | 'lecturer';
  readonly lectures?: readonly SessionLecture[];
  readonly handsOn?: SessionHandsOn;
  /** Aggregate only — never names. Absent until a roster is confirmed. */
  readonly trainees?: { readonly count: number; readonly composition?: readonly string[] };
  readonly certification?: boolean;
  /** Short provenance memos for maintainers; not rendered. */
  readonly sources: readonly string[];
};

const DONGTAN: SessionVenue = {
  name: 'Hallym University Dongtan Sacred Heart Hospital',
  nameKo: '한림대학교 동탄성심병원',
  city: 'Hwaseong',
};

/** Songdo venue for the lectures and hands-on sessions the team ran in Incheon. */
const HLB: SessionVenue = {
  name: 'HLB Biostep, Songdo',
  nameKo: 'HLB바이오스텝',
  city: 'Incheon',
};

/** The animal lab on the fourth floor of the same building. */
const HLB_LAB: SessionVenue = {
  name: 'HLB Biostep — training lab (4F)',
  nameKo: 'HLB바이오스텝 4층 실습실',
  city: 'Incheon',
};

const PORCINE_ANATOMY: SessionLecture = {
  title: 'Comparative anatomy of the human and porcine spine',
  titleKo: '사람과 돼지 척추 형태 비교',
  speaker: 'Dong-Choon Ahn',
  affiliation: 'College of Veterinary Medicine, Jeonbuk National University',
};

export const workshopSessions = [
  {
    id: '2025-05-04-dummy',
    workshop: 'dummy',
    seriesNo: 1,
    modalityNo: 1,
    date: '2025-05-04',
    status: 'held',
    title: 'The 1st Endoscopic Spine Surgery Dummy Workshop for Beginners — based on anatomy and pathologies',
    titleKo: 'UBE 더미 워크샵 (사직전공의 대상) 1차',
    venue: DONGTAN,
    host: ['Hallym University Dongtan Sacred Heart Hospital'],
    audience: 'Residents who had resigned during the 2024–25 training-system dispute',
    role: 'lecturer',
    lectures: [
      { title: 'Getting started with endoscopic spine surgery — why, and with which instruments', titleKo: '내시경 척추수술의 시작 — 왜 필요한가, 그리고 어떤 도구를 쓰는가', speaker: 'Il Choi', affiliation: 'Hallym University Dongtan Sacred Heart Hospital' },
      { title: 'Basic anatomy and imaging for endoscopic spine surgery', titleKo: '내시경 척추수술을 위한 기본 해부학과 영상 이해', speaker: 'Woon Tak Yuh', affiliation: 'Davos Hospital' },
      { title: 'Learning from cases — real techniques and tips', titleKo: '케이스로 배우는 내시경 수술 — 실제 술기와 팁', speaker: 'Jun-Su Jang', affiliation: 'Hallym University Dongtan Sacred Heart Hospital' },
    ],
    handsOn: { format: 'Three small groups rotating through dummy stations', groups: 3, sessions: 2, durationMin: 120 },
    sources: ['1st dummy agenda PDF', 'GCal DT NS Spine'],
  },
  {
    id: '2025-06-15-dummy',
    workshop: 'dummy',
    seriesNo: 2,
    modalityNo: 2,
    date: '2025-06-15',
    status: 'held',
    title: 'The 2nd Endoscopic Spine Surgery Dummy Workshop for Beginners',
    titleKo: 'UBE 더미 워크샵 (사직전공의 대상) 2차',
    venue: DONGTAN,
    host: ['Hallym University Dongtan Sacred Heart Hospital'],
    audience: 'Residents who had resigned during the 2024–25 training-system dispute',
    role: 'lecturer',
    lectures: [
      { title: 'Introduction to UBE for beginners', speaker: 'Woon Tak Yuh', affiliation: 'Davos Hospital' },
    ],
    handsOn: { format: 'Small-group dummy stations', groups: 3 },
    sources: ['Notion Schedule', '2nd dummy lecture deck', 'GCal DT NS Spine'],
  },
  {
    id: '2025-08-24-dummy',
    workshop: 'dummy',
    seriesNo: 3,
    modalityNo: 3,
    date: '2025-08-24',
    status: 'held',
    title: 'The 3rd Endoscopic Spine Surgery Dummy Workshop for Beginners',
    titleKo: '더미 워크샵 3차',
    venue: DONGTAN,
    host: ['Hallym University Dongtan Sacred Heart Hospital'],
    audience: 'Beginner spine surgeons and residents',
    role: 'faculty',
    handsOn: { format: 'Small-group dummy stations' },
    sources: ['GCal Conference'],
  },
  {
    id: '2025-10-12-dummy',
    workshop: 'dummy',
    seriesNo: 4,
    modalityNo: 4,
    date: '2025-10-12',
    status: 'held',
    title: 'The 4th Endoscopic Spine Surgery Dummy Workshop for Beginners',
    titleKo: '더미 워크샵 4차',
    venue: DONGTAN,
    host: ['Hallym University Dongtan Sacred Heart Hospital'],
    audience: 'Beginner spine surgeons and residents',
    role: 'faculty',
    handsOn: { format: 'Small-group dummy stations' },
    sources: ['GCal Conference (moved from 2025-10-05)'],
  },
  {
    id: '2025-12-20-animal-pig',
    workshop: 'animal-pig',
    seriesNo: 5,
    modalityNo: 1,
    date: '2025-12-20',
    status: 'held',
    title: 'The 5th Endoscopic Spine Surgery — 1st Animal Lab Workshop for Beginners',
    titleKo: '척추 내시경 동물 실습 워크샵 1회',
    venue: HLB_LAB,
    host: ['Hallym University Dongtan Sacred Heart Hospital'],
    audience: 'Beginner spine surgeons (0–30 endoscopic cases)',
    role: 'faculty',
    lectures: [PORCINE_ANATOMY],
    handsOn: { format: 'Live porcine model, one station per small group', durationMin: 180 },
    trainees: {
      count: 8,
      composition: ['Fellow ×3', 'Clinical assistant professor ×1', 'Resident ×1', 'Military hospital surgeon ×2', 'Regional hospital orthopaedic surgeon ×1'],
    },
    sources: ['Dec 2025 workshop poster', 'Pre-post evaluation summary', 'GCal Conference'],
  },
  {
    id: '2026-06-13-dummy',
    workshop: 'dummy',
    seriesNo: 6,
    modalityNo: 5,
    date: '2026-06-13',
    status: 'held',
    title: 'The 6th Endoscopic Spine Surgery Dummy Workshop for Beginners',
    titleKo: '제6회 척추 내시경 더미 워크샵',
    venue: HLB,
    host: ['Hallym University Dongtan Sacred Heart Hospital'],
    audience: 'Beginner spine surgeons and residents',
    role: 'faculty',
    lectures: [
      { title: 'Hurdles and Lessons, from Trainee to Trainer', speaker: 'Jae-Koo Lee', affiliation: 'Seoul National University Bundang Hospital' },
    ],
    handsOn: { format: 'Small-group dummy stations' },
    sources: ['Invited lecture deck', 'Workshop photo set', 'Group-photo banner', 'Photo GPS'],
  },
  {
    id: '2026-08-08-animal-pig',
    workshop: 'animal-pig',
    seriesNo: 7,
    modalityNo: 2,
    date: '2026-08-08',
    status: 'held',
    title: 'The 7th Endoscopic Spine Surgery Animal Lab Workshop for Beginners',
    titleKo: '2026 동물 워크샵 1회',
    venue: HLB_LAB,
    host: ['Hallym University Dongtan Sacred Heart Hospital'],
    organizers: ['endovision', 'Incheon Technopark', 'Hayan Medical'],
    audience: 'Beginner spine surgeons (0–30 endoscopic cases)',
    role: 'faculty',
    lectures: [
      { title: 'Strategies for effective endoscopic spine surgery education', titleKo: '척추 내시경 수술 효과적인 교육을 위한 전략', speaker: 'Jin-Sung Kim', affiliation: "Seoul St. Mary's Hospital, The Catholic University of Korea" },
      PORCINE_ANATOMY,
    ],
    handsOn: { format: 'Live porcine model, morning and afternoon sections with two faculty per group', groups: 2, sessions: 2, durationMin: 300 },
    certification: true,
    sources: ['Official program and invitation', 'GCal Conference'],
  },
  {
    id: '2026-12-19-cadaver',
    workshop: 'cadaver',
    seriesNo: 8,
    modalityNo: 1,
    date: '2026-12-19',
    status: 'planned',
    title: 'Endoscopic Spine Surgery Cadaver Workshop for Beginners (1st)',
    titleKo: '척추 내시경 카데바 워크샵 1회',
    venue: {
      name: 'Catholic International Bioskills Education Center (CIBEC)',
      nameKo: '가톨릭대학교 국제술기교육센터',
      city: 'Seoul',
    },
    host: ['Hallym University Dongtan Sacred Heart Hospital'],
    audience: 'Beginner spine surgeons who completed the dummy or animal stage',
    role: 'faculty',
    sources: ['GCal Conference (content changed from animal to human cadaver)'],
  },
] as const satisfies readonly WorkshopSession[];

export function getSession(id: string): WorkshopSession | undefined {
  return workshopSessions.find((session) => session.id === id);
}

export function sessionsFor(slug: WorkshopSlug): readonly WorkshopSession[] {
  return workshopSessions.filter((session) => session.workshop === slug);
}
