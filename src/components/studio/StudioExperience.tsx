import { Component, Suspense, lazy, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ReadingPanel } from './ReadingPanel';
import { OfficeIcon } from './OfficeIcon';
import type { ExhibitId, ProjectId, StudioContent } from './types';
import { mediaForPaper, orderedPapers, talkMedia } from './collection';
import { useOfficeLight, LocalClockReadout } from './OfficeTime';
import type { LightMode } from './localTime';

const Scene = lazy(async () => {
  const module = await import('./StudioScene');
  return { default: module.StudioScene };
});
const exhibits: readonly { readonly id: ExhibitId; readonly label: string; readonly compactLabel: string; readonly detail: string }[] = [
  { id: 'spine', label: 'The spine', compactLabel: 'Practice', detail: 'Clinical practice' },
  { id: 'research', label: 'On the desk', compactLabel: 'Papers', detail: 'Papers & ideas' },
  { id: 'education', label: 'Talks', compactLabel: 'Talks', detail: 'Teaching & conferences' },
  { id: 'ai', label: 'The workstation', compactLabel: 'AI', detail: 'Clinical AI' },
  { id: 'bjj', label: 'On the mat', compactLabel: 'Jiu-jitsu', detail: 'Jiu-jitsu' },
  { id: 'surfing', label: 'By the sea', compactLabel: 'Surfing', detail: 'Surfing' },
];
class SceneBoundary extends Component<{ readonly children: ReactNode }, { readonly failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <div className="studio-scene-error"><p>The office could not load.</p><p>The collection and all reading links are still available below.</p></div> : this.props.children; }
}

export function StudioExperience(content: StudioContent) {
  const progress = useRef(0);
  const returnFocus = useRef<HTMLElement | null>(null);
  const [selected, setSelected] = useState<ExhibitId | null>(null);
  const [viewCommand, setViewCommand] = useState<{ readonly sequence: number; readonly view: 0 | 1 | 2 }>({ sequence: 0, view: 0 });
  const [lightMode, setLightMode] = useState<LightMode>('local');
  const lighting = useOfficeLight(lightMode);
  const night = (lighting?.sun.daylight ?? 1) < 0.35;
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [compact, setCompact] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [paperId, setPaperId] = useState(() => orderedPapers(content.publications)[0]?.id ?? null);
  const [paperTurn, setPaperTurn] = useState(0);
  const [paperDirection, setPaperDirection] = useState<1 | -1>(1);
  const [talkId, setTalkId] = useState<string | null>(null);
  const [talkSlideIndex, setTalkSlideIndex] = useState(0);
  const [project, setProject] = useState<ProjectId | null>(null);
  const publication = content.publications.find(paper => paper.id === paperId) ?? null;
  const presentation = content.presentations.find(talk => talk.id === talkId) ?? null;
  const slides = talkMedia.find(media => media.id === talkId)?.slides ?? [];
  const collection = { publication, paperMedia: mediaForPaper(publication), paperTurn, paperDirection, presentation, talkSlide: slides[talkSlideIndex] ?? null, project };
  const selectPaper = (id: string) => {
    const papers = orderedPapers(content.publications);
    setPaperDirection(papers.findIndex(paper => paper.id === id) >= papers.findIndex(paper => paper.id === paperId) ? 1 : -1);
    setPaperId(id); setPaperTurn(turn => turn + 1); setSelected('research');
  };
  const selectTalk = (id: string | null) => { setTalkId(id); setTalkSlideIndex(0); };

  useEffect(() => {
    const mobile = window.matchMedia('(max-width: 759px)');
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => { setCompact(mobile.matches); setReducedMotion(motion.matches); };
    sync();
    setMounted(true);
    mobile.addEventListener('change', sync);
    motion.addEventListener('change', sync);
    return () => { mobile.removeEventListener('change', sync); motion.removeEventListener('change', sync); };
  }, []);

  const open = useCallback((id: ExhibitId) => {
    const active = document.activeElement;
    returnFocus.current = active instanceof HTMLElement && active.closest('button, a') ? active : document.getElementById(`studio-exhibit-${id}`);
    setSelected(id);
  }, []);
  const close = useCallback(() => {
    setSelected(null);
    requestAnimationFrame(() => returnFocus.current?.focus({ preventScroll: true }));
  }, []);
  const onReady = useCallback(() => setReady(true), []);
  const goToView = (view: 0 | 1 | 2) => {
    setSelected(null);
    progress.current = view / 2;
    setViewCommand(previous => ({ sequence: previous.sequence + 1, view }));
  };

  return <div className="studio" data-night={night} data-selected={selected}>
    <section className="studio-stage" aria-label="TakMD's office">
      <div className="studio-scene" aria-label="Explore the office" aria-describedby="office-help" tabIndex={0}>
        <SceneBoundary>{mounted && lighting && <Suspense fallback={<div className="studio-loading" role="status">Opening the office…</div>}>
          <Scene progress={progress} selected={selected} night={night} lighting={lighting} reducedMotion={reducedMotion} compact={compact} collection={collection} viewCommand={viewCommand} presentations={content.presentations} onSelect={open} onReady={onReady} />
        </Suspense>}</SceneBoundary>
      </div>
      <header className="studio-header">
        <a className="studio-brand" href="/" aria-label="TakMD home"><span className="studio-brand-mark" aria-hidden="true">t.</span><div><h1>Woon Tak Yuh<span>, MD.</span></h1><span className="studio-brand-caption">Endoscopic spine surgery · Research · Teaching</span></div></a>
        <nav aria-label="Office navigation"><a href="/cv">Living CV</a><a href="/contact">Contact <span aria-hidden="true">↗</span></a></nav>
      </header>
      <div className="studio-tools">
        <button onClick={() => goToView(0)} aria-label="Return to the overview"><OfficeIcon name="overview" /><span>Overview</span></button>
        <button onClick={() => setLightMode(value => value === 'local' ? 'day' : value === 'day' ? 'evening' : 'local')}
          aria-label={lightMode === 'local' ? 'Local light · Preview daylight' : lightMode === 'day' ? 'Daylight preview · Preview evening' : 'Evening preview · Return to local light'}
          title="Light follows your time zone’s approximate sun position. Click to preview other lighting.">
          <OfficeIcon name={lightMode === 'local' ? 'clock' : lightMode === 'day' ? 'sun' : 'moon'} /><span>{lightMode === 'local' ? 'Local light' : lightMode === 'day' ? 'Daylight preview' : 'Evening preview'}</span>
        </button>
        <LocalClockReadout />
      </div>
      <div className="office-title"><p className="studio-kicker">TAKMD / A PLACE TO THINK</p><h2>The office.</h2></div>
      <div className="office-guided" aria-label="Guided views"><span>A closer look</span><button onClick={() => goToView(1)}>The practice</button><button onClick={() => goToView(2)}>The desk</button></div>
      <footer className="studio-stage-footer">
        <p id="office-help" className="office-help">{ready ? compact ? 'Drag to explore · Pinch to zoom · Tap an object' : 'Drag to explore · Scroll to zoom · Click an object' : 'The office is opening…'}<span className="studio-sr-only">Focus the scene and use arrow keys to rotate; plus and minus to zoom.</span></p>
        <nav className="studio-exhibits" aria-label="Office collection">{exhibits.map(item => <button id={`studio-exhibit-${item.id}`} key={item.id} aria-label={`${item.label} ${item.detail}`} aria-pressed={selected === item.id} onClick={() => open(item.id)}><OfficeIcon name={item.id} /><span><span className="exhibit-full-label">{item.label}</span><span className="exhibit-compact-label">{item.compactLabel}</span><small>{item.detail}</small></span></button>)}</nav>
        <a className="office-index" href="#office-reading">Browse the work <span aria-hidden="true">↓</span></a>
      </footer>
    </section>
    <section id="office-reading" className="studio-notes" aria-labelledby="studio-notes-heading">
      <div className="studio-notes-heading"><p className="studio-kicker">From the desk</p><h2 id="studio-notes-heading">Practice shapes<br /><em>the questions.</em></h2><a className="studio-text-link" href="/research">Research archive ↗</a></div>
      <div className="studio-notes-list">{content.publications.slice(0, 3).map(p => <a key={`${p.doiUrl}-${p.title}`} href={p.doiUrl || '/research'} target={p.doiUrl ? '_blank' : undefined} rel={p.doiUrl ? 'noreferrer' : undefined}><span className="studio-meta">{p.journal} / {p.year}</span><h3>{p.title}</h3><span className="studio-notes-arrow" aria-hidden="true">↗</span></a>)}</div>
    </section>
    <footer className="studio-end"><span>Woon Tak Yuh, MD.</span><nav aria-label="Browse all work"><a href="/cv">Living CV</a><a href="/research">Research</a><a href="/education">Education</a><a href="/jiu-jitsu">Jiu-jitsu</a><a href="/surfing">Surfing</a><a href="/contact">Contact ↗</a></nav></footer>
    <ReadingPanel {...content} selected={selected} collection={collection} onPaper={selectPaper} onTalk={selectTalk} talkSlideIndex={talkSlideIndex} onTalkSlide={setTalkSlideIndex} onProject={setProject} onClose={close} />
  </div>;
}
