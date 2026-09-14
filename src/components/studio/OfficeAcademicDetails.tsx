import presentationsData from '../../data/presentations.json';
import publicationsData from '../../data/publications.json';
import { countPublicationRoles } from '../../data/publicationAuthorship';
import { programs, researchLanes } from './officeDetailData';
import { ResearchProfile } from './ResearchProfile';
import type { Publication } from './types';

export function EducationDetails({ onTalk }: { readonly onTalk: (id: string) => void }) {
  const teaching = presentationsData.presentations.filter(talk => /workshop|cadaver|education|training|instructor|course/i.test(`${talk.name} ${talk.topics.join(' ')}`)).slice(0, 6);
  const metrics = [['80+', 'Surgeons trained'], ['15+', 'Countries represented'], ['2024', 'International center launch'], [presentationsData.count, 'Talks and sessions']] as const;
  return <>
    <h3 className="reader-detail-title">Teaching endoscopy as a reproducible language.</h3>
    <p className="studio-panel-intro">Workshops, live observation, and international training form a coherent teaching system.</p>
    <div className="office-detail-metrics">{metrics.map(([value, label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div>
    <section className="studio-editorial-note"><span>Method</span><h3>Training philosophy.</h3><p>The goal is safe independent adoption: clear anatomical anchors, progressive complexity, direct feedback, and outcome-aware practice.</p></section>
    {programs.map(program => <section className="studio-editorial-note" key={program.title}><span>{program.tags.join(' / ')}</span><h3>{program.title}</h3><p>{program.description}</p></section>)}
    <section className="studio-editorial-note"><span>Teaching record</span><h3>Recent teaching-related entries.</h3><div className="reader-list">{teaching.map(talk => <button className="reader-record-button" type="button" key={talk.id} onClick={() => onTalk(talk.id)}><span className="studio-kicker">{talk.date} · {talk.place || 'Location TBA'}</span><strong>{talk.name}</strong><span>{talk.topics[0]}</span><span>{talk.societies.join(' · ')}</span></button>)}</div></section>
    <nav className="office-detail-links" aria-label="Education collections"><a href="/education">All talks →</a><a href="/workshops/dummy">Dummy workshop →</a><a href="/workshops/cadaver">Cadaver workshop →</a><a href="/workshops/animal-pig">Animal workshop →</a><a href="/cv">Full CV →</a></nav>
  </>;
}

export function ResearchDetails({ publications, onPaper }: { readonly publications: readonly Publication[]; readonly onPaper: (id: string) => void }) {
  const roles = countPublicationRoles(publicationsData.publications);
  return <>
    <p className="studio-panel-intro">Research in UBE, outcomes, spinal tumor care, and practical AI in spine surgery, with published papers and academic profiles to explore.</p>
    <ResearchProfile />
    <p className="office-detail-source">This site’s publication archive: {publications.length} papers · {roles.first} first-author · {roles.corresponding} corresponding-author. Authorship roles may overlap. Updated {publicationsData.generatedAt.slice(0, 10)}.</p>
    <section className="studio-editorial-note"><span>Themes</span><h3>Research lanes.</h3><p>Surgical technique, education, outcomes, tumor care, and computational work.</p></section>
    {researchLanes.map(lane => <section className="studio-editorial-note" key={lane.title}><span>{lane.tags.join(' / ')}</span><h3>{lane.title}</h3><p>{lane.description}</p></section>)}
    <section className="studio-editorial-note"><span>Publication record</span><h3>Recent papers.</h3><div className="reader-list">{publications.slice(0, 8).map(paper => <button className="reader-record-button" type="button" key={paper.id} onClick={() => onPaper(paper.id)}><span className="studio-kicker">{paper.year} · {paper.journal}</span><strong>{paper.title}</strong><span>{paper.role} · Read in the research folio</span></button>)}</div></section>
    <nav className="office-detail-links" aria-label="Research collections"><a href="/research">All publications →</a><a href="/cv">Full CV →</a></nav>
  </>;
}
