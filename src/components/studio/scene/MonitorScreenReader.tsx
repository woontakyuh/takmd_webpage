import { Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
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
};

export function MonitorScreenReader({ publicationCount, presentationCount, onClose, texture, active = true, hovered = false, scrollState }: Props) {
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
  useFrame(({ camera, size: viewport }) => {
    const portal = surface.current?.closest<HTMLElement>('.monitor-screen-portal');
    if (!portal) return;
    // Drei's CSS camera omits the off-axis projection used to leave room for exhibit details.
    const projection = camera.projectionMatrix.elements;
    portal.style.translate = `${-projection[8] * viewport.width / 2}px ${projection[9] * viewport.height / 2}px`;
    // The stage clips the viewport; translating another clipping rectangle would cut off the screen.
    portal.style.overflow = 'visible';
  });
  return <Html ref={surface} wrapperClass="monitor-screen-portal" transform distanceFactor={400 * MONITOR.screenWidth / MONITOR_CV_WIDTH}
    position={MONITOR_SCREEN.reader} zIndexRange={[20, 16]} occlude pointerEvents={active ? 'auto' : 'none'}
    style={{ pointerEvents: active ? 'auto' : 'none' }}>
    <MonitorCvSurface publicationCount={publicationCount} presentationCount={presentationCount}
      active={active} hovered={hovered} onClose={onClose} scrollState={scrollState}
      onSnapshot={capture}
      controlScale={MONITOR_CV_WIDTH / monitorReadingSize(size.width, size.height)} />
  </Html>;
}
