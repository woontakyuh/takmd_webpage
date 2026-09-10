import { projects, projectById } from './projects';
import { stack, workflowSteps } from './officeDetailData';
import type { ProjectId, Publication } from './types';
import './office-details.css';

type Props = {
  readonly selected: ProjectId | null;
  readonly onSelect: (id: ProjectId | null) => void;
  readonly publications: readonly Publication[];
  readonly onPaper: (id: string) => void;
};

export function ProjectReader({ selected, onSelect, publications, onPaper }: Props) {
  const project = projectById(selected);
  const papers = publications.filter(paper => /deep learning|radiograph|classification|artificial intelligence/i.test(paper.title));
  return <div className="project-reader">
    {project ? <>
      <button className="reader-back" onClick={() => onSelect(null)}>← All projects</button>
      <p className="studio-kicker">{project.eyebrow}</p>
      <h3 className="reader-detail-title">{project.title}</h3>
      <p className="studio-panel-intro">{project.description}</p>
      {project.id === 'workflow' ? <>
        <div className="workflow-steps">{workflowSteps.map((step, index) => <details key={step.title} open={index === 0}>
          <summary><span>{String(index + 1).padStart(2, '0')}</span>{step.title}</summary><p>{step.description}</p>
        </details>)}</div>
        <section className="studio-editorial-note"><span>Stack</span><h3>Tools as quiet infrastructure.</h3><p>Capture, structure, review, link, automate, and surface the record.</p>
          <div className="workflow-steps">{stack.map(item => <details key={item.title}><summary>{item.title}</summary><p>{item.description}</p></details>)}</div>
        </section>
        <section className="studio-editorial-note"><span>Guardrails</span><h3>Clinical constraints.</h3><ul className="office-detail-list">
          <li>No public patient-identifiable data</li><li>Surgeon review before clinical communication</li><li>No autonomous diagnosis or treatment decision</li><li>Structured export only after de-identification and quality checks</li>
        </ul></section>
        <section className="studio-editorial-note"><span>FAQ</span><h3>Practical answers.</h3><div className="workflow-steps">
          <details><summary>No EMR integration?</summary><p>The current workflow is intentionally external and educational, without direct EMR hooks.</p></details>
          <details><summary>Is coding required?</summary><p>Not always. A useful version can start with voice notes, one database, and a few careful review prompts.</p></details>
          <details><summary>Why put this on a branding site?</summary><p>The workflow is part of the professional identity: how clinical care, education, and research stay connected.</p></details>
        </div></section>
        <a className="studio-panel-footer" href="/knowledge/ai-in-spine-surgery">AI integration in spine surgery<span aria-hidden="true">→</span></a>
      </> : <div className="reader-list">
        <p className="studio-kicker">Related publications</p>
        {papers.map(paper => <button className="reader-record-button" key={paper.id} onClick={() => onPaper(paper.id)}><span className="studio-meta">{paper.journal} / {paper.year}</span><strong>{paper.title}</strong><span>Open in the research folio ↗</span></button>)}
      </div>}
      <a className="studio-panel-footer" href="/research">Research archive<span aria-hidden="true">→</span></a>
    </> : <>
      <p className="studio-panel-intro">Open a project on the workstation.</p>
      <div className="reader-list">{projects.map((item, index) => <button className="reader-record-button project-card" onClick={() => onSelect(item.id)} key={item.id}>
        <span className="studio-kicker">{String(index + 1).padStart(2, '0')} / {item.eyebrow}</span><strong>{item.title}</strong><span>{item.summary}</span><span className="reader-row-arrow" aria-hidden="true">↗</span>
      </button>)}</div>
    </>}
  </div>;
}
