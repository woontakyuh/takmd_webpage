import { useState } from 'react';
import { aiProjects, hasAiSignal } from '../../data/ai-projects';
import { ProjectReader } from './ProjectReader';
import type { Presentation, Publication } from './types';

type Props = {
  readonly publications: readonly Publication[];
  readonly presentations: readonly Presentation[];
  readonly onPaper: (id: string) => void;
  readonly onTalk: (id: string) => void;
};

export function AiReader({ publications, presentations, onPaper, onTalk }: Props) {
  const [selected, setSelected] = useState<'workflow' | 'imaging' | 'spinoscopy' | null>(null);
  const talks = presentations.filter(talk => hasAiSignal(`${talk.title} ${talk.topic}`));
  const papers = publications.filter(paper => hasAiSignal(paper.title));
  if (selected === 'workflow' || selected === 'imaging') return <ProjectReader selected={selected} onSelect={setSelected} publications={publications} onPaper={onPaper} />;
  if (selected === 'spinoscopy') return <div className="ai-reader">
    <button className="reader-back" type="button" onClick={() => setSelected(null)}>← All AI work</button>
    <p className="studio-kicker">Clinical AI side project</p><h3 className="reader-detail-title">K-Spinoscopy dashboard</h3>
    <p className="studio-panel-intro">A real dashboard project for the K-Spinoscopy work.</p>
    <section className="studio-editorial-note"><span>Project note</span><h3>In development.</h3><p>This project is listed as active work. A public project note is being prepared.</p></section>
    <a className="studio-panel-footer" href="/ai-workflow">AI workflow study<span aria-hidden="true">→</span></a>
  </div>;

  return <div className="ai-reader">
    <p className="studio-panel-intro">Projects, lectures, and research exploring AI in practice.</p>
    <div className="office-detail-metrics"><div><strong>{talks.length}</strong><span>AI-related talks</span></div><div><strong>{papers.length}</strong><span>AI-related papers</span></div><div><strong>{aiProjects.length}</strong><span>Documented side projects</span></div></div>

    <section className="studio-editorial-note" aria-labelledby="ai-projects-heading">
      <span>Side projects</span>
      <h3 id="ai-projects-heading">Projects.</h3>
      <div className="reader-list">{aiProjects.map(project => <button className="reader-record-button" type="button" onClick={() => setSelected(project.id === 'workflow' ? 'workflow' : 'spinoscopy')} key={project.href}>
        <span className="studio-kicker">{project.eyebrow}</span>
        <strong>{project.title}</strong>
        <span>{project.description}</span>
        <span className="reader-row-arrow" aria-hidden="true">↗</span>
      </button>)}</div>
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
