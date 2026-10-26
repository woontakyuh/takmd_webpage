import records from '../../data/publications.json';
import { publicationRoles } from '../../data/publicationAuthorship';
import { orderedPapers } from './collection';
import type { Publication } from './types';

export const RESEARCH_TOPICS = ['UBE', 'AI', 'Tumor', 'Degenerative', 'Other'] as const;
export type ResearchTopic = typeof RESEARCH_TOPICS[number];
export type AuthorFilter = 'first' | 'corresponding' | 'coauthor';
export type ResearchFilters = { topics: ResearchTopic[]; authors: AuthorFilter[] };

export function toggleResearchFilter<T extends string>(selected: readonly T[], value: T): T[] {
  return selected.includes(value) ? selected.filter(item => item !== value) : [...selected, value];
}

// One primary subject per paper keeps the totals additive; mixed-topic papers are classified by their main question.
const SUBJECTS: Record<string, ResearchTopic> = {
  '10.21182/jmisst.2026.03300': 'UBE',
  '10.3340/jkns.2026.0029': 'AI',
  '10.21182/jmisst.2025.02747': 'UBE',
  '10.13004/kjnt.2025.21.e35': 'Other',
  '10.21182/jmisst.2025.02726': 'UBE',
  '10.1038/s41598-024-82902-w': 'AI',
  '10.1038/s41598-024-79610-w': 'AI',
  '10.14245/ns.2448468.234': 'Tumor',
  '10.1371/journal.pone.0305128': 'Degenerative',
  '10.3390/bioengineering11050481': 'AI',
  '10.14245/ns.2347366.683': 'AI',
  '10.1038/s41598-023-50885-9': 'AI',
  '10.3171/2023.10.spine23512': 'Other',
  '10.3390/bioengineering10121363': 'UBE',
  '10.1371/journal.pone.0291114': 'Degenerative',
  '10.1016/j.spinee.2023.07.001': 'Degenerative',
  '10.1007/s00701-023-05707-2': 'Tumor',
  '10.3340/jkns.2022.0204': 'Tumor',
  '10.1038/s41598-023-33588-z': 'Degenerative',
  '10.1038/s41598-022-24784-4': 'Degenerative',
  '10.1227/ons.0000000000000389': 'Tumor',
  '10.1097/ana.0000000000000867': 'Other',
  '10.1038/s41598-022-13881-z': 'Tumor',
  '10.14245/ns.2244038.019': 'Degenerative',
  '10.14245/ns.2244092.046': 'Tumor',
  '10.56718/ijp.22-003': 'Degenerative',
  '10.14444/8163': 'Degenerative',
  '10.2196/20992': 'Other',
  '10.3340/jkns.2017.0405.001': 'Tumor',
  '10.3340/jkns.2016.59.5.512': 'Other',
  '10.14245/kjs.2015.12.3.160': 'Tumor',
};
const SHORT_SUBJECTS: Record<string, string> = {
  '10.21182/jmisst.2026.03300': 'Cervical decompression',
  '10.3340/jkns.2026.0029': 'LLMs & pediatric neurosurgery',
  '10.21182/jmisst.2025.02747': 'C1–2 schwannoma · UBE',
  '10.13004/kjnt.2025.21.e35': 'Spinal cord injury therapy',
  '10.21182/jmisst.2025.02726': 'Neural tissue identification',
  '10.1038/s41598-024-82902-w': 'OVCF · foundation models',
  '10.1038/s41598-024-79610-w': 'OVCF detection · X-ray',
  '10.14245/ns.2448468.234': 'Schwannoma classification',
  '10.1371/journal.pone.0305128': 'Lumbar surgery trends',
  '10.3390/bioengineering11050481': 'Whole-spine landmarks',
  '10.14245/ns.2347366.683': 'Fracture measurements',
  '10.1038/s41598-023-50885-9': 'Lumbar stenosis · CNN',
  '10.3171/2023.10.spine23512': 'ERAS in spine surgery',
  '10.3390/bioengineering10121363': 'Endoscopy technology',
  '10.1371/journal.pone.0291114': 'OLIF positioning',
  '10.1016/j.spinee.2023.07.001': 'C3 laminectomy · RCT',
  '10.1007/s00701-023-05707-2': 'C1–2 schwannoma surgery',
  '10.3340/jkns.2022.0204': 'Metastasis · embolization',
  '10.1038/s41598-023-33588-z': 'Cervical reoperation',
  '10.1038/s41598-022-24784-4': 'Stenosis · cost utility',
  '10.1227/ons.0000000000000389': 'Hemangioblastoma resection',
  '10.1097/ana.0000000000000867': 'Prone-position pressure injury',
  '10.1038/s41598-022-13881-z': 'Spinal tumor MRI',
  '10.14245/ns.2244038.019': 'OPLL genetics',
  '10.14245/ns.2244092.046': 'Spondylectomy failure',
  '10.56718/ijp.22-003': 'Transforaminal discectomy',
  '10.14444/8163': 'Interlaminar discectomy',
  '10.2196/20992': 'COVID-19 contact tracing',
  '10.3340/jkns.2017.0405.001': 'Subependymoma surgery',
  '10.3340/jkns.2016.59.5.512': 'Adult Chiari malformation',
  '10.14245/kjs.2015.12.3.160': 'Spinal oligodendroglioma',
};
const doi = (paper: Publication) => paper.doiUrl.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').toLowerCase();
export const researchTopic = (paper: Publication): ResearchTopic => SUBJECTS[doi(paper)] ?? 'Other';
export const researchSubject = (paper: Publication): string => SHORT_SUBJECTS[doi(paper)] ?? researchTopic(paper);
export function researchRoles(paper: Publication) {
  const record = records.publications.find(item => item.doi.toLowerCase() === doi(paper));
  return record ? publicationRoles(record) : [paper.role];
}
export function filterResearch(papers: readonly Publication[], filters: ResearchFilters) {
  return orderedPapers(papers).filter(paper => {
    const roles = researchRoles(paper);
    const lead = roles.includes('first') || roles.includes('corresponding');
    return (!filters.topics.length || filters.topics.includes(researchTopic(paper)))
      && (!filters.authors.length || filters.authors.some(role => role === 'coauthor' ? !lead && roles.includes('coauthor') : roles.includes(role)));
  });
}
