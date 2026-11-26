import { describe, expect, test } from 'bun:test';
import data from '../src/data/publications.json';
import { filterResearch, researchRoles, researchTopics, toggleResearchFilter, RESEARCH_TOPICS } from '../src/components/studio/researchIndex';
const papers = data.publications.map(paper => ({ ...paper, id: paper.doiUrl }));
const all = { topics: [], authors: [] };
describe('research multi-select and page sequence', () => {
  test('first and corresponding selections form a union, including joint first authors exactly once', () => {
    const first = filterResearch(papers, { ...all, authors: ['first'] });
    const corresponding = filterResearch(papers, { ...all, authors: ['corresponding'] });
    const lead = filterResearch(papers, { ...all, authors: ['first', 'corresponding'] });
    const co = filterResearch(papers, { ...all, authors: ['coauthor'] });
    expect(first).toHaveLength(15);
    expect(corresponding).toHaveLength(3);
    expect(lead).toHaveLength(17);
    expect(new Set(lead.map(paper => paper.id))).toEqual(new Set([...first, ...corresponding].map(paper => paper.id)));
    expect(lead.length + co.length).toBe(papers.length);
    expect(researchRoles(papers.find(paper => paper.doiUrl.includes('jkns.2026.0029')))).toEqual(['first', 'corresponding']);
    expect(filterResearch(papers, { ...all, authors: ['first', 'corresponding', 'coauthor'] })).toEqual(filterResearch(papers, all));
  });
  test('multiple topics are combined, then intersected with selected authors in date order', () => {
    const selected = filterResearch(papers, { topics: ['AI', 'UBE'], authors: ['first', 'corresponding'] });
    const union = [...filterResearch(papers, { topics: ['AI'], authors: ['first', 'corresponding'] }), ...filterResearch(papers, { topics: ['UBE'], authors: ['first', 'corresponding'] })];
    expect(new Set(selected.map(paper => paper.id))).toEqual(new Set(union.map(paper => paper.id)));
    expect(selected.every(paper => researchTopics(paper).some(topic => ['AI', 'UBE'].includes(topic)))).toBe(true);
    expect(selected.map(paper => paper.date)).toEqual(selected.map(paper => paper.date).toSorted().reverse());
    expect(RESEARCH_TOPICS.reduce((sum, topic) => sum + filterResearch(papers, { ...all, topics: [topic] }).length, 0)).toBe(papers.length + 1);
    expect(filterResearch(papers, { topics: ['AI'], authors: ['coauthor'] })).toHaveLength(4);
  });
  test('C1–2 ED schwannoma appears under UBE and Tumor without doubling a combined count', () => {
    const doi = 'jmisst.2025.02747';
    const paper = papers.find(item => item.doiUrl.includes(doi));
    expect(researchTopics(paper)).toEqual(['UBE', 'Tumor']);
    const ube = filterResearch(papers, { ...all, topics: ['UBE'] });
    const tumor = filterResearch(papers, { ...all, topics: ['Tumor'] });
    const both = filterResearch(papers, { ...all, topics: ['UBE', 'Tumor'] });
    expect(ube.some(item => item.doiUrl.includes(doi))).toBe(true);
    expect(tumor.some(item => item.doiUrl.includes(doi))).toBe(true);
    expect(both.filter(item => item.doiUrl.includes(doi))).toHaveLength(1);
    expect(both).toHaveLength(ube.length + tumor.length - 1);
  });
  test('toggling retains other selections and removing the last restores All', () => {
    const combined = toggleResearchFilter(['AI'], 'UBE');
    expect(combined).toEqual(['AI', 'UBE']);
    expect(toggleResearchFilter(combined, 'AI')).toEqual(['UBE']);
    expect(toggleResearchFilter(['UBE'], 'UBE')).toEqual([]);
    expect(filterResearch(papers, { ...all, topics: toggleResearchFilter(['UBE'], 'UBE') })).toHaveLength(papers.length);
  });
});
