import { aiProjects, hasAiSignal } from '../../data/ai-projects';
import type { Presentation, Publication } from './types';

type Props = {
  readonly publications: readonly Publication[];
  readonly presentations: readonly Presentation[];
  readonly onPaper: (id: string) => void;
  readonly onTalk: (id: string) => void;
};

export function AiReader({ publications, presentations, onPaper, onTalk }: Props) {
  const talks = presentations.filter(talk => hasAiSignal(`${talk.title} ${talk.topic}`));
  const papers = publications.filter(paper => hasAiSignal(paper.title));

  return <div className="ai-reader">
    <p className="studio-panel-intro">Projects, lectures, and research exploring AI in practice.</p>

    <section className="studio-editorial-note" aria-labelledby="ai-projects-heading">
      <span>Side projects</span>
      <h3 id="ai-projects-heading">Projects.</h3>
      <div className="reader-list">{aiProjects.map(project => <a className="reader-record-button" href={project.href} key={project.href}>
        <span className="studio-kicker">{project.eyebrow}</span>
        <strong>{project.title}</strong>
        <span>{project.description}</span>
        <span className="reader-row-arrow" aria-hidden="true">↗</span>
      </a>)}</div>
    </section>

    <section className="studio-editorial-note" aria-labelledby="ai-talks-heading">
      <span>Teaching record</span>
      <h3 id="ai-talks-heading">AI-related talks.</h3>
      <div className="reader-list">{talks.map(talk => <button className="reader-record-button" key={talk.id} onClick={() => onTalk(talk.id)}>
        <span className="studio-meta">{talk.date}{talk.venue ? ` · ${talk.venue}` : ''}</span>
        <strong>{talk.topic || talk.title}</strong>
        <span>{talk.title} · Open in the talk reader ↗</span>
      </button>)}</div>
      {talks.length === 0 && <div className="studio-empty"><p>No AI-related presentations are available in this collection yet.</p></div>}
    </section>

    <section className="studio-editorial-note" aria-labelledby="ai-papers-heading">
      <span>Publication record</span>
      <h3 id="ai-papers-heading">AI-related papers.</h3>
      <div className="reader-list">{papers.map(paper => <button className="reader-record-button" key={paper.id} onClick={() => onPaper(paper.id)}>
        <span className="studio-meta">{paper.journal} / {paper.year}</span>
        <strong>{paper.title}</strong>
        <span>Open in the research folio ↗</span>
      </button>)}</div>
      {papers.length === 0 && <div className="studio-empty"><p>No AI-related papers are available in this collection yet.</p></div>}
    </section>
  </div>;
}
