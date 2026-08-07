import { useEffect, useRef, useState } from 'react';
import { Terminal } from '../Terminal';
import type { SceneMetrics } from '../types';

// logical screen resolution of the monitor plane — matches a typical viewport at full zoom
// desktop.png (1920x1080 capture) is stretched to fill; capture→logical factor = 0.75
export const OS_W = 1440;
export const OS_H = 812;
const SX = OS_W / 1920;
const SY = OS_H / 1080;
const CS = SX; // chrome-slice display scale (slices are 1x captures)

type AppDef = {
  id: string;
  title: string;
  kind: 'terminal' | 'browser';
  src?: string;
};

// apps opened by desk objects / dock icons; browser apps render in the real Chrome frame
const APPS: AppDef[] = [
  { id: 'terminal', title: 'tak@desk — whoami', kind: 'terminal' },
  { id: 'cv', title: 'Living CV', kind: 'browser', src: '/cv' },
  { id: 'ube', title: 'UBE Surgery', kind: 'browser', src: '/ube' },
  { id: 'research', title: 'Research', kind: 'browser', src: '/research' },
  { id: 'ai', title: 'Clinical AI', kind: 'browser', src: '/ai' },
  { id: 'dashboard', title: 'Surgery Dashboard', kind: 'browser', src: '/dashboard' },
  { id: 'education', title: 'Education', kind: 'browser', src: '/education' },
  { id: 'contact', title: 'Contact', kind: 'browser', src: '/contact' },
  { id: 'media', title: 'Media', kind: 'browser', src: '/media' },
];

// dock hotspots over the real dock in the macos2 capture (capture px, center x / icon width 54)
const DOCK: { id: string; label: string; cx: number; app?: string }[] = [
  { id: 'finder', label: 'Finder', cx: 555 },
  { id: 'mail', label: 'Mail — Contact', cx: 610, app: 'contact' },
  { id: 'chrome', label: 'Chrome — UBE Surgery', cx: 671, app: 'ube' },
  { id: 'calendar', label: 'Calendar — Education', cx: 733, app: 'education' },
  { id: 'notion', label: 'Notion — Living CV', cx: 794, app: 'cv' },
  { id: 'contacts', label: 'Contacts — Contact', cx: 855, app: 'contact' },
  { id: 'photos', label: 'Photos — Media', cx: 919, app: 'media' },
  { id: 'arrow', label: 'Research', cx: 977, app: 'research' },
  { id: 'terminal', label: 'Terminal', cx: 1038, app: 'terminal' },
  { id: 'launchpad', label: 'Clinical AI', cx: 1099, app: 'ai' },
  { id: 'settings', label: 'Surgery Dashboard', cx: 1160, app: 'dashboard' },
  { id: 'folder-a', label: 'Applications', cx: 1245 },
  { id: 'folder-b', label: 'Downloads', cx: 1305 },
  { id: 'trash', label: 'Trash', cx: 1368 },
];

const MENUBAR_H = Math.round(30 * SY); // ~23
const CHROME_H = Math.round(85 * CS); // ~64
const DOCK_TOP = Math.round(995 * SY); // dock panel top edge in logical px

export function MonitorOS({
  metrics,
  interactive,
  onWake,
  onExit,
  reducedMotion,
  launchApp,
}: {
  metrics: SceneMetrics;
  interactive: boolean;
  onWake: () => void;
  onExit: () => void;
  reducedMotion: boolean;
  launchApp?: { id: string; seq: number } | null;
}) {
  // single-window model: opening an app SWITCHES to it (no stacking)
  const [openedApps, setOpenedApps] = useState<string[]>([]);
  const [activeApp, setActiveApp] = useState<string | null>(null);
  const [maxed, setMaxed] = useState(false);
  const [winPos, setWinPos] = useState<{ x: number; y: number } | null>(null);
  const [glowDock, setGlowDock] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [debug] = useState(() => typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('dbg'));
  const rootRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ dx: number; dy: number; scale: number; left: number; top: number } | null>(null);
  const glowTimer = useRef<number>(0);
  const [clock, setClock] = useState(() => new Date());

  const interactiveRef = useRef(interactive);
  interactiveRef.current = interactive;

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    const id = window.setInterval(() => setClock(new Date()), 1000);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && interactiveRef.current) onExit();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(id);
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(glowTimer.current);
    };
  }, [onExit]);

  const openApp = (appId: string) => {
    setOpenedApps((prev) => (prev.includes(appId) ? prev : [...prev, appId]));
    setActiveApp(appId);
    const dock = DOCK.find((d) => d.app === appId);
    if (dock) {
      setGlowDock(dock.id);
      window.clearTimeout(glowTimer.current);
      glowTimer.current = window.setTimeout(() => setGlowDock(null), 1500);
    }
  };

  // desk objects request their app here (spine → ube, journals → cv, …)
  useEffect(() => {
    if (launchApp && APPS.some((a) => a.id === launchApp.id)) openApp(launchApp.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [launchApp?.seq]);

  const closeActive = () => {
    if (!activeApp) return;
    setOpenedApps((prev) => prev.filter((a) => a !== activeApp));
    setActiveApp(null);
  };

  const app = activeApp ? APPS.find((a) => a.id === activeApp)! : null;
  const isTerm = app?.kind === 'terminal';
  const winW = maxed ? OS_W : isTerm ? 780 : 1190;
  const winH = maxed ? OS_H - MENUBAR_H : isTerm ? 520 : DOCK_TOP - MENUBAR_H - 26;
  const defaultPos = { x: (OS_W - winW) / 2, y: MENUBAR_H + 14 };
  const pos = maxed ? { x: 0, y: MENUBAR_H } : (winPos ?? defaultPos);

  const onDragStart = (e: React.PointerEvent) => {
    if (maxed) return;
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scale = rect.width / OS_W;
    const p = { x: (e.clientX - rect.left) / scale, y: (e.clientY - rect.top) / scale };
    dragRef.current = { dx: p.x - pos.x, dy: p.y - pos.y, scale, left: rect.left, top: rect.top };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onDragMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const p = { x: (e.clientX - d.left) / d.scale, y: (e.clientY - d.top) / d.scale };
    setWinPos({
      x: Math.min(OS_W - 160, Math.max(-winW + 160, p.x - d.dx)),
      y: Math.min(OS_H - 80, Math.max(MENUBAR_H, p.y - d.dy)),
    });
  };
  const onDragEnd = () => (dragRef.current = null);

  const timeStr = clock
    .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    .replace(/\s?([AP]M)/, ' $1');
  const dateStr = clock.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).replace(',', '');

  return (
    <div ref={rootRef} className={`mos ${visible ? 'mos-on' : ''}`} data-reduced={reducedMotion}>
      {/* live clock over the frozen screenshot clock */}
      <div className="mos-clockpatch" />
      <span className="mos-liveclock">{`${dateStr}  ${timeStr}`}</span>
      {/* exit hotspot over the Apple logo */}
      <button className="mos-applehot" onClick={onExit} title="Back to desk (Esc)" aria-label="Back to desk" />

      {/* the one window — switching apps swaps its content */}
      {app && (
        <section
          className={`mos-win${isTerm ? ' mos-win-term' : ''}`}
          style={{ left: pos.x, top: pos.y, width: winW, height: winH }}
        >
          {app.kind === 'browser' ? (
            <div
              className="mos-chrometop"
              onPointerDown={onDragStart}
              onPointerMove={onDragMove}
              onPointerUp={onDragEnd}
              onDoubleClick={() => setMaxed((m) => !m)}
            >
              <div className="mos-chromeleft">
                <span className="mos-tabcover" />
                <span className="mos-tabtitle">{app.title}</span>
                <span className="mos-urlcover" />
                <span className="mos-urltext">takmd.com{app.src}</span>
              </div>
              <div className="mos-chromemid" />
              <div className="mos-chromeright" />
              <button className="mos-hot mos-hot-close" aria-label="Close" onClick={(e) => { e.stopPropagation(); closeActive(); }} />
              <button className="mos-hot mos-hot-min" aria-label="Minimize" onClick={(e) => { e.stopPropagation(); setActiveApp(null); }} />
              <button className="mos-hot mos-hot-max" aria-label="Zoom" onClick={(e) => { e.stopPropagation(); setMaxed((m) => !m); }} />
            </div>
          ) : (
            <div
              className="mos-termbar"
              onPointerDown={onDragStart}
              onPointerMove={onDragMove}
              onPointerUp={onDragEnd}
              onDoubleClick={() => setMaxed((m) => !m)}
            >
              <span className="mos-lights">
                <button className="mos-light mos-red" aria-label="Close" onClick={(e) => { e.stopPropagation(); closeActive(); }} />
                <button className="mos-light mos-yellow" aria-label="Minimize" onClick={(e) => { e.stopPropagation(); setActiveApp(null); }} />
                <span className="mos-light mos-green" />
              </span>
              <span className="mos-termtitle">{app.title}</span>
            </div>
          )}
          <div className={`mos-body${isTerm ? ' mos-body-term' : ''}`}>
            {/* opened browser apps stay mounted so switching is instant */}
            {openedApps
              .map((id) => APPS.find((a) => a.id === id)!)
              .filter((a) => a.kind === 'browser')
              .map((a) => (
                <iframe
                  key={a.id}
                  src={`${a.src}?embed=1`}
                  title={a.title}
                  style={{ display: a.id === activeApp ? 'block' : 'none' }}
                />
              ))}
            {isTerm && <Terminal metrics={metrics} active={null} reducedMotion={reducedMotion} />}
          </div>
        </section>
      )}

      {/* dock hotspots over the real dock pixels */}
      {DOCK.map((d) => (
        <button
          key={d.id}
          className={`mos-dockhot${debug ? ' mos-dbg' : ''}${d.app ? '' : ' mos-dockhot-dead'}${glowDock === d.id ? ' mos-glow' : ''}`}
          style={{ left: d.cx * SX - 24, width: 48 }}
          onClick={() => d.app && openApp(d.app)}
          aria-label={d.label}
        >
          <span className="mos-tooltip">{d.label}</span>
          {d.app && openedApps.includes(d.app) && <i className="mos-running" />}
        </button>
      ))}

      {/* asleep-at-the-desk overlay: one click wakes/zooms, no accidental app launches */}
      {!interactive && (
        <button className="mos-wake" onClick={onWake} aria-label="Sit down at the monitor" />
      )}

      <style>{`
        .mos { position: absolute; inset: 0; overflow: hidden; opacity: 0; transition: opacity 0.4s ease;
          font-family: -apple-system, 'Helvetica Neue', 'Inter Variable', system-ui, sans-serif;
          background: url('/os/desktop.png'); background-size: 100% 100%; color: #1d1d1f; }
        .mos[data-reduced="true"] { transition: none; }
        .mos-on { opacity: 1; }

        .mos-wake { position: absolute; inset: 0; z-index: 99999; background: none; border: none; cursor: pointer; }

        .mos-clockpatch { position: absolute; top: 0; right: 0; width: ${Math.round(150 * SX)}px; height: ${MENUBAR_H}px;
          background: url('/os/menubar-patch.png'); background-size: auto ${MENUBAR_H}px; z-index: 9000; }
        .mos-liveclock { position: absolute; top: 0; right: ${Math.round(12 * SX)}px; height: ${MENUBAR_H}px; z-index: 9001;
          display: flex; align-items: center; font-size: 10.2px; font-weight: 500; color: #f2f3f7; letter-spacing: 0.01em;
          font-variant-numeric: tabular-nums; }
        .mos-applehot { position: absolute; top: 0; left: 0; width: ${Math.round(46 * SX)}px; height: ${MENUBAR_H}px;
          background: none; border: none; cursor: pointer; z-index: 9001; }

        .mos-win { position: absolute; display: flex; flex-direction: column; border-radius: 9px; overflow: hidden;
          background: #fff; box-shadow: 0 28px 70px rgba(0,0,0,0.45), 0 0 0 0.5px rgba(0,0,0,0.28); }
        .mos-win-term { background: #101216; }

        .mos-chrometop { position: relative; display: flex; height: ${CHROME_H}px; flex: none; user-select: none;
          cursor: grab; touch-action: none; background: #fff; }
        .mos-chromeleft { position: relative; width: ${Math.round(400 * CS)}px; flex: none;
          background: url('/os/chrome-left.png'); background-size: ${Math.round(400 * CS)}px ${CHROME_H}px; }
        .mos-chromemid { flex: 1; background: url('/os/chrome-mid.png'); background-size: 100% ${CHROME_H}px; }
        .mos-chromeright { width: ${Math.round(180 * CS)}px; flex: none;
          background: url('/os/chrome-right.png'); background-size: ${Math.round(180 * CS)}px ${CHROME_H}px; }
        .mos-tabcover { position: absolute; left: ${Math.round(133 * CS)}px; top: ${Math.round(9 * CS)}px;
          width: ${Math.round(200 * CS)}px; height: ${Math.round(23 * CS)}px; background: #ffffff; border-radius: 5px; }
        .mos-tabtitle { position: absolute; left: ${Math.round(140 * CS)}px; top: ${Math.round(11 * CS)}px;
          width: ${Math.round(190 * CS)}px; font-size: 9.6px; line-height: ${Math.round(20 * CS)}px;
          color: #202124; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .mos-urlcover { position: absolute; left: ${Math.round(150 * CS)}px; top: ${Math.round(50 * CS)}px;
          width: ${Math.round(220 * CS)}px; height: ${Math.round(22 * CS)}px; background: #f1f3f4; }
        .mos-urltext { position: absolute; left: ${Math.round(153 * CS)}px; top: ${Math.round(52 * CS)}px;
          font-size: 9.6px; line-height: ${Math.round(18 * CS)}px; color: #202124; white-space: nowrap; }
        .mos-hot { position: absolute; top: ${Math.round(12 * CS)}px; width: ${Math.round(18 * CS)}px; height: ${Math.round(18 * CS)}px;
          border: none; border-radius: 50%; background: transparent; cursor: pointer; padding: 0; }
        .mos-hot-close { left: ${Math.round(11 * CS)}px; }
        .mos-hot-min { left: ${Math.round(35 * CS)}px; }
        .mos-hot-max { left: ${Math.round(59 * CS)}px; }
        .mos-hot:hover { box-shadow: 0 0 0 2px rgba(0,0,0,0.15) inset; }

        .mos-termbar { display: flex; align-items: center; height: 32px; padding: 0 11px; flex: none; gap: 9px;
          background: linear-gradient(180deg, #3a3d45, #2e3138); user-select: none; cursor: grab; touch-action: none; }
        .mos-lights { display: flex; gap: 8px; }
        .mos-light { width: 12px; height: 12px; border-radius: 50%; border: none; padding: 0; }
        .mos-red { background: #ff5f57; cursor: pointer; }
        .mos-yellow { background: #febc2e; cursor: pointer; }
        .mos-green { background: #28c840; }
        .mos-termtitle { flex: 1; text-align: center; font-size: 11px; color: #b9bcc4; margin-right: 48px;
          overflow: hidden; white-space: nowrap; }

        .mos-body { flex: 1; min-height: 0; background: #f8f7f3; position: relative; }
        .mos-body iframe { width: 100%; height: 100%; border: 0; background: #f8f7f3; }
        .mos-body-term { background: #101216; display: flex; }
        .mos-body-term .ds-terminal { width: 100%; height: 100%; }

        .mos-dockhot { position: absolute; bottom: ${Math.round(8 * SY)}px; height: ${Math.round(62 * SY)}px;
          background: none; border: none; cursor: pointer; z-index: 8000; padding: 0; border-radius: 10px; }
        .mos-dockhot-dead { cursor: default; }
        .mos-dbg { outline: 1px dashed #ff4d94; }
        .mos-glow { animation: mos-pulse 0.5s ease 3; }
        @keyframes mos-pulse {
          0%, 100% { background: transparent; }
          50% { background: radial-gradient(circle at 50% 55%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.0) 68%); }
        }
        .mos-tooltip { position: absolute; bottom: ${Math.round(76 * SY)}px; left: 50%; transform: translateX(-50%);
          padding: 3px 10px; border-radius: 6px; background: rgba(28,28,34,0.85); color: #f4f4f6; font-size: 10px;
          white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity 0.15s ease; }
        .mos-dockhot:hover .mos-tooltip { opacity: 1; }
        .mos-running { position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%);
          width: 4px; height: 4px; border-radius: 50%; background: rgba(20,20,24,0.75); }
        .mos[data-reduced="true"] .mos-glow { animation: none; }
      `}</style>
    </div>
  );
}
