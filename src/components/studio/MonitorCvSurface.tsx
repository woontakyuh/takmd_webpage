import { useEffect, useLayoutEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { CvReader } from './CvReader';
import { OfficeIcon } from './OfficeIcon';
import './monitor-screen-reader.css';

export const MONITOR_CV_WIDTH = 1440;
export const MONITOR_CV_HEIGHT = 810;

export type MonitorScrollState = { scrollTop: number };

type Props = {
  readonly publicationCount: number;
  readonly presentationCount: number;
  readonly active: boolean;
  readonly onClose: () => void;
  readonly scrollState?: MonitorScrollState;
  readonly controlScale?: number;
  readonly hovered?: boolean;
  readonly onSnapshot?: (element: HTMLElement) => Promise<boolean>;
};

type SurfaceStyle = CSSProperties & { readonly '--monitor-control-scale': number };

export function MonitorCvSurface({ publicationCount, presentationCount, active, onClose, scrollState, controlScale = 1, hovered = false, onSnapshot }: Props) {
  const content = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const restoring = useRef(true);
  const snapshotTimer = useRef(0);
  useLayoutEffect(() => {
    restoring.current = true;
    let frame = 0;
    const restore = () => {
      const element = content.current;
      if (!element) return;
      // Drei attaches this portal after child layout effects; wait for its scroll box.
      if (element.clientHeight === 0) { frame = requestAnimationFrame(restore); return; }
      if (!active) element.scrollTop = 0;
      else if (scrollState) element.scrollTop = scrollState.scrollTop;
      restoring.current = false;
      if (active) closeButton.current?.focus({ preventScroll: true });
    };
    frame = requestAnimationFrame(restore);
    return () => cancelAnimationFrame(frame);
  }, [active, scrollState]);
  useEffect(() => () => {
    window.clearTimeout(snapshotTimer.current);
    const element = content.current;
    if (active && element && onSnapshot) onSnapshot(element);
  }, [active, onSnapshot]);

  const close = (): void => {
    const element = content.current;
    if (element && onSnapshot) onSnapshot(element);
    onClose();
  };

  const style: SurfaceStyle = {
    width: MONITOR_CV_WIDTH,
    height: MONITOR_CV_HEIGHT,
    '--monitor-control-scale': controlScale,
  };
  return <section className="monitor-screen-reader" data-active={active} data-hovered={hovered} aria-label="Desk monitor CV reader" style={style}
    onPointerDown={event => { if (active) event.stopPropagation(); }}
    onWheel={event => { if (active) event.stopPropagation(); }}
    onDoubleClick={event => { if (active) event.stopPropagation(); }}>
    {active && <header className="monitor-screen-header">
      <h2>Curriculum Vitae</h2>
      <button ref={closeButton} type="button" onClick={close} aria-label="Close and return to office"><OfficeIcon name="close" /></button>
    </header>}
    <div ref={content} className="monitor-screen-content" inert={!active} tabIndex={active ? 0 : -1}
      role="region" aria-label="Curriculum Vitae · scroll to read"
      onScroll={event => {
        if (scrollState && active && !restoring.current) scrollState.scrollTop = event.currentTarget.scrollTop;
        if (!active || restoring.current || !onSnapshot) return;
        const element = event.currentTarget;
        if (snapshotTimer.current === 0) onSnapshot(element);
        window.clearTimeout(snapshotTimer.current);
        snapshotTimer.current = window.setTimeout(() => {
          snapshotTimer.current = 0;
          onSnapshot(element);
        }, 350);
      }}>
      <CvReader publicationCount={publicationCount} presentationCount={presentationCount} inScreen />
    </div>
  </section>;
}
