import { useLayoutEffect, useRef, useState } from 'react';
import { MONITOR_CV_HEIGHT, MONITOR_CV_WIDTH, MonitorCvSurface } from './MonitorCvSurface';
import type { MonitorScrollState } from './MonitorCvSurface';
import { MONITOR } from './scene/config';

type Props = {
  readonly publicationCount: number;
  readonly presentationCount: number;
  readonly onClose: () => void;
  readonly scrollState?: MonitorScrollState;
};

export function LoadingMonitorReader({ publicationCount, presentationCount, onClose, scrollState }: Props) {
  const frame = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const element = frame.current;
    if (!element) return;
    const update = () => setScale(element.clientWidth / MONITOR_CV_WIDTH);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const element = overlay.current;
    if (!element) return;
    const containWheel = (event: WheelEvent) => {
      event.stopPropagation();
      if (!(event.target instanceof Element) || !event.target.closest('.monitor-screen-content')) event.preventDefault();
    };
    element.addEventListener('wheel', containWheel, { passive: false });
    return () => element.removeEventListener('wheel', containWheel);
  }, []);

  return <div ref={overlay} className="loading-monitor-reader" role="dialog" aria-modal="true" aria-label="Curriculum Vitae on desk monitor"
    onPointerDown={event => event.stopPropagation()}
    onDoubleClick={event => event.stopPropagation()}>
    <div className="loading-monitor-bezel" style={{ aspectRatio: `${MONITOR.width} / ${MONITOR.height}` }}>
      <div ref={frame} className="loading-monitor-screen" style={{
        aspectRatio: `${MONITOR_CV_WIDTH} / ${MONITOR_CV_HEIGHT}`,
        width: `${100 * MONITOR.screenWidth / MONITOR.width}%`,
        left: `${50 * (MONITOR.width - MONITOR.screenWidth) / MONITOR.width}%`,
        top: `${100 * ((MONITOR.height - MONITOR.screenHeight) / 2 - 0.004) / MONITOR.height}%`,
      }}>
        <div className="loading-monitor-surface" style={{ transform: `scale(${scale})` }}>
          <MonitorCvSurface publicationCount={publicationCount} presentationCount={presentationCount}
            active onClose={onClose} scrollState={scrollState} controlScale={1 / scale} />
        </div>
      </div>
    </div>
  </div>;
}
