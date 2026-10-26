import { Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { MathUtils, type Group } from 'three';
import { ResearchFolio } from '../ResearchFolio';
import { mediaForPaper } from '../collection';
import { filterResearch, RESEARCH_TOPICS, researchRoles, researchSubject, researchTopic, toggleResearchFilter, type AuthorFilter, type ResearchFilters } from '../researchIndex';
import type { Publication, StudioSceneProps } from '../types';
import { Block } from './Primitives';
import { Interactive } from './Interactive';
import { useDocumentTexture } from './CollectionTextures';
import { usePrintedTexture } from './Textures';
import { PALETTE, ROOM } from './config';
import '../research-book.css';

type Props = Pick<StudioSceneProps, 'publications' | 'publicationsUpdatedAt' | 'collection' | 'onPaper' | 'onClose' | 'selected' | 'onSelect' | 'reducedMotion'>;
const PAGE_HEIGHT = Math.SQRT2;
const TURN_MS = 720;
const AUTHOR_OPTIONS: { value: AuthorFilter; label: string }[] = [
  { value: 'first', label: 'First Author' },
  { value: 'corresponding', label: 'Corresponding Author' },
  { value: 'coauthor', label: 'Co-Author' },
];

function FittedDetails({ children, paperId }: { children: ReactNode; paperId?: string }) {
  const element = useRef<HTMLElement>(null);
  const [overflow, setOverflow] = useState(false);
  useLayoutEffect(() => {
    const page = element.current;
    const copy = page?.querySelector<HTMLElement>('.research-folio');
    if (!page || !copy) return;
    const fit = () => {
      if (!page.clientHeight) return;
      let zoom = .9;
      copy.style.zoom = String(zoom);
      while (page.scrollHeight > page.clientHeight + 1 && zoom > .68) {
        zoom = Math.max(.68, zoom - .02);
        copy.style.zoom = String(zoom);
      }
      setOverflow(page.scrollHeight > page.clientHeight + 1);
    };
    fit(); page.scrollTo({ top: 0 });
    const observer = new MutationObserver(fit);
    observer.observe(copy, { childList: true, subtree: true });
    const resizeObserver = new ResizeObserver(fit);
    resizeObserver.observe(page);
    return () => { observer.disconnect(); resizeObserver.disconnect(); };
  }, [paperId]);
  return <><section ref={element} className="research-book-detail" aria-label="Paper details">{children}</section>{overflow && <span className="research-book-scroll-hint">Scroll for full details ↓</span>}</>;
}

export function ResearchBook({ publications, publicationsUpdatedAt, collection, onPaper, onClose, selected, onSelect, reducedMotion }: Props) {
  const [filters, setFilters] = useState<ResearchFilters>({ topics: [], authors: [] });
  const [opened, setOpened] = useState(false);
  const [turn, setTurn] = useState<{ to: Publication; direction: number } | null>(null);
  const placement = useRef<Group>(null);
  const cover = useRef<Group>(null);
  const flap = useRef<Group>(null);
  const opening = useRef(0);
  const busy = useRef(false);
  const turnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const turnSequence = useRef(0);
  const invalidate = useThree(state => state.invalidate);
  const linen = usePrintedTexture('linen');
  const coverPrint = usePrintedTexture('folio');
  const documentTexture = useDocumentTexture({ image: collection.paperMedia?.pageImage ?? null, title: collection.publication?.title ?? '', eyebrow: collection.publication?.journal ?? '', detail: 'Published first page' });
  const active = selected === 'research';
  const matching = useMemo(() => filterResearch(publications, filters), [publications, filters]);
  const index = matching.findIndex(paper => paper.id === collection.publication?.id);
  const groups = [...new Set(matching.map(paper => paper.year))];
  const counts = matching.reduce((total, paper) => {
    const roles = researchRoles(paper);
    total.first += Number(roles.includes('first'));
    total.corresponding += Number(roles.includes('corresponding'));
    total.coauthor += Number(!roles.includes('first') && !roles.includes('corresponding') && roles.includes('coauthor'));
    return total;
  }, { first: 0, corresponding: 0, coauthor: 0 });

  useEffect(() => {
    if (!active) setOpened(false);
    invalidate();
  }, [active, invalidate]);
  useEffect(() => {
    turnSequence.current += 1;
    if (turnTimer.current) clearTimeout(turnTimer.current);
    busy.current = false; setTurn(null);
    if (active && matching.length && !matching.some(paper => paper.id === collection.publication?.id)) onPaper(matching[0].id);
  }, [filters, active, matching, collection.publication?.id, onPaper]);
  useEffect(() => () => { turnSequence.current += 1; if (turnTimer.current) clearTimeout(turnTimer.current); }, []);


  useFrame((_, delta) => {
    if (!placement.current || !cover.current || !flap.current) return;
    const duration = 1.4;
    opening.current = reducedMotion ? Number(active) : MathUtils.clamp(opening.current + (active ? 1 : -1) * Math.min(delta, .05) / duration, 0, 1);
    const amount = opening.current;
    const coverAmount = MathUtils.smootherstep(Math.min(1, amount / .7), 0, 1);
    const flapAmount = MathUtils.smootherstep(Math.max(0, (amount - .7) / .3), 0, 1);
    cover.current.rotation.z = Math.PI * coverAmount;
    cover.current.position.y = .072 * (1 - coverAmount) + .018 * coverAmount;
    flap.current.rotation.z = Math.PI * (1 - flapAmount);
    const from = ROOM.folio.stowed.position, to = ROOM.folio.position;
    placement.current.position.set(...from.map((value, axis) => MathUtils.lerp(value, to[axis], coverAmount)) as [number, number, number]);
    if (active && amount === 1 && !opened) setOpened(true);
    if (amount > 0 && amount < 1) invalidate();
  });

  async function choose(paper: Publication | undefined) {
    if (!paper || paper.id === collection.publication?.id || busy.current) return;
    if (reducedMotion) { onPaper(paper.id); return; }
    busy.current = true;
    const sequence = ++turnSequence.current;
    const media = mediaForPaper(paper);
    if (media) {
      const image = new Image(); image.src = media.pageImage;
      await Promise.race([image.decode().catch(() => undefined), new Promise(resolve => setTimeout(resolve, 1200))]);
    }
    if (sequence !== turnSequence.current) return;
    setTurn({ to: paper, direction: matching.indexOf(paper) > index ? 1 : -1 });
    turnTimer.current = setTimeout(() => { onPaper(paper.id); setTurn(null); busy.current = false; }, TURN_MS);
  }
  const previewPaper = turn?.direction === 1 ? turn.to : collection.publication;
  const preview = mediaForPaper(previewPaper);
  const filterControls = <>
    <div className="research-book-filters">
      <span className="research-book-filter-label">Subject</span>
      <div className="research-book-topics" role="group" aria-label="Research topics">
        <button aria-pressed={!filters.topics.length} onClick={() => setFilters(previous => ({ ...previous, topics: [] }))}>All</button>
        {RESEARCH_TOPICS.map(topic => <button key={topic} aria-pressed={filters.topics.includes(topic)} onClick={() => setFilters(previous => ({ ...previous, topics: toggleResearchFilter(previous.topics, topic) }))}>{topic}</button>)}
      </div>
      <span className="research-book-filter-label">Authorship</span>
      <div className="research-book-authors" role="group" aria-label="Authorship">
        <button aria-label="All Author" title="All Author" aria-pressed={!filters.authors.length} onClick={() => setFilters(previous => ({ ...previous, authors: [] }))}>All</button>
        {AUTHOR_OPTIONS.map(({ value, label }) => <button key={value} aria-label={label} title={label} aria-pressed={filters.authors.includes(value)} onClick={() => setFilters(previous => ({ ...previous, authors: toggleResearchFilter(previous.authors, value) }))}>{value === 'first' ? 'First' : value === 'corresponding' ? 'Corresponding' : 'Co-author'}</button>)}
      </div>
    </div>
  </>;
  const contents = <>
    <aside className="research-book-index" aria-label="Research index">
      <header className="research-book-index-header"><h2>Index</h2><button aria-label="Close research book" onClick={onClose}>×</button></header>
      {filterControls}
      <div className="research-book-count" role="status"><strong>{matching.length}</strong> papers <span>of {publications.length}</span><small>First {counts.first} · Corresponding {counts.corresponding} · Co-author {counts.coauthor}</small><small>Joint first authors included; overlapping roles counted once in total.</small></div>
      <nav aria-label="Filtered papers">{groups.map(year => <section key={year}><h3>{year}<span>{matching.filter(paper => paper.year === year).length}</span></h3>{matching.filter(paper => paper.year === year).map(paper => <button key={paper.id} title={paper.title} aria-label={`${paper.date ?? paper.year} · ${paper.journal} · ${paper.title}`} aria-current={paper.id === collection.publication?.id ? 'true' : undefined} onClick={() => void choose(paper)}><time>{paper.date ? new Date(`${paper.date.slice(0,10)}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }) : '—'}</time><span>{paper.journal}</span><span className="research-book-category" aria-label={`Category: ${researchTopic(paper)}`}>{researchTopic(paper)}</span><small>{researchSubject(paper)}</small></button>)}</section>)}{!matching.length && <p>No matching papers.</p>}</nav>
    </aside>
    <FittedDetails paperId={collection.publication?.id}>
      {matching.length > 0 ? <ResearchFolio embedded publications={matching} updatedAt={publicationsUpdatedAt} publication={collection.publication} media={collection.paperMedia} direction={collection.paperDirection} onPaper={id => void choose(matching.find(paper => paper.id === id))} /> : <p>No papers match these filters.</p>}
    </FittedDetails>
    <section className="research-book-preview" aria-label="Published first page">
      {matching.length > 0 && <><button className="research-book-next" aria-label="Turn page to next paper" disabled={!!turn || index < 0 || index >= matching.length - 1} onClick={() => void choose(matching[index + 1])}>{preview ? <img src={preview.pageImage} alt={`First page of ${previewPaper?.title}`} /> : <span>First-page preview unavailable.<br />{previewPaper?.title}</span>}</button><footer><span>{index + 1} / {matching.length}</span>{preview && <a href={preview.pageImage} target="_blank" rel="noreferrer">View original ↗</a>}<span>{index === matching.length - 1 ? 'Last paper' : 'Click page to turn →'}</span></footer></>}
    </section>
    {turn && <div className="research-turn-leaf" inert data-direction={turn.direction} aria-hidden="true"><div className="research-turn-front">{(turn.direction === 1 ? collection.paperMedia : mediaForPaper(turn.to)) && <img src={(turn.direction === 1 ? collection.paperMedia : mediaForPaper(turn.to))!.pageImage} alt="" />}</div><div className="research-turn-back">{turn.direction === 1 ? <FittedDetails paperId={turn.to.id}><ResearchFolio embedded publications={matching} updatedAt={publicationsUpdatedAt} publication={turn.to} media={mediaForPaper(turn.to)} direction={1} onPaper={() => {}} /></FittedDetails> : <div className="research-turn-verso"><span>{collection.publication?.journal} / {collection.publication?.year}</span><h3>{collection.publication?.title}</h3></div>}</div></div>}
  </>;
  const surface = <div className="research-book-surface" data-turning={!!turn} onPointerDown={event => event.stopPropagation()} onWheel={event => event.stopPropagation()}><div className="research-book-pages">{contents}</div></div>;

  return <>
    <group ref={placement} name="Research folio placement" position={[...ROOM.folio.stowed.position]} rotation={[0, Math.PI, 0]}>
      <Interactive id="research" selected={selected} onSelect={onSelect} reducedMotion={reducedMotion} position={[0, 0, 0]}><group scale={.25}>
        <Block size={[1.04, .024, PAGE_HEIGHT + .04]} color={PALETTE.linen} texture={linen} radius={.004} />
        <Block size={[1, .046, PAGE_HEIGHT]} position={[0, .035, 0]} color="#f8f6f0" radius={.001} />
        <mesh position={[0, .059, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[1, PAGE_HEIGHT]} /><meshStandardMaterial map={documentTexture} roughness={.95} /></mesh>
        <Block size={[.025, .072, PAGE_HEIGHT + .04]} position={[-.52, .03, 0]} color={PALETTE.linen} texture={linen} radius={.004} />
        <group ref={cover} name="Folio hinged front cover" position={[-.5, .072, 0]}>
          <Block size={[1.04, .018, PAGE_HEIGHT + .04]} position={[.5, 0, 0]} color={PALETTE.linen} texture={linen} radius={.004} />
          <mesh position={[.5, .0095, -.12]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[.7, .72]} /><meshStandardMaterial map={coverPrint} roughness={.95} /></mesh>
          <Block size={[1, .008, PAGE_HEIGHT]} position={[.5, -.015, 0]} color="#f8f6f0" radius={.001} />
          <group ref={flap} name="Folio folding index wing" position={[1, -.024, 0]} rotation={[0, 0, Math.PI]}>
            <Block size={[.52, .008, PAGE_HEIGHT + .02]} position={[.25, 0, 0]} color={PALETTE.linen} texture={linen} radius={.002} />
            <Block size={[.5, .004, PAGE_HEIGHT]} position={[.25, -.007, 0]} color="#eae8df" radius={.001} />
          </group>
        </group>
        {active && opened && <Html transform position={[-.75, .063, 0]} rotation={[-Math.PI / 2, 0, 0]} distanceFactor={.8} zIndexRange={[22, 18]}>{surface}</Html>}
      </group></Interactive>
    </group>

  </>;
}
