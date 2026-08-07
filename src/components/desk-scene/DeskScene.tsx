import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { ACCENT, deskObjects } from './config';
import { Scene } from './Scene';
import type { DeskObject, SceneMetrics } from './types';

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

function StaticFallback() {
  return (
    <section className="ds-fallback">
      <p className="ds-fallback-eyebrow">Woon Tak Yuh, MD</p>
      <h1>Spine surgeon, educator, clinical AI builder.</h1>
      <p>This device cannot render the interactive desk — the sections are all here:</p>
      <ul>
        {deskObjects
          .filter((o) => o.route)
          .map((o) => (
            <li key={o.id}>
              <a href={o.route}>{o.label}</a>
            </li>
          ))}
        <li>
          <a href="/cv">Living CV</a>
        </li>
      </ul>
    </section>
  );
}

export default function DeskScene({ metrics }: { metrics: SceneMetrics }) {
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [launchApp, setLaunchApp] = useState<{ id: string; seq: number } | null>(null);
  const [screenFocus, setScreenFocus] = useState(false);
  const [osOpen, setOsOpen] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 768px), (pointer: coarse)').matches;
  }, []);

  useEffect(() => {
    setWebgl(supportsWebGL());
  }, []);

  const focusScreen = () => {
    if (screenFocus) return;
    setHoveredId(null);
    setScreenFocus(true);
  };

  const exitScreen = () => {
    setOsOpen(false);
    setScreenFocus(false);
  };

  // full diegetic: objects don't navigate — they open their app on the monitor
  const activate = (object: DeskObject) => {
    if (!object.app) return; // functional objects (clock) do nothing on click
    setLaunchApp((prev) => ({ id: object.app!, seq: (prev?.seq ?? 0) + 1 }));
    focusScreen();
  };

  if (webgl === null) return <div className="ds-shell" aria-hidden="true" />;
  if (!webgl) return <StaticFallback />;

  return (
    <div className="ds-shell">
      <Canvas
        shadows
        dpr={isMobile ? 1 : [1, 2]}
        camera={{ fov: 48, near: 0.1, far: 30, position: [0, 1.15, 1.02] }}
        gl={{ antialias: true }}
      >
        <Suspense fallback={null}>
          <Scene
            metrics={metrics}
            hoveredId={hoveredId}
            onHover={(id) => !screenFocus && setHoveredId(id)}
            onActivate={activate}
            launchApp={launchApp}
            screenFocus={screenFocus}
            onScreenZoomed={() => setOsOpen(true)}
            onMonitorClick={focusScreen}
            osActive={osOpen}
            onOsExit={exitScreen}
            reducedMotion={reducedMotion}
            parallax={!isMobile && !screenFocus}
            effects={!isMobile}
          />
        </Suspense>
      </Canvas>

      {/* keyboard / screen-reader navigation mirroring the 3D objects */}
      <nav className="ds-a11y-nav" aria-label="Desk sections" hidden={screenFocus}>
        <ul>
          <li>
            <button
              type="button"
              aria-label="Monitor — open TakOS full screen"
              onFocus={() => setHoveredId('monitor')}
              onBlur={() => setHoveredId((current) => (current === 'monitor' ? null : current))}
              onMouseEnter={() => setHoveredId('monitor')}
              onMouseLeave={() => setHoveredId((current) => (current === 'monitor' ? null : current))}
              onClick={focusScreen}
            >
              monitor
            </button>
          </li>
          {deskObjects.map((object) => (
            <li key={object.id}>
              <button
                type="button"
                aria-label={object.label}
                onFocus={() => setHoveredId(object.id)}
                onBlur={() => setHoveredId((current) => (current === object.id ? null : current))}
                onMouseEnter={() => setHoveredId(object.id)}
                onMouseLeave={() => setHoveredId((current) => (current === object.id ? null : current))}
                onClick={() => activate(object)}
              >
                {object.id}
              </button>
            </li>
          ))}
        </ul>
      </nav>


      <style>{`
        .ds-shell { position: relative; width: 100%; height: 100vh; height: 100dvh; background: #0d1018; overflow: hidden; }
        .ds-shell canvas { touch-action: none; }
        .ds-fade {
          position: absolute; inset: 0; background: #0b0d12; opacity: 0; pointer-events: none;
          transition: opacity 0.35s ease;
        }
        .ds-fade-on { opacity: 1; }
        .ds-a11y-nav {
          position: absolute; bottom: 14px; left: 50%; transform: translateX(-50%);
          display: flex; gap: 4px;
        }
        .ds-a11y-nav ul { display: flex; gap: 6px; list-style: none; margin: 0; padding: 0; }
        .ds-a11y-nav button {
          font-family: 'JetBrains Mono Variable', ui-monospace, monospace;
          font-size: 11px; letter-spacing: 0.04em;
          color: rgba(230, 224, 210, 0.4);
          background: rgba(10, 12, 18, 0.35);
          border: 1px solid rgba(230, 224, 210, 0.14);
          border-radius: 999px; padding: 4px 10px; cursor: pointer;
          transition: color 0.2s, border-color 0.2s;
        }
        .ds-a11y-nav button:hover, .ds-a11y-nav button:focus-visible {
          color: ${ACCENT}; border-color: ${ACCENT}; outline: none;
        }
        .ds-fallback { min-height: 100vh; padding: 4rem 1.5rem; background: #0d1018; color: #e6e0d2; }
        .ds-fallback-eyebrow { text-transform: uppercase; letter-spacing: 0.2em; font-size: 0.75rem; opacity: 0.6; }
        .ds-fallback h1 { font-size: 2rem; margin: 0.8rem 0; }
        .ds-fallback ul { margin-top: 1rem; display: grid; gap: 0.5rem; }
        .ds-fallback a { color: ${ACCENT}; }
      `}</style>
    </div>
  );
}
