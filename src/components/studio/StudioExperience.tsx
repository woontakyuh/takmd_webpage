import { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrangementProvider, useArrangement } from './arrangement';
import { ArrangementControls } from './ArrangementControls';
import { ReadingPanel } from './ReadingPanel';
import { OfficeIcon } from './OfficeIcon';
import { OfficeHelp } from './OfficeHelp';
import { useBlindLift } from './useBlindLift';
import { OfficeRoomControls, type RoomControl } from './OfficeRoomControls';
import { MemoryPhoto } from './MemoryPhoto';
import { BookReader } from './BookReader';
import { useOfficeNavigation } from './useOfficeNavigation';
import { OFFICE_HOME, officePathView } from './officeNavigation';
import { LoadingMonitorReader } from './LoadingMonitorReader';
import { PERSONAL_BOOKS, personalBook, type PersonalBookId } from './personalBooks';
import { bookPageAfter } from './personalBookInteraction';
import { PhotoFrameInfo } from './PhotoFrameInfo';
import { VisitorCount } from './VisitorCount';
import { OfficePoster, SceneBoundary } from './OfficePoster';
import { PHOTO_MEMORIES, selectFamilyPhoto, type PhotoMemory } from './photoMemories';
import type { ExhibitId, HaloSettings, StudioContent } from './types';
import { featuredPresentation, mediaForPaper, orderedPapers, talkMedia } from './collection';
import { useOfficeLight, LocalClockReadout } from './OfficeTime';
import type { LightMode } from './localTime';
import { LIGHT_PRESETS, type LightPreset } from './lightingPresets';
import { PERSONAL_LINKS } from './personal';
import { SceneInspectionProvider, useSceneInspection } from './scene/SceneInspection';

const Scene = lazy(async () => {
  const module = await import('./StudioScene');
  return { default: module.StudioScene };
});
const exhibits = [
  { id: 'ai', label: 'Profile', detail: 'Living CV' },
  { id: 'spine', label: 'Practice', detail: 'Clinical spine surgery' },
  { id: 'research', label: 'Research', detail: 'Papers & ideas' },
  { id: 'education', label: 'Talks', detail: 'Conferences & lectures' },
] as const satisfies readonly { readonly id: ExhibitId; readonly label: string; readonly detail: string }[];
const socialLinks = [
  { label: 'Email', detail: 'woontak.yuh@gmail.com', href: PERSONAL_LINKS.email },
  { label: 'YouTube', detail: '@tak_md · Shorts', href: PERSONAL_LINKS.youtube },
  { label: 'LinkedIn', detail: 'Woon Tak Yuh', href: PERSONAL_LINKS.linkedin },
  { label: 'Instagram', detail: '@tak_md', href: PERSONAL_LINKS.instagram },
] as const;

export function StudioExperience(content: StudioContent) {
  return <ArrangementProvider><SceneInspectionProvider><OfficeExperience {...content} /></SceneInspectionProvider></ArrangementProvider>;
}
function OfficeExperience(content: StudioContent) {
  const arrangement = useArrangement();
  const { inspection, setInspection } = useSceneInspection();
  const progress = useRef(0);
  const returnFocus = useRef<HTMLElement | null>(null);
  const navigation = useOfficeNavigation();
  const { selected, focused, details } = navigation.view;
  const monitorScroll = useRef({ scrollTop: 0 });
  const setSelected = useCallback((id: ExhibitId | null) => navigation.go({ focused: id, selected: id, details: null }), [navigation.go]);
  const [selectedBook, setSelectedBook] = useState<PersonalBookId>(PERSONAL_BOOKS[0].id);
  const [bookPageIndex, setBookPageIndex] = useState(0);
  const [bookshelfVisit, setBookshelfVisit] = useState(0);
  const [bookshelfReady, setBookshelfReady] = useState(false);
  const [familyPhoto] = useState(selectFamilyPhoto);
  const [memory, setMemory] = useState<PhotoMemory | null>(null);
  const openMemory = useCallback(() => { if (!arrangement.editing) setMemory(PHOTO_MEMORIES.ppomppu); }, [arrangement.editing]);
  const [viewCommand, setViewCommand] = useState<{ readonly sequence: number; readonly view: 0 | 1 | 2 }>({ sequence: 0, view: 0 });
  const [lightMode, setLightMode] = useState<LightMode>('local');
  const localLighting = useOfficeLight(lightMode);
  const [manualLights, setManualLights] = useState<boolean | null>(null);
  const [lightPreset, setLightPreset] = useState<LightPreset>('warm');
  const [roomBrightness, setRoomBrightness] = useState(1);
  const [haloSettings, setHaloSettings] = useState<HaloSettings>({ enabled: null, brightness: 0.65, temperature: 3500 });
  const [roomControl, setRoomControl] = useState<RoomControl | null>(null);
  const lighting = useMemo(() => localLighting
    ? { ...localLighting, sun: { ...localLighting.sun, lamp: (manualLights === null ? localLighting.sun.lamp : Number(manualLights)) * roomBrightness } }
    : null, [localLighting, manualLights, roomBrightness]);
  const halo = {
    power: (haloSettings.enabled === null ? localLighting?.sun.lamp ?? 0 : Number(haloSettings.enabled)) * haloSettings.brightness,
    brightness: haloSettings.brightness,
    temperature: haloSettings.temperature,
  };
  const applyPreset = (preset: LightPreset) => {
    const values = LIGHT_PRESETS[preset];
    setLightPreset(preset); setManualLights(true); setRoomBrightness(values.brightness);
    setHaloSettings({ enabled: true, brightness: values.halo, temperature: values.temperature });
  };
  const openHaloControls = useCallback(() => { if (!arrangement.editing) setRoomControl('halo'); }, [arrangement.editing]);
  const night = (lighting?.sun.daylight ?? 1) < 0.35;
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [sceneFailed, setSceneFailed] = useState(false);
  const onSceneError = useCallback(() => setSceneFailed(true), []);
  const [loadingProfileSession, setLoadingProfileSession] = useState(false);
  const loadingProfileOpen = selected === 'ai' && (loadingProfileSession || !ready || sceneFailed);
  useLayoutEffect(() => { setLoadingProfileSession(loadingProfileOpen); }, [loadingProfileOpen]);
  const [zoomed, setZoomed] = useState(false);
  const [explored, setExplored] = useState(false);
  const [compact, setCompact] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [blindLift, changeBlindLift] = useBlindLift(reducedMotion);
  const [paperId, setPaperId] = useState(() => orderedPapers(content.publications)[0]?.id ?? null);
  const paperIdRef = useRef(paperId);
  const [paperTurn, setPaperTurn] = useState(0);
  const [paperDirection, setPaperDirection] = useState<1 | -1>(1);
  const [talkId, setTalkId] = useState<string | null>(null);
  const [talkSlideIndex, setTalkSlideIndex] = useState(0);
  const publication = content.publications.find(paper => paper.id === paperId) ?? null;
  const presentation = content.presentations.find(talk => talk.id === talkId) ?? null;
  const slides = talkMedia.find(media => media.id === talkId)?.slides ?? [];
  const collection = { publication, paperMedia: mediaForPaper(publication), paperTurn, paperDirection,
    paperIndex: Math.max(0, orderedPapers(content.publications).findIndex(paper => paper.id === paperId)),
    paperCount: content.publications.length, presentation, talkSlide: slides[talkSlideIndex] ?? null };
  const selectPaper = useCallback((id: string) => {
    const papers = orderedPapers(content.publications);
    const nextIndex = papers.findIndex(paper => paper.id === id);
    const currentIndex = papers.findIndex(paper => paper.id === paperIdRef.current);
    if (nextIndex < 0) return;
    setSelected('research');
    if (nextIndex === currentIndex) return;
    paperIdRef.current = id;
    setPaperDirection(nextIndex >= currentIndex ? 1 : -1);
    setPaperId(id); setPaperTurn(turn => turn + 1);
  }, [content.publications, setSelected]);
  const onPaperStep = useCallback((direction: 1 | -1) => {
    const papers = orderedPapers(content.publications);
    const index = papers.findIndex(paper => paper.id === paperIdRef.current);
    const adjacent = index >= 0 ? papers[index + direction] : undefined;
    if (adjacent) selectPaper(adjacent.id);
  }, [content.publications, selectPaper]);
  const selectTalk = (id: string | null) => { setTalkId(id); setTalkSlideIndex(0); if (id) setSelected('education'); };

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

  const featuredTalk = featuredPresentation(content.presentations);
  const open = useCallback((id: ExhibitId) => {
    if (arrangement.editing) return;
    const active = document.activeElement;
    returnFocus.current = active instanceof HTMLElement && active.closest('button, a') ? active : document.getElementById(`studio-exhibit-${id === 'bookshelf' ? 'books' : id}`);
    if (id === 'education') setTalkId(current => current ?? featuredTalk?.id ?? null);
    setExplored(true); setSelected(id);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [featuredTalk?.id, arrangement.editing, setSelected]);
  const openAwardPhoto = useCallback(() => open('award-photo'), [open]);
  const openLoadingProfile = () => open('ai');
  const approach = (id: ExhibitId) => {
    if (arrangement.editing) return;
    if (id === 'ai' || (id === 'education' && talkId !== null) || navigation.current.current.focused === id) open(id);
    else { setExplored(true); navigation.go({ focused: id, selected: null, details: null }); }
  };
  const selectBook = (id: PersonalBookId) => { setSelectedBook(id); setBookPageIndex(0); open('books'); };
  const approachBookshelf = () => { setBookshelfReady(false); setBookshelfVisit(visit => visit + 1); open('bookshelf'); };
  const stepBook = useCallback((direction: 1 | -1) => {
    if (selected !== 'books') return;
    setBookPageIndex(index => bookPageAfter(index, personalBook(selectedBook).pages.length, direction));
  }, [selected, selectedBook]);
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const exhibit = query.get('exhibit');
    if (exhibit === 'education') {
      const talk = content.presentations.find(item => item.id === query.get('talk'));
      if (talk) setTalkId(talk.id);
    } else if (exhibit === 'research') {
      const paper = content.publications.find(item => item.id === query.get('paper') || item.doiUrl === query.get('paper'));
      if (paper) { setPaperId(paper.id); paperIdRef.current = paper.id; }
    }
  }, []);
  const close = useCallback(() => {
    navigation.close();
    requestAnimationFrame(() => returnFocus.current?.focus({ preventScroll: true }));
  }, [navigation.close]);

  useEffect(() => {
    const navigate = (href: string) => {
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin && url.origin !== 'https://takmd.com') return false;
      const next = officePathView(url.pathname + url.search + url.hash, navigation.current.current);
      if (!next) return false;
      setExplored(true);
      const requestedTalk = next.selected === 'education'
        ? content.presentations.find(talk => talk.id === url.searchParams.get('talk')) : undefined;
      if (next.selected === 'education') {
        setInspection(null);
        setTalkId(value => requestedTalk?.id ?? value ?? featuredTalk?.id ?? null);
        if (requestedTalk) setTalkSlideIndex(0);
      }
      navigation.go(next);
      if (requestedTalk) {
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('talk', requestedTalk.id);
        window.history.replaceState(window.history.state, '', currentUrl.pathname + currentUrl.search);
      }
      window.scrollTo({ top: 0, behavior: 'instant' });
      return true;
    };
    const onLink = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
      const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!(anchor instanceof HTMLAnchorElement) || anchor.hasAttribute('download') || anchor.getAttribute('href')?.startsWith('#')) return;
      if (navigate(anchor.href)) { event.preventDefault(); event.stopPropagation(); }
    };
    const onNavigate = (event: Event) => { if (event instanceof CustomEvent && typeof event.detail === 'string') navigate(event.detail); };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || document.querySelector('dialog[open]')) return;
      if (navigation.current.current.focused || navigation.current.current.details) { event.preventDefault(); close(); }
    };
    document.addEventListener('click', onLink, true);
    const onZoomed = (event: Event) => { if (event instanceof CustomEvent) setZoomed(event.detail === true); };
    window.addEventListener('office:zoomed', onZoomed);
    window.addEventListener('office:navigate', onNavigate);
    window.addEventListener('keydown', onEscape);
    return () => { window.removeEventListener('office:zoomed', onZoomed); document.removeEventListener('click', onLink, true); window.removeEventListener('office:navigate', onNavigate); window.removeEventListener('keydown', onEscape); };
  }, [navigation.go, navigation.current, close, featuredTalk?.id, content.presentations, setInspection]);
  useEffect(() => { if (inspection) window.scrollTo({ top: 0, behavior: 'instant' }); }, [inspection]);
  const onReady = useCallback(() => requestAnimationFrame(() => setReady(true)), []);
  const goToView = (view: 0 | 1 | 2) => {
    setExplored(true);
    setInspection(null);
    setZoomed(false);
    navigation.go(OFFICE_HOME);
    progress.current = view / 2;
    setViewCommand(previous => ({ sequence: previous.sequence + 1, view }));
  };

  const showOverviewReturn = Boolean(focused || selected || details || inspection || zoomed);

  return <div className="studio" data-night={night} data-selected={selected ?? focused ?? (details ? 'details' : undefined)} data-reading={selected ?? undefined} data-approached={focused ?? undefined} data-inspecting={inspection ? 'whisky' : undefined} data-explored={explored} data-arranging={arrangement.editing}>
    <section className="studio-stage" aria-label="TakMD's office">
      <div className="studio-scene" aria-label="Explore the office" aria-describedby="office-help" tabIndex={0}
        onPointerDown={() => setExplored(true)} onWheelCapture={() => setExplored(true)}
        onKeyDown={event => { if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-', '_'].includes(event.key)) setExplored(true); }}>
        <div style={{ display: 'contents' }} inert={loadingProfileOpen} aria-hidden={loadingProfileOpen || undefined}><SceneBoundary onError={onSceneError}>{mounted && lighting && <Suspense fallback={null}>
          <Scene ready={ready} paused={loadingProfileOpen} focused={loadingProfileOpen ? null : focused} monitorScroll={monitorScroll.current} selectedBook={selectedBook} bookPageIndex={bookPageIndex} onBookSelect={selectBook} onBookStep={stepBook} onBookshelfApproach={approachBookshelf} bookshelfVisit={bookshelfVisit} bookshelfReady={bookshelfReady} onBookshelfReady={setBookshelfReady} familyPhotoSrc={familyPhoto.src} progress={progress} selected={loadingProfileOpen ? null : selected} night={night} lighting={lighting} roomPalette={LIGHT_PRESETS[lightPreset]} blindLift={blindLift} halo={halo} onHaloControls={openHaloControls} onRoomControl={setRoomControl} reducedMotion={reducedMotion} compact={compact} collection={collection} viewCommand={viewCommand} presentations={content.presentations} onSelect={approach} onClose={close} onClaudeSticker={openMemory} onAwardPhoto={() => approach('award-photo')} onPaperStep={onPaperStep} onTalk={selectTalk} onTalkSlide={setTalkSlideIndex} onReady={onReady} />
        </Suspense>}</SceneBoundary></div>
        <OfficePoster ready={ready} failed={sceneFailed} night={night} interactive={mounted} onProfile={openLoadingProfile} />
        {loadingProfileOpen && <LoadingMonitorReader publicationCount={content.publications.length} presentationCount={content.presentations.length} onClose={close} scrollState={monitorScroll.current} />}
        <button className="office-secret-trigger" id="studio-exhibit-books" onClick={approachBookshelf}>Browse personal books</button>
        <button className="office-secret-trigger" onClick={openMemory} aria-label="Claude sticker">Claude sticker</button>
        <button className="office-secret-trigger" id="studio-exhibit-award" onClick={() => open('award')}>Inspect the gold award</button>
        <button className="office-secret-trigger" id="studio-exhibit-award-photo" onClick={openAwardPhoto}>View the KOSESS award photograph</button>
        <a className="office-secret-trigger" href={PERSONAL_LINKS.hospital} target="_blank" rel="noopener noreferrer">Davos Hospital · physician coat (opens in a new tab)</a>
      </div>
      <header className="studio-header">
        <a className="studio-brand" href="/" aria-label="TakMD home"><span className="studio-brand-mark" aria-hidden="true">t.</span><div><h1>Woon Tak Yuh<span>, MD.</span></h1><span className="studio-brand-caption">Endoscopic spine surgery · Research · Teaching</span></div></a>
        <nav aria-label="Office navigation"><a href="/cv">Living CV</a><a href="/contact">Contact <span aria-hidden="true">↗</span></a></nav>
      </header>
      <div className="studio-tools">
        <button onClick={() => goToView(0)} aria-label="Return to the overview" style={showOverviewReturn ? { visibility: 'hidden' } : undefined}><OfficeIcon name="overview" /><span>Overview</span></button>
        <button onClick={() => setLightMode(value => value === 'local' ? 'day' : value === 'day' ? 'evening' : 'local')}
          aria-label={lightMode === 'local' ? 'Local light · Preview daylight' : lightMode === 'day' ? 'Daylight preview · Preview evening' : 'Evening preview · Return to local light'}
          title="Light follows your time zone’s approximate sun position. Click to preview other lighting.">
          <OfficeIcon name={lightMode === 'local' ? 'clock' : lightMode === 'day' ? 'sun' : 'moon'} /><span>{lightMode === 'local' ? 'Local light' : lightMode === 'day' ? 'Daylight preview' : 'Evening preview'}</span>
        </button>
        <OfficeRoomControls preset={lightPreset} onPreset={applyPreset} control={roomControl} onClose={() => setRoomControl(null)} blindLift={blindLift} lightsOn={(lighting?.sun.lamp ?? 0) > 0}
          automaticLight={manualLights === null} onBlindLift={changeBlindLift}
          onLights={value => { setManualLights(value); if (value && roomBrightness === 0) setRoomBrightness(1); }}
          onAutomaticLight={() => { setManualLights(null); setRoomBrightness(1); }} roomBrightness={roomBrightness}
          onRoomBrightness={value => { setRoomBrightness(value); setManualLights(true); }}
          haloSettings={haloSettings} haloOn={halo.power > 0} onHaloSettings={setHaloSettings} />
        <ArrangementControls onStart={() => { setRoomControl(null); setSelected(null); }} />
        <LocalClockReadout />
      </div>
      <div className="office-bottom">
        <div className="office-summary">
          <div className="office-title"><p className="studio-kicker">TAKMD / A PLACE TO THINK</p><h2>The office.</h2></div>
          <div className="office-guided" aria-label="Guided views"><span>A closer look</span><button onClick={() => goToView(1)}>The practice</button><button onClick={() => goToView(2)}>The desk</button><button id="studio-exhibit-family" onClick={() => open('family')}>Photo frame</button></div>
        </div>
        <footer className="studio-stage-footer">
        <OfficeHelp ready={ready} explored={explored} compact={compact} onControl={setRoomControl} />
        <div className="studio-collection">
          <p id="office-collection-hint" className="office-collection-hint">Swipe to browse all seven <span aria-hidden="true">→</span></p>
          <nav className="studio-exhibits" aria-label="Office collection" aria-describedby="office-collection-hint">
            {exhibits.map(item => <button className="studio-exhibit" id={`studio-exhibit-${item.id}`} key={item.id} aria-label={`${item.label}: ${item.detail}`} aria-pressed={selected === item.id} onClick={() => item.id === 'ai' && (!ready || sceneFailed) ? openLoadingProfile() : open(item.id)}><OfficeIcon name={item.id === 'ai' ? 'cv' : item.id} /><span>{item.label}<small>{item.detail}</small></span></button>)}
            <a className="studio-exhibit studio-exhibit-workshop" href="/education#overview" aria-label="Education: Workshops & training"><OfficeIcon name="workshop" /><span>Education<small>Workshops & training</small></span></a>
            <button className="studio-exhibit" id="studio-exhibit-projects" aria-pressed={selected === 'projects'} onClick={() => open('projects')}><OfficeIcon name="projects" /><span>AI projects<small>Builds, talks & papers</small></span></button>
            <button className="studio-exhibit" popoverTarget="office-social-links" aria-controls="office-social-links" aria-haspopup="dialog"><OfficeIcon name="social" /><span>Connect<small>Email & social</small></span></button>
          </nav>
          <div id="office-social-links" className="office-social-links" popover="auto" role="dialog" aria-label="Connect">
            <div className="office-social-heading"><span>Connect</span><button popoverTarget="office-social-links" popoverTargetAction="hide" aria-label="Close Connect links"><OfficeIcon name="close" /></button></div>
            {socialLinks.map(link => <a key={link.label} href={link.href} target={link.label === 'Email' ? undefined : '_blank'} rel="noopener noreferrer"><span>{link.label}<small>{link.detail}</small></span><span aria-hidden="true">↗</span></a>)}
          </div>
        </div>
        <a className="office-index" href="#office-reading">Browse the work <span aria-hidden="true">↓</span></a>
        </footer>
      </div>
    </section>
    <section id="office-reading" className="studio-notes" aria-labelledby="studio-notes-heading">
      <div className="studio-notes-heading"><p className="studio-kicker">From the desk</p><h2 id="studio-notes-heading">Practice shapes<br /><em>the questions.</em></h2><a className="studio-text-link" href="/research">Research archive ↗</a></div>
      <div className="studio-notes-list">{content.publications.slice(0, 3).map(p => <a key={`${p.doiUrl}-${p.title}`} href={p.doiUrl || '/research'} target={p.doiUrl ? '_blank' : undefined} rel={p.doiUrl ? 'noreferrer' : undefined}><span className="studio-meta">{p.journal} / {p.year}</span><h3>{p.title}</h3><span className="studio-notes-arrow" aria-hidden="true">↗</span></a>)}</div>
    </section>
    <footer className="studio-end"><div className="studio-end-identity"><span>Woon Tak Yuh, MD.</span><a href="/contact">Contact ↗</a><a href="/knowledge">Knowledge</a><a href="/media">Media</a><a href="/credits">Scene credits</a><VisitorCount /></div><nav aria-label="Browse all work"><a href="/cv">Profile</a><a href="/ube">Practice</a><a href="/research">Research</a><a href="/?exhibit=education">Talks</a><a href="/education#overview">Education<small>Workshops & training</small></a><a href="/ai">AI projects</a><div className="studio-end-social"><span>Connect</span><div>{socialLinks.map(link => <a key={link.label} href={link.href} target={link.label === 'Email' ? undefined : '_blank'} rel="noopener noreferrer">{link.label} ↗</a>)}</div></div></nav></footer>
    {showOverviewReturn && <button className="office-overview-return" onClick={() => goToView(0)} aria-label="Return to the overview"><OfficeIcon name="overview" /><span>Overview</span></button>}
    <ReadingPanel {...content} detailsPath={details} selected={details ? null : selected === 'ai' || selected === 'education' || selected === 'family' || selected === 'award-photo' || selected === 'books' || selected === 'bookshelf' ? null : selected} collection={collection} onPaper={selectPaper} onTalk={selectTalk} talkSlideIndex={talkSlideIndex} onTalkSlide={setTalkSlideIndex} onClose={close} />
    {zoomed && <div className="office-approach-actions"><button className="studio-icon-button" onClick={() => window.dispatchEvent(new Event('office:zoom-close'))} aria-label="Return from closer view"><OfficeIcon name="close" /></button></div>}
    {!zoomed && !selected && focused && !details && <div className="office-approach-actions"><button className="studio-icon-button" onClick={close} aria-label="Return to previous office view"><OfficeIcon name="close" /></button><button onClick={() => open(focused)}>Open {focused === 'ai' ? 'monitor' : focused === 'education' ? 'TV' : 'object'}</button></div>}
    {(selected === 'family' || selected === 'award-photo') && <PhotoFrameInfo memory={selected === 'family' ? familyPhoto : PHOTO_MEMORIES['kosess-award']} variant={selected === 'award-photo' ? 'award-pair' : 'frame'} onClose={close} />}
    {(selected === 'books' || selected === 'bookshelf') && <BookReader selectedBook={selectedBook} pageIndex={bookPageIndex} browsingShelf={selected === 'bookshelf'} shelfReady={bookshelfReady} onBookSelect={selectBook} onPageChange={setBookPageIndex} onClose={close} />}
    {memory && <MemoryPhoto memory={memory} onClose={() => setMemory(null)} />}
  </div>;
}
