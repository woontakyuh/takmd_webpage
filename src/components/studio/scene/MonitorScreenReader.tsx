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
  const snapshot = useRef<Promise<boolean> | null>(null);
  const queuedSnapshot = useRef<HTMLElement | null>(null);
  const size = useThree(state => state.size);
  const capture = useCallback((element: HTMLElement): Promise<boolean> => {
    queuedSnapshot.current = element;
    if (snapshot.current) return snapshot.current;
    const run = async (): Promise<boolean> => {
      let successful = true;
      const takeQueued = (): HTMLElement | null => {
        const queued = queuedSnapshot.current;
        queuedSnapshot.current = null;
        return queued;
      };
      let next = takeQueued();
      while (next) {
        successful = await captureMonitorSurface(next, texture) && successful;
        next = takeQueued();
        if (next && !next.isConnected) next = null;
      }
      return successful;
    };
    const pending = run().finally(() => { snapshot.current = null; });
    snapshot.current = pending;
    return pending;
  }, [texture]);
  // Reading and seated entry poses face the screen head-on, so a screen-aligned overlay matches the bezel exactly.
  // Drei's CSS 3D transform mode is avoided: WebKit rasterises its metre-scaled layer at that tiny scale, leaving Safari a blank screen.
  return <Html ref={surface} wrapperClass="monitor-screen-portal" center distanceFactor={MONITOR.screenWidth * size.height / MONITOR_CV_WIDTH}
    position={MONITOR_SCREEN.reader} zIndexRange={[20, 16]} occlude pointerEvents={active ? 'auto' : 'none'}
    style={{ pointerEvents: active ? 'auto' : 'none' }}>
    <MonitorCvSurface publicationCount={publicationCount} presentationCount={presentationCount}
      active={active} hovered={hovered} onClose={onClose} scrollState={scrollState}
      autoFocus={!entry} onEngage={onEngage}
      onSnapshot={capture}
      controlScale={MONITOR_CV_WIDTH / monitorReadingSize(size.width, size.height)} />
  </Html>;
}
