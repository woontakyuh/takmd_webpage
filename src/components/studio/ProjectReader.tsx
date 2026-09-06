import { projects, projectById, workflowDetails } from './projects';
import type { ProjectId, Publication } from './types';

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
      {project.id === 'workflow' ? <div className="workflow-steps">{project.steps.map((step, index) => <details key={step} open={index === 0}>
        <summary><span>{String(index + 1).padStart(2, '0')}</span>{step}</summary><p>{workflowDetails[index]}</p>
      </details>)}</div> : <div className="reader-list">
        <p className="studio-kicker">Related publications</p>
        {papers.map(paper => <button className="reader-record-button" key={paper.id} onClick={() => onPaper(paper.id)}><span className="studio-meta">{paper.journal} / {paper.year}</span><strong>{paper.title}</strong><span>Open in the research folio ↗</span></button>)}
      </div>}
      <a className="studio-panel-footer" href={project.href}>{project.linkLabel}<span>↗</span></a>
    </> : <>
      <p className="studio-panel-intro">Open a project on the workstation.</p>
      <div className="reader-list">{projects.map((item, index) => <button className="reader-record-button project-card" onClick={() => onSelect(item.id)} key={item.id}>
        <span className="studio-kicker">{String(index + 1).padStart(2, '0')} / {item.eyebrow}</span><strong>{item.title}</strong><span>{item.summary}</span><span className="reader-row-arrow" aria-hidden="true">↗</span>
      </button>)}</div>
    </>}
  </div>;
}
