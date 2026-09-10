import type { ReactNode } from 'react';
import surgerySummary from '../../data/public-surgery-summary.json';
import { getWorkshop, workshops } from '../../data/workshops';
import { contactCards, models, principles } from './officeDetailData';
import type { NoteBlock, OfficeNote } from './officeNotes';

function SourceLink({ href, children }: { readonly href: string; readonly children: ReactNode }) {
  return <a href={href} target="_blank" rel="noreferrer">{children} ↗</a>;
}

export function ContactDetails() {
  return <>
    <p className="studio-panel-intro">For education, research, clinical AI workflow, lectures, and professional collaboration, email is the first route.</p>
    <div className="reader-list">{contactCards.map(card => <a className="reader-record-button" key={card.label} href={card.href} target={card.href.startsWith('http') ? '_blank' : undefined} rel={card.href.startsWith('http') ? 'noreferrer' : undefined}>
      <span className="studio-kicker">{card.label}</span><strong>{card.value}</strong><span>{card.description}</span>
    </a>)}</div>
  </>;
}

export function WorkshopDetails({ slug }: { readonly slug: string }) {
  const workshop = getWorkshop(slug);
  return <>
    {workshop && <>
      <p className="studio-kicker">Workshop corner / {workshop.objectLabel}</p>
      <h3 className="reader-detail-title">{workshop.title}</h3>
      <p className="studio-panel-intro">{workshop.description}</p>
      <section className="studio-editorial-note"><span>Current status</span><h3>자료 준비 중</h3><p>Workshop photos and teaching materials will be added here.</p></section>
      <section className="studio-editorial-note"><span>Workshop focus</span><h3>Training topics.</h3><ul className="office-detail-list">{workshop.focus.map(item => <li key={item}>{item}</li>)}</ul></section>
    </>}
    <nav className="reader-list" aria-label="Workshop index">{workshops.filter(item => item.slug !== slug).map(item => <a className="reader-record-button" href={`/workshops/${item.slug}`} key={item.slug}><span className="studio-kicker">{item.objectLabel}</span><strong>{item.title}</strong><span>{item.description}</span></a>)}</nav>
    <a className="studio-panel-footer" href="/education">Education and teaching<span aria-hidden="true">→</span></a>
  </>;
}

export function ClinicalDetails() {
  const metrics = [
    ['Registry cases', surgerySummary.totalCases],
    ['UBE-coded cases', surgerySummary.categoryCounts.UBE],
    ['Full-endoscopic cases', surgerySummary.categoryCounts['Full-endo']],
    ['ULBD cases', surgerySummary.categoryCounts.ULBD],
  ] as const;
  return <>
    <p className="studio-panel-intro">UBE is presented here as a technical philosophy: minimal tissue disruption, clear visualization, stable landmarks, and outcomes that can be tracked.</p>
    <h3 className="reader-detail-title">Endoscopic spine surgery as disciplined visibility.</h3>
    <div className="office-detail-metrics">{metrics.map(([label, value]) => <div key={label}><strong>{value.toLocaleString()}</strong><span>{label}</span></div>)}</div>
    <p className="office-detail-source">Published registry summary · Aggregated counts</p>
    <section className="studio-editorial-note"><span>Principles</span><h3>How I frame UBE.</h3>
      <div className="workflow-steps">{principles.map(principle => <details key={principle.title} open><summary>{principle.title}</summary><p>{principle.description}</p></details>)}</div>
    </section>
    <section className="studio-editorial-note"><span>Learning frame</span><h3>Common pitfalls.</h3><ul className="office-detail-list">
      <li>Portal misalignment and unstable instrument trajectory</li>
      <li>Contralateral decompression that appears adequate from the ipsilateral view but remains insufficient</li>
      <li>Bleeding strategy that is delayed until visualization is already poor</li>
      <li>Escalating from focal decompression to broader bilateral goals without resetting landmarks</li>
    </ul></section>
    <div className="office-detail-links"><a href="/education">Training and lectures →</a><a href="/knowledge/what-is-ube">What is UBE? →</a><a href="/research">Research archive →</a></div>
  </>;
}

export function CreditsDetails() {
  return <>
    <p className="studio-panel-intro">The office brings together original work and furniture models by these artists.</p>
    {models.map(model => <section className="studio-editorial-note" key={model.title}>
      <span>Furniture and objects</span><h3>{model.title}</h3><p>{model.note}</p>
      <div className="office-detail-links"><SourceLink href={model.source}>{model.author}</SourceLink><SourceLink href={model.license}>{model.licenseLabel}</SourceLink></div>
    </section>)}
    <section className="studio-editorial-note"><span>Original adaptations</span><h3>Office objects.</h3>
      <p>The Florence Knoll Relaxed two-seater and Logitech MX Master 4 are original visual models made from reference photographs. They are not official manufacturer CAD models.</p>
      <p>The Beosound Theatre uses Bang &amp; Olufsen’s published 3D planning geometry, adapted with natural-oak and silver materials for tabletop placement.</p>
      <div className="office-detail-links"><SourceLink href="/models/beosound-theatre/PROVENANCE.md">Source and adaptation details</SourceLink></div>
      <p>The whisky collection uses bottle geometry traced from product silhouettes, with surface and label references from product photographs.</p>
      <div className="office-detail-links"><SourceLink href="/models/whisky/SOURCE.md">Product references and image sources</SourceLink></div>
    </section>
    <section className="studio-editorial-note"><span>Beyond the window</span><h3>Banpo Han River outlook.</h3>
      <p>The river, Banpo Bridge, Sebitseom and distant skyline form an editable 3D interpretation of the Han River. Water reflections and the changing daylight are rendered in the scene. This is a visual interpretation, not an exact survey of a particular residence’s view.</p>
      <p>Earlier composition references are retained for the fallback landscape. Reference photographs guide the composition; they are not used as the window background.</p>
      <div className="office-detail-links"><SourceLink href="https://yakei.jp/en/spot.php?i=63build">Masato Nawate’s view from 63 Building</SourceLink><SourceLink href="https://data.si.re.kr/photo/03u88061ba3si0">Seoul Institute’s Han River photograph</SourceLink></div>
      <p>Atmosphere and water use Three.js Sky and adapted Water shading, including its water-normal texture, under the MIT license. The fallback shore uses Rob Tuytel’s Grass Path 2 material from Poly Haven under CC0.</p>
      <div className="office-detail-links"><SourceLink href="https://github.com/mrdoob/three.js">Three.js</SourceLink><SourceLink href="/textures/river-LICENSE.txt">MIT license</SourceLink><SourceLink href="https://polyhaven.com/a/grass_path_2">Grass Path 2</SourceLink></div>
      <h3>Geography and adaptations.</h3><p>The Banpo scene uses geographic outlines © OpenStreetMap contributors, shared under ODbL, and Mapzen terrain tiles with SRTM elevation data courtesy of the USGS. Building heights without source measurements and architectural details are visual estimates.</p>
      <div className="office-detail-links"><SourceLink href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</SourceLink><SourceLink href="/models/han-river/SOURCE.md">Sources, adaptations and downloadable geometry data</SourceLink></div>
    </section>
  </>;
}

function NoteContent({ block }: { readonly block: NoteBlock }) {
  switch (block.kind) {
    case 'heading': return <h3>{block.text}</h3>;
    case 'paragraph': return <p>{block.text}</p>;
    case 'list': return block.ordered ? <ol className="office-detail-list">{block.items.map(item => <li key={item}>{item}</li>)}</ol> : <ul className="office-detail-list">{block.items.map(item => <li key={item}>{item}</li>)}</ul>;
    default: { const exhaustive: never = block; return exhaustive; }
  }
}

export function NoteCollection({ entries, basePath, selectedId }: { readonly entries: readonly OfficeNote[]; readonly basePath: string; readonly selectedId: string }) {
  const selected = entries.find(entry => entry.id === selectedId);
  return selected ? <>
    <a className="reader-back" href={basePath}>← {basePath === '/media' ? 'Media archive' : 'Knowledge base'}</a>
    <p className="studio-kicker">{selected.mediaType ?? 'Knowledge note'} · {selected.date}</p>
    <h3 className="reader-detail-title">{selected.title}</h3><p className="studio-panel-intro">{selected.description}</p>
    <p className="office-detail-source">{selected.tags.join(' · ')}</p>
    <section className="studio-editorial-note">{selected.blocks.map((block, index) => <NoteContent block={block} key={index} />)}</section>
    {selected.url && <div className="office-detail-links"><SourceLink href={selected.url}>{new URL(selected.url).hostname.replace(/^www\./, '')}</SourceLink></div>}
    <nav className="reader-list" aria-label="Related notes">{entries.filter(entry => entry.id !== selected.id).map(entry => <a className="reader-record-button" key={entry.id} href={`${basePath}/${entry.id}`}><span className="studio-kicker">{entry.date}</span><strong>{entry.title}</strong><span>{entry.description}</span></a>)}</nav>
  </> : <>
    <p className="studio-panel-intro">{basePath === '/media' ? 'Talks, workshops, and visible field notes: lectures, workshop documentation, video notes, and selected professional appearances.' : 'Short notes on surgical concepts, outcome metrics, AI workflow, and teaching language that can be revisited.'}</p>
    <div className="reader-list">{entries.map(entry => <a className="reader-record-button" key={entry.id} href={`${basePath}/${entry.id}`}><span className="studio-kicker">{entry.date} · {entry.mediaType ?? entry.tags.join(' / ')}</span><strong>{entry.title}</strong><span>{entry.description}</span></a>)}</div>
  </>;
}
