import { Html } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useCallback, useEffect, useRef } from 'react';
import { CvReader } from '../CvReader';
import { OfficeIcon } from '../OfficeIcon';
import { MONITOR } from './config';
import { MONITOR_SCREEN, monitorReadingSize } from './monitorReading';
import '../monitor-screen-reader.css';

type Props = {
  readonly publicationCount: number;
  readonly presentationCount: number;
  readonly onClose: () => void;
};

export function MonitorScreenReader({ publicationCount, presentationCount, onClose }: Props) {
  const size = useThree(state => state.size);
  const width = monitorReadingSize(size.width, size.height);
  const returnButton = useRef<HTMLButtonElement>(null);
  const closing = useRef(false);
  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    if (window.history.state?.officeMonitor) window.history.back();
    else onClose();
  }, [onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closing.current = false;
    window.history.pushState({ ...window.history.state, officeMonitor: true }, '', window.location.href);
    const onBack = () => onClose();
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || document.querySelector('dialog:modal')) return;
      event.preventDefault();
      close();
    };
    window.addEventListener('popstate', onBack);
    window.addEventListener('keydown', onKey);
    const focusFrame = requestAnimationFrame(() => returnButton.current?.focus({ preventScroll: true }));
    return () => {
      cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('popstate', onBack);
      window.removeEventListener('keydown', onKey);
      if (window.history.state?.officeMonitor) {
        const { officeMonitor, ...state } = window.history.state;
        window.history.replaceState(state, '', window.location.href);
      }
    };
  }, [close, onClose]);

  return <Html transform distanceFactor={400 * MONITOR.screenWidth / width}
    position={MONITOR_SCREEN.reader} zIndexRange={[20, 16]} occlude>
    <section className="monitor-screen-reader" aria-label="Desk monitor CV reader" data-small={width < 560}
      data-short-wide={size.width > size.height && size.height < 560}
      style={{ width, height: width * MONITOR.screenHeight / MONITOR.screenWidth }}
      onPointerDown={event => event.stopPropagation()} onWheel={event => event.stopPropagation()} onDoubleClick={event => event.stopPropagation()}>
      <header className="monitor-screen-header">
        <h2>Curriculum Vitae</h2>
        <button ref={returnButton} type="button" onClick={close} aria-label="Close and return to office"><OfficeIcon name="close" /></button>
      </header>
      <div className="monitor-screen-content" tabIndex={0} role="region" aria-label="Curriculum Vitae · scroll to read">
        <CvReader publicationCount={publicationCount} presentationCount={presentationCount} inScreen />
      </div>
    </section>
  </Html>;
}
