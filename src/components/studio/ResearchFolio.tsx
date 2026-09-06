import { useState } from 'react';
import { FEATURED_DOI, FOLIO_ASSETS, mediaForPaper, orderedPapers } from './collection';
import type { PaperMedia, Publication } from './types';

type Props = {
  readonly publications: readonly Publication[];
  readonly updatedAt: string;
  readonly publication: Publication | null;
  readonly media: PaperMedia | null;
  readonly direction: 1 | -1;
  readonly onPaper: (id: string) => void;
};
const authorRole = (role: string) => role === 'first' ? 'First author' : role === 'corresponding' ? 'Corresponding author' : 'Coauthor';

export function ResearchFolio({ publications, updatedAt, publication, media, direction, onPaper }: Props) {
  const [archive, setArchive] = useState(false);
  const [query, setQuery] = useState('');
  const [year, setYear] = useState('all');
  const [figure, setFigure] = useState(false);
  const papers = orderedPapers(publications);
  const index = papers.findIndex(paper => paper.id === publication?.id);
  const years = [...new Set(publications.map(paper => paper.year))].sort((a, b) => b - a);
  const filtered = papers.filter(paper => (year === 'all' || String(paper.year) === year) && `${paper.title} ${paper.journal}`.toLowerCase().includes(query.toLowerCase()));
  const showFigure = figure && publication?.doiUrl.endsWith(FEATURED_DOI);
  const selectPaper = (paper: Publication | undefined) => { if (paper) { setArchive(false); setFigure(false); onPaper(paper.id); } };

  return <div className="research-folio" data-active-paper={publication?.id} data-direction={direction}>
    <nav className="folio-navigation" aria-label="Research views">
      <button aria-pressed={!archive} onClick={() => setArchive(false)}>On the desk <span>{String(index + 1).padStart(2, '0')}</span></button>
      <button aria-pressed={archive} onClick={() => setArchive(true)}>All publications <span>{publications.length}</span></button>
    </nav>
    {!archive && publication ? <>
      <div className="folio-paging"><span role="status">{String(index + 1).padStart(2, '0')} / {papers.length} · Research folio</span><div>
        <button aria-label="Previous paper" disabled={index <= 0} onClick={() => selectPaper(papers[index - 1])}>←</button>
        <button aria-label="Next paper" disabled={index === papers.length - 1} onClick={() => selectPaper(papers[index + 1])}>→</button>
      </div></div>
      <article className="folio-spread" key={publication.id} data-direction={direction}>
        <div className="folio-context"><p className="studio-kicker">{publication.journal} / {publication.year}</p><h3>{publication.title}</h3>
          <p className="folio-byline">Woon Tak Yuh · {authorRole(publication.role)}</p>
          {publication.doiUrl.endsWith(FEATURED_DOI) && <button className="folio-turn-link" onClick={() => setFigure(value => !value)}>{showFigure ? 'Return to the first page' : 'Look inside: camera systems'} <span aria-hidden="true">↗</span></button>}
          <details className="paper-detail"><summary>Publication details</summary><dl><dt>Journal</dt><dd>{publication.journal}</dd><dt>Year</dt><dd>{publication.year}</dd><dt>Contribution</dt><dd>{authorRole(publication.role)}</dd></dl>{publication.doiUrl && <a className="studio-text-link" href={publication.doiUrl} target="_blank" rel="noreferrer">Read the full paper ↗</a>}</details>
          {media && <p className="folio-source">{showFigure ? 'Yuh et al. · Original Figure 2 · CC BY 4.0' : `${media.credit} · ${media.license}`}<br /><a href={media.sourceUrl} target="_blank" rel="noreferrer">View the source document ↗</a></p>}
        </div>
        {media ? <figure className="folio-document" data-figure={showFigure} data-direction={direction}><a href={showFigure ? FOLIO_ASSETS.figure : media.pageImage} target="_blank" rel="noreferrer" aria-label="Open paper preview image"><img src={showFigure ? FOLIO_ASSETS.figure : media.pageImage} alt={showFigure ? 'Published Figure 2: single-chip and three-chip camera sensor systems.' : `First page of ${publication.title}`} /></a><figcaption>{showFigure ? 'Inside the paper / Camera systems' : 'From the published paper / First page'}</figcaption></figure> : <div className="reader-record"><span className="studio-kicker">Publication record</span><p>A first-page preview is not available for this paper.</p>{publication.doiUrl && <a className="studio-text-link" href={publication.doiUrl} target="_blank" rel="noreferrer">Open the original paper ↗</a>}</div>}
      </article>
      <p className="folio-snapshot">Publication record from Notion · {updatedAt}</p>
    </> : <>
      <div className="studio-filters"><label><span className="studio-sr-only">Search publications</span><input type="search" placeholder="Search the folio…" value={query} onChange={event => setQuery(event.target.value)} /></label><label><span className="studio-sr-only">Publication year</span><select value={year} onChange={event => setYear(event.target.value)}><option value="all">All years</option>{years.map(value => <option key={value}>{value}</option>)}</select></label></div>
      <p className="studio-meta" role="status">{filtered.length} papers in this archive · Updated {updatedAt}</p>
      <div className="studio-publications">{filtered.map(paper => <button className="reader-record-button" key={paper.id} onClick={() => selectPaper(paper)}><span className="studio-paper-meta"><span>{paper.journal} / {paper.year}</span><span>{mediaForPaper(paper) ? 'First page' : 'Details'}</span></span><strong>{paper.title}</strong><span>{authorRole(paper.role)} · Open in the folio ↗</span></button>)}</div>
      {filtered.length === 0 && <div className="studio-empty"><p>No papers match that search.</p><button className="studio-text-link" onClick={() => { setQuery(''); setYear('all'); }}>Clear filters ↗</button></div>}
      <a className="studio-panel-footer" href="/research">Explore the research archive <span>↗</span></a>
    </>}
  </div>;
}
