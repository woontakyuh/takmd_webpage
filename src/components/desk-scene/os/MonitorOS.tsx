import { useEffect, useRef, useState } from 'react';
import { Terminal } from '../Terminal';
import type { SceneMetrics } from '../types';

// logical screen resolution of the monitor plane (16:9-ish, matches screen mesh aspect)
export const OS_W = 1152;
export const OS_H = 650;

type AppDef = {
  id: string;
  title: string;
  glyph: string;
  tile: string; // dock tile gradient
  kind: 'terminal' | 'iframe';
  src?: string;
};

const APPS: AppDef[] = [
  { id: 'terminal', title: 'Terminal', glyph: '>_', tile: 'linear-gradient(160deg,#3a3f4a,#15171c)', kind: 'terminal' },
  { id: 'cv', title: 'Living CV', glyph: 'CV', tile: 'linear-gradient(160deg,#4da2ff,#1256c9)', kind: 'iframe', src: '/cv' },
  { id: 'ube', title: 'UBE Surgery', glyph: 'SP', tile: 'linear-gradient(160deg,#3fd0b6,#0e8f7a)', kind: 'iframe', src: '/ube' },
  { id: 'research', title: 'Research', glyph: 'RX', tile: 'linear-gradient(160deg,#b48cff,#6a3ad9)', kind: 'iframe', src: '/research' },
  { id: 'ai', title: 'Clinical AI', glyph: 'AI', tile: 'linear-gradient(160deg,#ffb454,#e0740f)', kind: 'iframe', src: '/ai' },
  { id: 'dashboard', title: 'Dashboard', glyph: 'DB', tile: 'linear-gradient(160deg,#63d471,#1f9d43)', kind: 'iframe', src: '/dashboard' },
  { id: 'education', title: 'Education', glyph: 'ED', tile: 'linear-gradient(160deg,#ff8ab3,#d43f6f)', kind: 'iframe', src: '/education' },
  { id: 'contact', title: 'Contact', glyph: '@', tile: 'linear-gradient(160deg,#9aa4b2,#5c6570)', kind: 'iframe', src: '/contact' },
];

type Win = { appId: string; x: number; y: number; w: number; h: number; z: number; maxed: boolean };

let zCounter = 10;

const MENUBAR_H = 26;
const DEFAULT_W = 860;
const DEFAULT_H = 520;

export function MonitorOS({
  metrics,
  onExit,
  reducedMotion,
  launchApp,
}: {
  metrics: SceneMetrics;
  onExit: () => void;
  reducedMotion: boolean;
  launchApp?: { id: string; seq: number } | null;
}) {
  const [wins, setWins] = useState<Win[]>([
    { appId: 'terminal', x: 246, y: 96, w: 660, h: 420, z: ++zCounter, maxed: false },
  ]);
  const [visible, setVisible] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ appId: string; dx: number; dy: number; scale: number; left: number; top: number } | null>(null);
  const [clock, setClock] = useState(() => new Date());

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    const id = window.setInterval(() => setClock(new Date()), 1000);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onExit();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(id);
      window.removeEventListener('keydown', onKey);
    };
  }, [onExit]);

  // desk objects request their app here (spine → ube, journals → cv, …)
  useEffect(() => {
    if (launchApp && APPS.some((a) => a.id === launchApp.id)) openApp(launchApp.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [launchApp?.seq]);

  const openApp = (appId: string) => {
    setWins((prev) => {
      const existing = prev.find((w) => w.appId === appId);
      if (existing) return prev.map((w) => (w.appId === appId ? { ...w, z: ++zCounter } : w));
      const n = prev.length;
      const isWide = appId !== 'terminal';
      const w = isWide ? DEFAULT_W : 660;
      const h = isWide ? DEFAULT_H : 420;
      return [
        ...prev,
        {
          appId,
          x: Math.max(16, Math.min((OS_W - w) / 2 + n * 24, OS_W - w - 16)),
          y: Math.max(MENUBAR_H + 12, Math.min(56 + n * 20, OS_H - 160)),
          w,
          h,
          z: ++zCounter,
          maxed: false,
        },
      ];
    });
  };

  const closeApp = (appId: string) => setWins((prev) => prev.filter((w) => w.appId !== appId));
  const focusApp = (appId: string) =>
    setWins((prev) => prev.map((w) => (w.appId === appId ? { ...w, z: ++zCounter } : w)));
  const toggleMax = (appId: string) =>
    setWins((prev) => prev.map((w) => (w.appId === appId ? { ...w, maxed: !w.maxed, z: ++zCounter } : w)));

  const onDragStart = (e: React.PointerEvent, win: Win) => {
    if (win.maxed) return;
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scale = rect.width / OS_W;
    const p = { x: (e.clientX - rect.left) / scale, y: (e.clientY - rect.top) / scale };
    dragRef.current = { appId: win.appId, dx: p.x - win.x, dy: p.y - win.y, scale, left: rect.left, top: rect.top };
    focusApp(win.appId);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onDragMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const p = { x: (e.clientX - d.left) / d.scale, y: (e.clientY - d.top) / d.scale };
    setWins((prev) =>
      prev.map((w) =>
        w.appId === d.appId
          ? {
              ...w,
              x: Math.min(OS_W - 120, Math.max(-w.w + 120, p.x - d.dx)),
              y: Math.min(OS_H - 60, Math.max(MENUBAR_H, p.y - d.dy)),
            }
          : w,
      ),
    );
  };
  const onDragEnd = () => (dragRef.current = null);

  const topWin = wins.reduce<Win | null>((a, w) => (a === null || w.z > a.z ? w : a), null);
  const topApp = topWin ? APPS.find((a) => a.id === topWin.appId) : null;
  const timeStr = clock.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
  const dateStr = clock.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div ref={rootRef} className={`mos ${visible ? 'mos-on' : ''}`} data-reduced={reducedMotion}>
      {/* menu bar */}
      <header className="mos-bar">
        <span className="mos-logo">Tak</span>
        <span className="mos-appname">{topApp ? topApp.title : 'Finder'}</span>
        {['File', 'Edit', 'View', 'Go', 'Window', 'Help'].map((m) => (
          <span key={m} className="mos-menu">{m}</span>
        ))}
        <span className="mos-flex" />
        <button className="mos-status mos-exit" onClick={onExit} title="Back to desk (Esc)">⏻ desk</button>
        <span className="mos-status">{dateStr}</span>
        <span className="mos-status">{timeStr}</span>
      </header>

      {/* windows */}
      {wins.map((win) => {
        const app = APPS.find((a) => a.id === win.appId)!;
        const style = win.maxed
          ? { left: 0, top: MENUBAR_H, width: OS_W, height: OS_H - MENUBAR_H, zIndex: win.z }
          : { left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.z };
        return (
          <section key={win.appId} className={`mos-win${win.maxed ? ' mos-win-max' : ''}`} style={style} onPointerDown={() => focusApp(win.appId)}>
            <div
              className="mos-titlebar"
              onPointerDown={(e) => onDragStart(e, win)}
              onPointerMove={onDragMove}
              onPointerUp={onDragEnd}
              onDoubleClick={() => toggleMax(win.appId)}
            >
              <span className="mos-lights">
                <button className="mos-light mos-red" aria-label="Close" onClick={(e) => { e.stopPropagation(); closeApp(win.appId); }} />
                <button className="mos-light mos-yellow" aria-label="Minimize" onClick={(e) => { e.stopPropagation(); closeApp(win.appId); }} />
                <button className="mos-light mos-green" aria-label="Zoom" onClick={(e) => { e.stopPropagation(); toggleMax(win.appId); }} />
              </span>
              <span className="mos-title">{app.title}</span>
            </div>
            <div className={`mos-content${app.kind === 'terminal' ? ' mos-content-term' : ''}`}>
              {app.kind === 'terminal' ? (
                <Terminal metrics={metrics} active={null} reducedMotion={reducedMotion} />
              ) : (
                <iframe src={`${app.src}?embed=1`} title={app.title} loading="lazy" />
              )}
            </div>
          </section>
        );
      })}

      {/* dock */}
      <nav className="mos-dock" aria-label="Dock">
        {APPS.map((app) => (
          <button key={app.id} className="mos-dockicon" onClick={() => openApp(app.id)}>
            <span className="mos-tile" style={{ background: app.tile }}>{app.glyph}</span>
            <span className="mos-tooltip">{app.title}</span>
            {wins.some((w) => w.appId === app.id) && <i className="mos-running" />}
          </button>
        ))}
      </nav>

      <style>{`
        .mos { position: absolute; inset: 0; overflow: hidden; opacity: 0; transition: opacity 0.4s ease;
          font-family: -apple-system, 'Inter Variable', 'Helvetica Neue', system-ui, sans-serif;
          background:
            radial-gradient(120% 90% at 15% 0%, #5a4a9c 0%, transparent 55%),
            radial-gradient(110% 90% at 90% 8%, #b0567a 0%, transparent 50%),
            radial-gradient(130% 110% at 50% 105%, #e08b4e 0%, transparent 58%),
            linear-gradient(175deg, #232a55 0%, #43356e 45%, #8a4a63 100%);
          color: #f2f2f5; }
        .mos[data-reduced="true"] { transition: none; }
        .mos-on { opacity: 1; }

        .mos-bar { position: absolute; top: 0; left: 0; right: 0; height: ${MENUBAR_H}px; z-index: 9000;
          display: flex; align-items: center; gap: 16px; padding: 0 12px;
          background: rgba(24, 24, 32, 0.45); backdrop-filter: blur(22px);
          font-size: 12.5px; color: rgba(255,255,255,0.92); }
        .mos-logo { font-weight: 800; letter-spacing: -0.02em; }
        .mos-appname { font-weight: 700; }
        .mos-menu { opacity: 0.85; }
        .mos-flex { flex: 1; }
        .mos-status { opacity: 0.9; font-variant-numeric: tabular-nums; }
        .mos-exit { background: none; border: none; color: #ffd9a0; font: inherit; cursor: pointer; padding: 0; }
        .mos-exit:hover { color: #fff; }

        .mos-win { position: absolute; display: flex; flex-direction: column;
          border-radius: 11px; overflow: hidden; background: #1e2127;
          box-shadow: 0 28px 70px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(255,255,255,0.22);
          transition: width 0.18s ease, height 0.18s ease; }
        .mos-win-max { border-radius: 0; }
        .mos-titlebar { display: flex; align-items: center; height: 34px; padding: 0 12px; flex: none;
          background: linear-gradient(180deg, #33363e, #2b2e35); user-select: none; cursor: grab; touch-action: none; }
        .mos-lights { display: flex; gap: 8px; }
        .mos-light { width: 12px; height: 12px; border-radius: 50%; border: none; padding: 0; cursor: pointer; }
        .mos-red { background: #ff5f57; }
        .mos-yellow { background: #febc2e; }
        .mos-green { background: #28c840; }
        .mos-title { flex: 1; text-align: center; font-size: 13px; font-weight: 600; color: #b9bcc4;
          margin-right: 52px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
        .mos-content { flex: 1; min-height: 0; background: #fff; }
        .mos-content iframe { width: 100%; height: 100%; border: 0; display: block; background: #f8f7f3; }
        .mos-content-term { background: #101216; display: flex; }
        .mos-content-term .ds-terminal { width: 100%; height: 100%; }

        .mos-dock { position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); z-index: 8000;
          display: flex; align-items: flex-end; gap: 9px; padding: 8px 12px; border-radius: 20px;
          background: rgba(28, 28, 38, 0.42); backdrop-filter: blur(24px);
          box-shadow: inset 0 0 0 0.5px rgba(255,255,255,0.25), 0 12px 30px rgba(0,0,0,0.35); }
        .mos-dockicon { position: relative; background: none; border: none; padding: 0; cursor: pointer; }
        .mos-tile { display: flex; align-items: center; justify-content: center; width: 46px; height: 46px;
          border-radius: 12px; font-size: 15px; font-weight: 800; color: rgba(255,255,255,0.95);
          letter-spacing: -0.02em; box-shadow: inset 0 1px 0 rgba(255,255,255,0.35), 0 4px 10px rgba(0,0,0,0.3);
          transition: transform 0.16s ease; }
        .mos-dockicon:hover .mos-tile { transform: translateY(-10px) scale(1.22); }
        .mos-tooltip { position: absolute; bottom: 64px; left: 50%; transform: translateX(-50%);
          padding: 3px 9px; border-radius: 6px; background: rgba(24,24,32,0.85); font-size: 11.5px;
          white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity 0.15s ease; }
        .mos-dockicon:hover .mos-tooltip { opacity: 1; }
        .mos-running { position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%);
          width: 4px; height: 4px; border-radius: 50%; background: rgba(255,255,255,0.9); }
        .mos[data-reduced="true"] .mos-tile, .mos[data-reduced="true"] .mos-win { transition: none; }
      `}</style>
    </div>
  );
}
