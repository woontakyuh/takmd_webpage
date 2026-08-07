import { useEffect, useRef, useState } from 'react';
import { ACCENT } from '../config';
import { Terminal } from '../Terminal';
import type { SceneMetrics } from '../types';

export type OsSkin = 'tak' | 'mac';

type AppDef = {
  id: string;
  title: string;
  icon: string;
  kind: 'terminal' | 'iframe';
  src?: string;
};

const APPS: AppDef[] = [
  { id: 'terminal', title: 'Terminal', icon: '>_', kind: 'terminal' },
  { id: 'cv', title: 'Living CV', icon: 'CV', kind: 'iframe', src: '/cv' },
  { id: 'ube', title: 'UBE', icon: 'SP', kind: 'iframe', src: '/ube' },
  { id: 'research', title: 'Research', icon: 'RX', kind: 'iframe', src: '/research' },
  { id: 'ai', title: 'Clinical AI', icon: 'AI', kind: 'iframe', src: '/ai' },
  { id: 'dashboard', title: 'Surgery Dashboard', icon: 'DB', kind: 'iframe', src: '/dashboard' },
  { id: 'education', title: 'Education', icon: 'ED', kind: 'iframe', src: '/education' },
  { id: 'contact', title: 'Contact', icon: '@', kind: 'iframe', src: '/contact' },
];

type Win = { appId: string; x: number; y: number; w: number; h: number; z: number };

let zCounter = 10;

// logical screen resolution — must match OS_W/OS_H in Scene.tsx
const ROOT_W = 1280;
const ROOT_H = 722;

export function MonitorOS({
  metrics,
  skin,
  onSkinChange,
  onExit,
  reducedMotion,
  launchApp,
}: {
  metrics: SceneMetrics;
  skin: OsSkin;
  onSkinChange: (skin: OsSkin) => void;
  onExit: () => void;
  reducedMotion: boolean;
  launchApp?: { id: string; seq: number } | null;
}) {
  const [wins, setWins] = useState<Win[]>([
    { appId: 'terminal', x: 60, y: 70, w: 660, h: 420, z: ++zCounter },
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
      return [
        ...prev,
        {
          appId,
          x: Math.min(90 + n * 34, ROOT_W - 700),
          y: Math.min(50 + n * 26, 160),
          w: isWide ? 920 : 660,
          h: isWide ? 560 : 420,
          z: ++zCounter,
        },
      ];
    });
  };

  const closeApp = (appId: string) => setWins((prev) => prev.filter((w) => w.appId !== appId));
  const focusApp = (appId: string) =>
    setWins((prev) => prev.map((w) => (w.appId === appId ? { ...w, z: ++zCounter } : w)));

  // the OS lives inside a CSS3D-transformed plane — convert viewport px to local px
  const localPoint = (e: React.PointerEvent, d: { scale: number; left: number; top: number }) => ({
    x: (e.clientX - d.left) / d.scale,
    y: (e.clientY - d.top) / d.scale,
  });

  const onDragStart = (e: React.PointerEvent, win: Win) => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scale = rect.width / ROOT_W;
    const p = { x: (e.clientX - rect.left) / scale, y: (e.clientY - rect.top) / scale };
    dragRef.current = { appId: win.appId, dx: p.x - win.x, dy: p.y - win.y, scale, left: rect.left, top: rect.top };
    focusApp(win.appId);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onDragMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const p = localPoint(e, d);
    setWins((prev) =>
      prev.map((w) =>
        w.appId === d.appId
          ? {
              ...w,
              x: Math.min(ROOT_W - 140, Math.max(-w.w + 140, p.x - d.dx)),
              y: Math.min(ROOT_H - 80, Math.max(30, p.y - d.dy)),
            }
          : w,
      ),
    );
  };
  const onDragEnd = () => (dragRef.current = null);

  const timeStr = clock.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
  const dateStr = clock.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const mac = skin === 'mac';

  return (
    <div ref={rootRef} className={`os-root ${mac ? 'os-mac' : 'os-tak'} ${visible ? 'os-on' : ''}`} data-reduced={reducedMotion}>
      {/* top bar */}
      <header className="os-bar">
        {mac ? (
          <>
            <span className="os-menu os-strong"></span>
            <span className="os-menu os-strong">TakOS</span>
            <span className="os-menu">File</span>
            <span className="os-menu">Edit</span>
            <span className="os-menu">View</span>
            <span className="os-spacer" />
            <button className="os-menu os-btn" onClick={() => onSkinChange(mac ? 'tak' : 'mac')}>
              skin: {skin} ⇄
            </button>
            <span className="os-menu">{dateStr}</span>
            <span className="os-menu">{timeStr}</span>
            <button className="os-menu os-btn" onClick={onExit} title="Back to desk (Esc)">⏏ desk</button>
          </>
        ) : (
          <>
            <span className="os-menu os-strong">tak@desk</span>
            <span className="os-menu os-dim">— TakOS 0.2</span>
            <span className="os-spacer" />
            <button className="os-menu os-btn" onClick={() => onSkinChange(mac ? 'tak' : 'mac')}>
              [skin:{skin}]
            </button>
            <span className="os-menu">{timeStr}</span>
            <button className="os-menu os-btn" onClick={onExit} title="Back to desk (Esc)">[exit → desk]</button>
          </>
        )}
      </header>

      {/* windows */}
      {wins.map((win) => {
        const app = APPS.find((a) => a.id === win.appId)!;
        return (
          <section
            key={win.appId}
            className="os-win"
            style={{ left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.z }}
            onPointerDown={() => focusApp(win.appId)}
          >
            <div
              className="os-titlebar"
              onPointerDown={(e) => onDragStart(e, win)}
              onPointerMove={onDragMove}
              onPointerUp={onDragEnd}
            >
              {mac ? (
                <>
                  <span className="os-lights">
                    <button className="os-light os-red" onClick={() => closeApp(win.appId)} />
                    <span className="os-light os-yellow" />
                    <span className="os-light os-green" />
                  </span>
                  <span className="os-title">{app.title}</span>
                </>
              ) : (
                <>
                  <span className="os-title">┌ {app.title.toLowerCase()}</span>
                  <button className="os-x" onClick={() => closeApp(win.appId)}>[x]</button>
                </>
              )}
            </div>
            <div className="os-content">
              {app.kind === 'terminal' ? (
                <div className="os-term-wrap">
                  <Terminal metrics={metrics} active={null} reducedMotion={reducedMotion} />
                </div>
              ) : (
                <iframe src={app.src} title={app.title} loading="lazy" />
              )}
            </div>
          </section>
        );
      })}

      {/* dock / launcher */}
      <nav className={mac ? 'os-dock' : 'os-cmdbar'}>
        {APPS.map((app) => (
          <button key={app.id} className="os-appicon" onClick={() => openApp(app.id)} title={app.title}>
            <span className="os-appglyph">{app.icon}</span>
            {!mac && <span className="os-applabel">{app.title.toLowerCase()}</span>}
            {wins.some((w) => w.appId === app.id) && <i className="os-running" />}
          </button>
        ))}
      </nav>

      <style>{`
        .os-root { position: absolute; inset: 0; opacity: 0; transition: opacity 0.35s ease; overflow: hidden;
          font-family: ${'"'}JetBrains Mono Variable${'"'}, ui-monospace, monospace; }
        .os-root[data-reduced="true"] { transition: none; }
        .os-on { opacity: 1; }
        .os-tak { background: radial-gradient(120% 130% at 50% 10%, #1a1e26 0%, #101216 62%, #0b0d11 100%); color: #d6d2c8; }
        .os-mac { background: linear-gradient(160deg, #2e3f52 0%, #4a5a70 45%, #77685e 100%); color: #f2f2f5;
          font-family: -apple-system, 'Inter Variable', system-ui, sans-serif; }

        .os-bar { position: absolute; top: 0; left: 0; right: 0; display: flex; align-items: center; gap: 14px;
          padding: 5px 14px; font-size: 13px; z-index: 5000; }
        .os-tak .os-bar { background: #14171d; border-bottom: 1px solid #262b34; color: #9aa0a8; }
        .os-mac .os-bar { background: rgba(20, 22, 28, 0.55); backdrop-filter: blur(14px); color: #e8e8ec; }
        .os-menu { white-space: nowrap; }
        .os-strong { font-weight: 600; color: inherit; }
        .os-dim { opacity: 0.5; }
        .os-spacer { flex: 1; }
        .os-btn { background: none; border: none; color: ${ACCENT}; cursor: pointer; font: inherit; padding: 0; }
        .os-btn:hover { text-decoration: underline; }

        .os-win { position: absolute; display: flex; flex-direction: column; min-width: 320px; min-height: 200px;
          box-shadow: 0 24px 60px rgba(0,0,0,0.45); }
        .os-tak .os-win { background: #14171d; border: 1px solid #3a4150; border-radius: 6px; }
        .os-mac .os-win { background: #1e2127; border-radius: 12px; overflow: hidden;
          border: 1px solid rgba(255,255,255,0.14); }
        .os-titlebar { display: flex; align-items: center; gap: 10px; user-select: none; cursor: grab; touch-action: none; }
        .os-tak .os-titlebar { padding: 6px 10px; font-size: 12px; color: ${ACCENT}; border-bottom: 1px solid #262b34; }
        .os-mac .os-titlebar { padding: 9px 12px; font-size: 13px; background: rgba(255,255,255,0.07); }
        .os-title { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .os-mac .os-title { text-align: center; margin-right: 52px; color: #cfcfd6; }
        .os-x { margin-left: auto; background: none; border: none; color: #8a7f6a; cursor: pointer; font: inherit; }
        .os-x:hover { color: #ff7a68; }
        .os-lights { display: flex; gap: 7px; }
        .os-light { width: 12px; height: 12px; border-radius: 50%; border: none; padding: 0; display: inline-block; }
        .os-red { background: #ff5f57; cursor: pointer; }
        .os-yellow { background: #febc2e; }
        .os-green { background: #28c840; }
        .os-content { flex: 1; min-height: 0; background: #101216; }
        .os-mac .os-content { background: #14161c; }
        .os-content iframe { width: 100%; height: 100%; border: 0; background: #fff; }
        .os-term-wrap { height: 100%; overflow: auto; display: flex; }
        .os-term-wrap .ds-terminal { width: 100%; height: 100%; }

        .os-dock { position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%);
          display: flex; gap: 10px; padding: 10px 14px; border-radius: 18px;
          background: rgba(20, 22, 28, 0.5); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.16); }
        .os-mac .os-appicon { width: 52px; height: 52px; border-radius: 13px; border: none; cursor: pointer;
          background: linear-gradient(160deg, #3c4454, #262c38); color: #e8e8ec; font-weight: 600; font-size: 15px;
          position: relative; transition: transform 0.15s ease; }
        .os-mac .os-appicon:hover { transform: translateY(-8px) scale(1.12); }
        .os-mac .os-running { position: absolute; bottom: -7px; left: 50%; transform: translateX(-50%);
          width: 4px; height: 4px; border-radius: 50%; background: #e8e8ec; }

        .os-cmdbar { position: absolute; bottom: 0; left: 0; right: 0; display: flex; gap: 4px; padding: 6px 10px;
          background: #14171d; border-top: 1px solid #262b34; overflow-x: auto; }
        .os-tak .os-appicon { display: flex; align-items: center; gap: 7px; background: none; cursor: pointer;
          border: 1px solid #2c3340; border-radius: 4px; color: #9aa0a8; font: inherit; font-size: 12px; padding: 5px 10px;
          position: relative; }
        .os-tak .os-appicon:hover { color: ${ACCENT}; border-color: ${ACCENT}; }
        .os-tak .os-appglyph { color: ${ACCENT}; font-weight: 600; }
        .os-tak .os-running { width: 5px; height: 5px; border-radius: 50%; background: ${ACCENT}; }
      `}</style>
    </div>
  );
}
