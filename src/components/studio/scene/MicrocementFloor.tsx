import { useEffect, useMemo } from 'react';
import { INTERIOR, ROOM } from './config';
import { Block } from './Primitives';
import { createMineralSurface } from './mineralSurface';

export function MicrocementFloor() {
  const surface = useMemo(() => createMineralSurface('microcement'), []);
  useEffect(() => () => Object.values(surface).forEach(texture => texture.dispose()), [surface]);
  const [width, , depth] = ROOM.platform.size;
  return <group name="Seamless warm greige microcement floor">
    <Block {...ROOM.platform} color={INTERIOR.microcement} roughness={0.9} />
    <Block size={[width - 0.04, 0.025, depth - 0.04]} position={[0, 0.006, 0]} radius={0.006}
      color={INTERIOR.microcement} roughness={0.92}
      material={{ ...surface, bumpScale: 0.0025 }} />
  </group>;
}
