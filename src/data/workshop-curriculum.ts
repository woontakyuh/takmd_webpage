import type { WorkshopSlug } from './workshops';

export type CurriculumStage = {
  readonly n: 1 | 2 | 3 | 4 | 5;
  readonly title: string;
  readonly titleKo: string;
  /** Present when the stage has its own modality page. */
  readonly slug?: WorkshopSlug;
  readonly summary: string;
};

/** The five-step learning chain the team designed; stages loop back on one another rather than run once. */
export const curriculumStages = [
  { n: 1, title: 'Textbook and surgical video', titleKo: '교과서·수술 영상 학습', summary: 'Self-study of anatomy, instruments and recorded procedures.' },
  { n: 2, title: 'OR observation and limited assist', titleKo: '수술 참관·제한적 어시스트', summary: 'Watching live cases and assisting where the endoscopic workflow allows.' },
  { n: 3, title: 'Dummy simulation', titleKo: '더미 시뮬레이션', slug: 'dummy', summary: 'Portal setup, orientation and stepwise rehearsal on a lumbar simulator.' },
  { n: 4, title: 'Live animal lab', titleKo: '살아있는 동물(돼지) 실습', slug: 'animal-pig', summary: 'Bleeding, tissue response and instrument handling under real physiology.' },
  { n: 5, title: 'Cadaver lab', titleKo: '카데바 실습', slug: 'cadaver', summary: 'Human anatomy for corridor planning and decompression sequence.' },
] as const satisfies readonly CurriculumStage[];

export const competencyKeys = ['anatomy', 'instrumentation', 'access', 'boneWork', 'softTissue', 'safety'] as const;

export type CompetencyKey = (typeof competencyKeys)[number];

export type CompetencyDomain = {
  readonly key: CompetencyKey;
  readonly label: string;
  readonly labelKo: string;
};

/** Six core competency domains scored 0–15 each (3 items × 0–5) in pre/post self-assessment. */
export const competencyDomains = [
  { key: 'anatomy', label: 'Endoscopic anatomy and spatial orientation', labelKo: '내시경 해부학 인지·공간 지각' },
  { key: 'instrumentation', label: 'Instrument handling and endoscopic ergonomics', labelKo: '기구 조작·내시경 인체공학' },
  { key: 'access', label: 'Access planning and corridor establishment', labelKo: '접근 계획·작업 통로 형성' },
  { key: 'boneWork', label: 'Targeted bony decompression', labelKo: '목표 골 감압' },
  { key: 'softTissue', label: 'Soft tissue handling and neural safety', labelKo: '연부조직 처리·신경 안전' },
  { key: 'safety', label: 'Intraoperative physiology and safety management', labelKo: '수술 중 생리·안전 관리' },
] as const satisfies readonly CompetencyDomain[];
