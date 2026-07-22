import { useEffect, useMemo, useRef, useState } from 'react';
import { ACCENT } from './config';
import type { DeskObject, SceneMetrics } from './types';

const TYPE_MS = 16;
const HOVER_OUT_GRACE_MS = 1100;

function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

function terminalLinesFor(object: DeskObject, now: Date): string[] {
  if (object.id === 'clock') {
    return [
      now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      `Local time ${now.toLocaleTimeString(undefined, { hour12: false })} — the desk follows your sun.`,
    ];
  }
  return object.terminalLines;
}

function Typewriter({ text, reducedMotion }: { text: string; reducedMotion: boolean }) {
  const [count, setCount] = useState(reducedMotion ? text.length : 0);
  useEffect(() => {
    if (reducedMotion) {
      setCount(text.length);
      return;
    }
    setCount(0);
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setCount(i);
      if (i >= text.length) window.clearInterval(id);
    }, TYPE_MS);
    return () => window.clearInterval(id);
  }, [text, reducedMotion]);
  return <>{text.slice(0, count)}</>;
}

export function Terminal({
  metrics,
  active,
  reducedMotion,
}: {
  metrics: SceneMetrics;
  active: DeskObject | null;
  reducedMotion: boolean;
}) {
  const now = useNow(1000);
  // Hover-out grace: hold the last object briefly before returning to idle
  const [shown, setShown] = useState<DeskObject | null>(active);
  const graceRef = useRef<number>(0);
  useEffect(() => {
    window.clearTimeout(graceRef.current);
    if (active) {
      setShown(active);
    } else {
      graceRef.current = window.setTimeout(() => setShown(null), HOVER_OUT_GRACE_MS);
    }
    return () => window.clearTimeout(graceRef.current);
  }, [active]);

  const hoverText = useMemo(() => {
    if (!shown) return '';
    return terminalLinesFor(shown, now).join('\n');
    // intentionally not re-typing every second for the clock — keyed by object
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown]);

  const timeStr = now.toLocaleTimeString(undefined, { hour12: false });

  return (
    <div className="ds-terminal" aria-live="polite">
      {shown ? (
        <div key={shown.id}>
          <p className="ds-line">
            <span className="ds-prompt">tak@desk:~$</span> {shown.command}
          </p>
          <pre className="ds-body">
            <Typewriter text={hoverText} reducedMotion={reducedMotion} />
            <span className="ds-cursor" />
          </pre>
        </div>
      ) : (
        <div>
          <p className="ds-line">
            <span className="ds-prompt">tak@desk:~$</span> whoami
          </p>
          <div className="ds-neofetch">
            <pre className="ds-ascii" aria-hidden="true">{`  ┌───────┐
  │ ▄▄▄▄▄ │
  │ █ ▪ █ │
  │ ▀▀▀▀▀ │
  └──┬─┬──┘`}</pre>
            <dl className="ds-facts">
              <div>
                <dt>name</dt>
                <dd>Woon Tak Yuh, MD</dd>
              </div>
              <div>
                <dt>role</dt>
                <dd>spine neurosurgeon · AI researcher</dd>
              </div>
              <div>
                <dt>base</dt>
                <dd>Center for Endoscopic Spine Surgery, Davos Hospital</dd>
              </div>
              <div>
                <dt>papers</dt>
                <dd>{metrics.publications} publications</dd>
              </div>
              <div>
                <dt>talks</dt>
                <dd>{metrics.presentations} presentations</dd>
              </div>
              <div>
                <dt>clock</dt>
                <dd>
                  {timeStr} <span className="ds-dim">local</span>
                </dd>
              </div>
            </dl>
          </div>
          <p className="ds-hint">
            hover an object <span className="ds-dim">— click to open</span>
            <span className="ds-cursor" />
          </p>
        </div>
      )}
      <style>{`
        .ds-terminal {
          width: 620px;
          height: 360px;
          box-sizing: border-box;
          padding: 26px 30px;
          font-family: 'JetBrains Mono Variable', ui-monospace, monospace;
          font-size: 15px;
          line-height: 1.55;
          color: #d6d2c8;
          background: linear-gradient(180deg, #16181d 0%, #101216 100%);
          overflow: hidden;
          user-select: none;
        }
        .ds-line { margin: 0 0 10px; color: #d6d2c8; }
        .ds-prompt { color: ${ACCENT}; }
        .ds-body { margin: 0; white-space: pre-wrap; font: inherit; color: #b9c4c0; }
        .ds-neofetch { display: flex; gap: 22px; align-items: flex-start; }
        .ds-ascii { margin: 0; color: ${ACCENT}; font-size: 13px; line-height: 1.35; }
        .ds-facts { margin: 0; display: grid; gap: 3px; }
        .ds-facts div { display: flex; gap: 10px; }
        .ds-facts dt { color: ${ACCENT}; min-width: 62px; }
        .ds-facts dt::after { content: ':'; }
        .ds-facts dd { margin: 0; color: #c9c4b8; }
        .ds-hint { margin: 14px 0 0; color: #6d6f76; }
        .ds-dim { color: #6d6f76; }
        .ds-cursor {
          display: inline-block; width: 8px; height: 16px; margin-left: 4px;
          background: ${ACCENT}; vertical-align: text-bottom;
          animation: ds-blink 1.1s steps(1) infinite;
        }
        @keyframes ds-blink { 50% { opacity: 0; } }
        @media (prefers-reduced-motion: reduce) { .ds-cursor { animation: none; } }
      `}</style>
    </div>
  );
}
