import { Html } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useCallback, useRef } from 'react';
import { MONITOR_CV_WIDTH, MonitorCvSurface } from '../MonitorCvSurface';
import type { MonitorScrollState } from '../MonitorCvSurface';
import { MONITOR } from './config';
import { MONITOR_SCREEN, monitorReadingSize } from './monitorReading';
import { captureMonitorSurface } from './MonitorSurfaceSnapshot';
import type { CanvasTexture } from 'three';

type Props = {
  readonly publicationCount: number;
  readonly presentationCount: number;
  readonly onClose: () => void;
  readonly active?: boolean;
  readonly hovered?: boolean;
  readonly scrollState?: MonitorScrollState;
  readonly texture: CanvasTexture;
  readonly entry?: boolean;
  readonly onEngage?: () => void;
};

export function MonitorScreenReader({ publicationCount, presentationCount, onClose, texture, active = true, hovered = false, scrollState, entry = false, onEngage }: Props) {
  const surface = useRef<HTMLDivElement>(null);
  const size = useThree(state => state.size);
  const invalidate = useThree(state => state.invalidate);
  const inlineMobile = size.width < 760 || (size.height < 500 && window.matchMedia('(pointer: coarse)').matches);
  const surfaceWidth = inlineMobile ? monitorReadingSize(size.width, size.height) : MONITOR_CV_WIDTH;
  const capture = useCallback(async (element: HTMLElement): Promise<boolean> => {
    const captured = await captureMonitorSurface(element, texture, inlineMobile ? 2 : 1);
    if (captured) invalidate();
    return captured;
  }, [texture, inlineMobile, invalidate]);
  // Reading and seated entry poses face the screen head-on, so a screen-aligned overlay matches the bezel exactly.
  // Drei's CSS 3D transform mode is avoided: WebKit rasterises its metre-scaled layer at that tiny scale, leaving Safari a blank screen.
  return <Html ref={surface} wrapperClass="monitor-screen-portal" center distanceFactor={MONITOR.screenWidth * size.height / surfaceWidth}
    position={MONITOR_SCREEN.reader} zIndexRange={[20, 16]} occlude pointerEvents={active ? 'auto' : 'none'}
    style={{ pointerEvents: active ? 'auto' : 'none' }}>
    <div className={inlineMobile ? 'monitor-inline-reader' : undefined} style={{ width: surfaceWidth, height: surfaceWidth * MONITOR.screenHeight / MONITOR.screenWidth }}>
    <MonitorCvSurface publicationCount={publicationCount} presentationCount={presentationCount}
      active={active} hovered={hovered} onClose={onClose} scrollState={scrollState}
      autoFocus={!entry} onEngage={onEngage}
      onSnapshot={capture}
      controlScale={surfaceWidth / monitorReadingSize(size.width, size.height)} />
    </div>
  </Html>;
}
