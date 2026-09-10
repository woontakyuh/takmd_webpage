import { Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import { MONITOR_CV_WIDTH, MonitorCvSurface } from '../MonitorCvSurface';
import type { MonitorScrollState } from '../MonitorCvSurface';
import { MONITOR } from './config';
import { MONITOR_SCREEN, monitorReadingSize } from './monitorReading';

type Props = {
  readonly publicationCount: number;
  readonly presentationCount: number;
  readonly onClose: () => void;
  readonly active?: boolean;
  readonly hovered?: boolean;
  readonly scrollState?: MonitorScrollState;
};

export function MonitorScreenReader({ publicationCount, presentationCount, onClose, active = true, hovered = false, scrollState }: Props) {
  const surface = useRef<HTMLDivElement>(null);
  const size = useThree(state => state.size);
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
      controlScale={MONITOR_CV_WIDTH / monitorReadingSize(size.width, size.height)} />
  </Html>;
}
