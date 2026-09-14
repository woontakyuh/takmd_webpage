import type { CompetencyKey } from './workshop-curriculum';

export type OutcomeQuote = { readonly en: string; readonly ko: string };

export type WorkshopOutcome = {
  readonly sessionId: string;
  /** Respondents with both pre and post forms. */
  readonly n: number;
  readonly scale: { readonly min: 0; readonly max: 5; readonly itemsPerDomain: 3; readonly domainMax: 15 };
  /** Mean domain score (0–15) across respondents, before and after the session. */
  readonly domains: readonly { readonly key: CompetencyKey; readonly pre: number; readonly post: number }[];
  readonly composition: readonly string[];
  /** Anonymous free-text answers to "why did this format help most?". */
  readonly quotes: readonly OutcomeQuote[];
  /** Steps trainees named as where they get stuck, most-cited first. */
  readonly difficulties?: readonly string[];
};

export const workshopOutcomes = [
  {
    sessionId: '2025-12-20-animal-pig',
    n: 8,
    scale: { min: 0, max: 5, itemsPerDomain: 3, domainMax: 15 },
    domains: [
      { key: 'anatomy', pre: 7.0, post: 9.25 },
      { key: 'instrumentation', pre: 7.0, post: 9.38 },
      { key: 'access', pre: 6.5, post: 9.12 },
      { key: 'boneWork', pre: 6.5, post: 8.75 },
      { key: 'softTissue', pre: 5.75, post: 7.88 },
      { key: 'safety', pre: 5.62, post: 7.62 },
    ],
    composition: ['Fellow ×3', 'Clinical assistant professor ×1', 'Resident ×1', 'Military hospital surgeon ×2', 'Regional hospital orthopaedic surgeon ×1'],
    quotes: [
      { en: 'Because it was a live animal, there was bleeding and the nerves reacted — that is what made it useful.', ko: 'Live animal이어서 bleeding과 nerve 반응이 있어서 좋았다.' },
      { en: 'It was the only program where I could actually use the real surgical equipment.', ko: '교육 프로그램 중 실제 수술 장비를 이용할 수 있었던 유일한 기회였습니다.' },
      { en: 'Unlike the dummy or the cadaver, I could practise bleeding control as well as the technique itself.', ko: '직접 술기를 시행할 수 있고 dummy, 카데바와 달리 bleeding control도 연습해볼 수 있어서.' },
      { en: 'The cadaver is anatomically identical to a patient, which I think helps more than the animal in that respect.', ko: '카데바의 경우 동물과 다르게 해부학적으로 동일해서 더 도움이 된 것 같습니다.' },
    ],
    difficulties: ['Docking and soft-tissue dissection', 'Flavectomy', 'Drilling and bone work', 'Finding the upper margin of the caudal lamina'],
  },
] as const satisfies readonly WorkshopOutcome[];

export function outcomeFor(sessionId: string): WorkshopOutcome | undefined {
  return workshopOutcomes.find((outcome) => outcome.sessionId === sessionId);
}
