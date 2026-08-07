import { useEffect, useRef, useState } from 'react';
import { Terminal } from '../Terminal';
import type { SceneMetrics } from '../types';

// logical screen resolution of the monitor plane.
// desktop.png (1920x1080 capture) is stretched to fill; capture→logical factor = 0.6
export const OS_W = 1152;
export const OS_H = 650;
const SX = OS_W / 1920;
const SY = OS_H / 1080;

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

// dock hotspots over the real dock in desktop.png (capture px, center x / width 54, y 1009..1063)
const DOCK: { id: string; label: string; cx: number; app?: string }[] = [
  { id: 'finder', label: 'Finder', cx: 610 },
  { id: 'mail', label: 'Mail — Contact', cx: 671, app: 'contact' },
  { id: 'safari', label: 'takmd.com — UBE', cx: 733, app: 'ube' },
  { id: 'calendar', label: 'Calendar — Education', cx: 793, app: 'education' },
  { id: 'notion', label: 'Notion — Living CV', cx: 855, app: 'cv' },
  { id: 'mail2', label: 'Research', cx: 915, app: 'research' },
  { id: 'terminal', label: 'Terminal', cx: 976, app: 'terminal' },
  { id: 'launchpad', label: 'Clinical AI', cx: 1037, app: 'ai' },
  { id: 'settings', label: 'Surgery Dashboard', cx: 1098, app: 'dashboard' },
  { id: 'folder-a', label: 'Media', cx: 1187, app: 'media' },
  { id: 'folder-b', label: 'Downloads', cx: 1248 },
  { id: 'trash', label: 'Trash', cx: 1310 },
];

type Win = { appId: string; x: number; y: number; w: number; h: number; z: number; maxed: boolean };

let zCounter = 10;

const MENUBAR_H = Math.round(30 * SY); // ~17
const CHROME_H = Math.round(85 * 0.6); // 51 — chrome slices are 1x, shown at 0.6
const DEFAULT_W = 880;
const DEFAULT_H = 540;

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
    { appId: 'terminal', x: 246, y: 80, w: 640, h: 400, z: ++zCounter, maxed: false },
  ]);
  const [visible, setVisible] = useState(false);
  const [debug] = useState(() => typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('dbg'));
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
      const w = isWide ? DEFAULT_W : 640;
      const h = isWide ? DEFAULT_H : 400;
      return [
        ...prev,
        {
          appId,
          x: Math.max(12, Math.min((OS_W - w) / 2 + n * 26, OS_W - w - 12)),
          y: Math.max(MENUBAR_H + 8, Math.min(44 + n * 22, OS_H - 140)),
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

      {/* windows */}
      {wins.map((win) => {
        const app = APPS.find((a) => a.id === win.appId)!;
        const style = win.maxed
          ? { left: 0, top: MENUBAR_H, width: OS_W, height: OS_H - MENUBAR_H, zIndex: win.z }
          : { left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.z };
        return (
          <section
            key={win.appId}
            className={`mos-win${app.kind === 'terminal' ? ' mos-win-term' : ''}`}
            style={style}
            onPointerDown={() => focusApp(win.appId)}
          >
            {app.kind === 'browser' ? (
              <div
                className="mos-chrometop"
                onPointerDown={(e) => onDragStart(e, win)}
                onPointerMove={onDragMove}
                onPointerUp={onDragEnd}
                onDoubleClick={() => toggleMax(win.appId)}
              >
                <div className="mos-chromeleft">
                  {/* cover the captured tab/url text, then draw live text */}
                  <span className="mos-tabcover" />
                  <span className="mos-tabtitle">{app.title}</span>
                  <span className="mos-urlcover" />
                  <span className="mos-urltext">takmd.com{app.src}</span>
                </div>
                <div className="mos-chromemid" />
                <div className="mos-chromeright" />
                <button className="mos-hot mos-hot-close" aria-label="Close" onClick={(e) => { e.stopPropagation(); closeApp(win.appId); }} />
                <button className="mos-hot mos-hot-min" aria-label="Minimize" onClick={(e) => { e.stopPropagation(); closeApp(win.appId); }} />
                <button className="mos-hot mos-hot-max" aria-label="Zoom" onClick={(e) => { e.stopPropagation(); toggleMax(win.appId); }} />
              </div>
            ) : (
              <div
                className="mos-termbar"
                onPointerDown={(e) => onDragStart(e, win)}
                onPointerMove={onDragMove}
                onPointerUp={onDragEnd}
                onDoubleClick={() => toggleMax(win.appId)}
              >
                <span className="mos-lights">
                  <button className="mos-light mos-red" aria-label="Close" onClick={(e) => { e.stopPropagation(); closeApp(win.appId); }} />
                  <span className="mos-light mos-yellow" />
                  <span className="mos-light mos-green" />
                </span>
                <span className="mos-termtitle">{app.title}</span>
              </div>
            )}
            <div className={`mos-body${app.kind === 'terminal' ? ' mos-body-term' : ''}`}>
              {app.kind === 'terminal' ? (
                <Terminal metrics={metrics} active={null} reducedMotion={reducedMotion} />
              ) : (
                <iframe src={`${app.src}?embed=1`} title={app.title} loading="lazy" />
              )}
            </div>
          </section>
        );
      })}

      {/* dock hotspots over the real dock pixels */}
      {DOCK.map((d) => (
        <button
          key={d.id}
          className={`mos-dockhot${debug ? ' mos-dbg' : ''}${d.app ? '' : ' mos-dockhot-dead'}`}
          style={{ left: d.cx * SX - 19, width: 38 }}
          onClick={() => d.app && openApp(d.app)}
          aria-label={d.label}
        >
          <span className="mos-tooltip">{d.label}</span>
          {d.app && wins.some((w) => w.appId === d.app) && <i className="mos-running" />}
        </button>
      ))}

      <style>{`
        .mos { position: absolute; inset: 0; overflow: hidden; opacity: 0; transition: opacity 0.4s ease;
          font-family: -apple-system, 'Helvetica Neue', 'Inter Variable', system-ui, sans-serif;
          background: url('/os/desktop.png'); background-size: 100% 100%; color: #1d1d1f; }
        .mos[data-reduced="true"] { transition: none; }
        .mos-on { opacity: 1; }

        .mos-clockpatch { position: absolute; top: 0; right: 0; width: ${Math.round(150 * SX)}px; height: ${MENUBAR_H}px;
          background: url('/os/menubar-patch.png'); background-size: auto ${MENUBAR_H}px; z-index: 9000; }
        .mos-liveclock { position: absolute; top: 0; right: ${Math.round(10 * SX)}px; height: ${MENUBAR_H}px; z-index: 9001;
          display: flex; align-items: center; font-size: 8.2px; font-weight: 500; color: #f2f3f7; letter-spacing: 0.01em;
          font-variant-numeric: tabular-nums; }
        .mos-applehot { position: absolute; top: 0; left: 0; width: ${Math.round(46 * SX)}px; height: ${MENUBAR_H}px;
          background: none; border: none; cursor: pointer; z-index: 9001; }

        .mos-win { position: absolute; display: flex; flex-direction: column; border-radius: 7px; overflow: hidden;
          background: #fff; box-shadow: 0 22px 60px rgba(0,0,0,0.45), 0 0 0 0.5px rgba(0,0,0,0.28); }
        .mos-win-term { background: #101216; }

        .mos-chrometop { position: relative; display: flex; height: ${CHROME_H}px; flex: none; user-select: none;
          cursor: grab; touch-action: none; background: #fff; }
        .mos-chromeleft { position: relative; width: 240px; flex: none;
          background: url('/os/chrome-left.png'); background-size: 240px ${CHROME_H}px; }
        .mos-chromemid { flex: 1; background: url('/os/chrome-mid.png'); background-size: 100% ${CHROME_H}px; }
        .mos-chromeright { width: 108px; flex: none;
          background: url('/os/chrome-right.png'); background-size: 108px ${CHROME_H}px; }
        /* cover the baked-in "Google" tab text + "google.com" url, then live text */
        .mos-tabcover { position: absolute; left: 80px; top: 5px; width: 118px; height: 14px; background: #ffffff; border-radius: 4px; }
        .mos-tabtitle { position: absolute; left: 85px; top: 6px; width: 110px; font-size: 7.6px; line-height: 12px;
          color: #202124; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .mos-urlcover { position: absolute; left: 90px; top: 30px; width: 130px; height: 13px; background: #f1f3f4; }
        .mos-urltext { position: absolute; left: 92px; top: 31px; font-size: 7.6px; line-height: 11px; color: #202124; white-space: nowrap; }
        .mos-hot { position: absolute; top: 6px; width: 11px; height: 11px; border: none; border-radius: 50%;
          background: transparent; cursor: pointer; padding: 0; }
        .mos-hot-close { left: 7px; }
        .mos-hot-min { left: 21px; }
        .mos-hot-max { left: 35px; }
        .mos-hot:hover { box-shadow: 0 0 0 1.5px rgba(0,0,0,0.18) inset; }

        .mos-termbar { display: flex; align-items: center; height: 26px; padding: 0 9px; flex: none; gap: 8px;
          background: linear-gradient(180deg, #3a3d45, #2e3138); user-select: none; cursor: grab; touch-action: none; }
        .mos-lights { display: flex; gap: 6px; }
        .mos-light { width: 10px; height: 10px; border-radius: 50%; border: none; padding: 0; }
        .mos-red { background: #ff5f57; cursor: pointer; }
        .mos-yellow { background: #febc2e; }
        .mos-green { background: #28c840; }
        .mos-termtitle { flex: 1; text-align: center; font-size: 8.4px; color: #b9bcc4; margin-right: 40px;
          overflow: hidden; white-space: nowrap; }

        .mos-body { flex: 1; min-height: 0; background: #f8f7f3; }
        .mos-body iframe { width: 100%; height: 100%; border: 0; display: block; background: #f8f7f3; }
        .mos-body-term { background: #101216; display: flex; }
        .mos-body-term .ds-terminal { width: 100%; height: 100%; }

        .mos-dockhot { position: absolute; bottom: ${Math.round(8 * SY)}px; height: ${Math.round(62 * SY)}px;
          background: none; border: none; cursor: pointer; z-index: 8000; padding: 0; }
        .mos-dockhot-dead { cursor: default; }
        .mos-dbg { outline: 1px dashed #ff4d94; }
        .mos-tooltip { position: absolute; bottom: ${Math.round(74 * SY)}px; left: 50%; transform: translateX(-50%);
          padding: 2.5px 8px; border-radius: 5px; background: rgba(28,28,34,0.85); color: #f4f4f6; font-size: 7.6px;
          white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity 0.15s ease; }
        .mos-dockhot:hover .mos-tooltip { opacity: 1; }
        .mos-running { position: absolute; bottom: -5px; left: 50%; transform: translateX(-50%);
          width: 3.5px; height: 3.5px; border-radius: 50%; background: rgba(20,20,24,0.75); }
      `}</style>
    </div>
  );
}
