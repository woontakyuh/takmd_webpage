import { useLayoutEffect, useRef, useState } from 'react';
import { MONITOR_CV_HEIGHT, MONITOR_CV_WIDTH, MonitorCvSurface } from './MonitorCvSurface';
import type { MonitorScrollState } from './MonitorCvSurface';
import { activeOfficePosterVariant } from './officePosterConfig';
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
  const bezel = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const element = bezel.current;
    const poster = overlay.current?.closest('.studio')?.querySelector('.office-poster img');
    if (!element || !poster || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const source = activeOfficePosterVariant(media => window.matchMedia(media).matches);
    if (!source) return;
    const image = poster.getBoundingClientRect();
    const target = element.getBoundingClientRect();
    const fit = Math.max(image.width / source.width, image.height / source.height);
    const x = image.left + (image.width - source.width * fit) / 2 + source.monitor.x * fit - target.left;
    const y = image.top + (image.height - source.height * fit) / 2 + source.monitor.y * fit - target.top;
    const transform = `matrix(${source.monitor.across[0] * fit / target.width}, ${source.monitor.across[1] * fit / target.width}, ${source.monitor.down[0] * fit / target.height}, ${source.monitor.down[1] * fit / target.height}, ${x}, ${y})`;
    const motion = getComputedStyle(element);
    const panelDuration = motion.getPropertyValue('--studio-panel').trim();
    const animation = element.animate([{ transform, opacity: 0.65 }, { offset: 0.25, opacity: 1 }, { transform: 'none', opacity: 1 }], {
      duration: 2 * Number.parseFloat(panelDuration) * (panelDuration.endsWith('ms') ? 1 : 1000),
      easing: motion.getPropertyValue('--studio-ease').trim(),
    });
    const settle = () => animation.finish();
    window.addEventListener('resize', settle, { once: true });
    return () => { animation.cancel(); window.removeEventListener('resize', settle); };
  }, []);

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
    <div ref={bezel} className="loading-monitor-bezel" style={{ aspectRatio: `${MONITOR.width} / ${MONITOR.height}` }}>
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
