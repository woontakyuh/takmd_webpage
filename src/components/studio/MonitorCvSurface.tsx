import { useLayoutEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { CvReader } from './CvReader';
import { OfficeIcon } from './OfficeIcon';
import './monitor-screen-reader.css';
import { SIMPLE_OFFICE } from './scene/OfficeStyle';

export const MONITOR_CV_WIDTH = 1440;
export const MONITOR_CV_HEIGHT = 810;

export type MonitorScrollState = {
  scrollTop: number;
  onSnapshot?: (element: HTMLElement) => Promise<boolean>;
  captureCurrent?: () => Promise<boolean> | undefined;
};

type Props = {
  readonly publicationCount: number;
  readonly presentationCount: number;
  readonly active: boolean;
  readonly onClose: () => void;
  readonly scrollState?: MonitorScrollState;
  readonly controlScale?: number;
  readonly hovered?: boolean;
  readonly onSnapshot?: (element: HTMLElement) => Promise<boolean>;
  readonly autoFocus?: boolean;
  readonly onEngage?: () => void;
  readonly closeDisabled?: boolean;
  readonly embeddedEntry?: boolean;
};

type SurfaceStyle = CSSProperties & { readonly '--monitor-control-scale': number };

export function MonitorCvSurface({ publicationCount, presentationCount, active, onClose, scrollState, controlScale = 1, hovered = false, onSnapshot, autoFocus = true, onEngage, closeDisabled = false, embeddedEntry = false }: Props) {
  const content = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const restoring = useRef(true);
  useLayoutEffect(() => {
    restoring.current = true;
    let frame = 0;
    const restore = () => {
      const element = content.current;
      if (!element) return;
      // Drei attaches this portal after child layout effects; wait for its scroll box.
      if (element.clientHeight === 0) { frame = requestAnimationFrame(restore); return; }
      if (!active) element.scrollTop = 0;
      else if (scrollState) {
        if (element.scrollTop > 0 && scrollState.scrollTop === 0) { scrollState.scrollTop = element.scrollTop; onEngage?.(); }
        else element.scrollTop = scrollState.scrollTop;
      }
      restoring.current = false;
      if (active && autoFocus) closeButton.current?.focus({ preventScroll: true });
    };
    if (SIMPLE_OFFICE) restore();
    else frame = requestAnimationFrame(restore);
    return () => cancelAnimationFrame(frame);
  }, [active, autoFocus, scrollState]);
  useLayoutEffect(() => {
    const element = content.current;
    let captured = false;
    let pending: Promise<boolean> | undefined;
    const captureCurrent = () => {
      if (pending) return pending;
      if (!active || !element?.isConnected) return;
      captured = true;
      pending = (onSnapshot ?? scrollState?.onSnapshot)?.(element);
      return pending;
    };
    if (active && scrollState) scrollState.captureCurrent = captureCurrent;
    return () => {
      if (!captured) captureCurrent();
      if (scrollState?.captureCurrent === captureCurrent) delete scrollState.captureCurrent;
    };
  }, [active, onSnapshot, scrollState]);

  const style: SurfaceStyle = {
    width: MONITOR_CV_WIDTH,
    height: MONITOR_CV_HEIGHT,
    '--monitor-control-scale': controlScale,
  };
  return <section className="monitor-screen-reader" data-active={active} data-hovered={hovered} aria-label="Desk monitor CV reader" style={style}
    onPointerDown={event => { if (active) { event.stopPropagation(); onEngage?.(); } }}
    onWheel={event => { if (active) event.stopPropagation(); }}
    onDoubleClick={event => { if (active) event.stopPropagation(); }}>
    {active && !embeddedEntry && <header className="monitor-screen-header">
      <h2>Curriculum Vitae</h2>
      <button ref={closeButton} type="button" disabled={closeDisabled} onClick={onClose} aria-label="Close and return to office"><OfficeIcon name="close" /></button>
    </header>}
    <div ref={content} className="monitor-screen-content" inert={!active} tabIndex={active ? 0 : -1}
      role="region" aria-label="Curriculum Vitae · scroll to read"
      onScroll={event => {
        if (scrollState && active && !restoring.current) scrollState.scrollTop = event.currentTarget.scrollTop;
        if (active && !restoring.current) onEngage?.();
      }}>
      <CvReader publicationCount={publicationCount} presentationCount={presentationCount} inScreen />
    </div>
  </section>;
}
