import { Html } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
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
  const size = useThree(state => state.size);
  return <Html transform distanceFactor={400 * MONITOR.screenWidth / MONITOR_CV_WIDTH}
    position={MONITOR_SCREEN.reader} zIndexRange={[20, 16]} occlude pointerEvents={active ? 'auto' : 'none'}
    style={{ pointerEvents: active ? 'auto' : 'none' }}>
    <MonitorCvSurface publicationCount={publicationCount} presentationCount={presentationCount}
      active={active} hovered={hovered} onClose={onClose} scrollState={scrollState}
      controlScale={MONITOR_CV_WIDTH / monitorReadingSize(size.width, size.height)} />
  </Html>;
}
