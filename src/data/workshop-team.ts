export type TeamMember = {
  readonly name: string;
  readonly nameKo: string;
  readonly affiliation: string;
};

export const workshopTeam = {
  name: 'Spinoscopy Workshop Team',
  nameKo: '스피노스코피 워크샵 팀',
  summary:
    'Eight endoscopic spine surgeons who run the ESS Workshop for Beginners together — the same faculty, in matching team uniforms, across dummy, live-animal and cadaver sessions — so that trainees meet one continuous teaching voice from the simulator to the cadaver table.',
  members: [
    { name: 'Woon Tak Yuh', nameKo: '여운탁', affiliation: 'Davos Hospital, Yongin' },
    { name: 'Il Choi', nameKo: '최일', affiliation: 'Hallym University Dongtan Sacred Heart Hospital' },
    { name: 'Yong-San Ko', nameKo: '고용산', affiliation: 'Kyungpook National University Hospital' },
    // The 2026-08-08 programme docx lists Kyungpook here; that is an error in the document.
    { name: 'Subum Lee', nameKo: '이수범', affiliation: 'Korea University Anam Hospital' },
    { name: 'Jae-Koo Lee', nameKo: '이재구', affiliation: 'Seoul National University Bundang Hospital' },
    { name: 'Jun-Su Jang', nameKo: '장준수', affiliation: 'Hallym University Dongtan Sacred Heart Hospital' },
    { name: 'Seung-Chan Yoo', nameKo: '유승찬', affiliation: "Incheon St. Mary's Hospital, The Catholic University of Korea" },
    { name: 'Chan Yang Noh', nameKo: '노찬양', affiliation: 'Hallym University Dongtan Sacred Heart Hospital' },
  ],
} as const satisfies { name: string; nameKo: string; summary: string; members: readonly TeamMember[] };

export function isTeamMember(nameKo: string): boolean {
  return workshopTeam.members.some((member) => member.nameKo === nameKo);
}
