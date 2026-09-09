import { useTexture } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { SRGBColorSpace } from 'three';
import { WhiskyBottleBody } from './WhiskyBottleBody';
import { WhiskyBottleLabel } from './WhiskyBottleLabel';
import { WHISKY_BOTTLES } from './WhiskyBottleSpecs';

export function WhiskyCollection() {
  const sources = useTexture(WHISKY_BOTTLES.map(bottle => bottle.image));
  const textures = useMemo(() => sources.map(source => {
    const texture = source.clone();
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
    return texture;
  }), [sources]);
  useEffect(() => () => textures.forEach(texture => texture.dispose()), [textures]);
  return <group name="favorite-whisky-collection">
    {WHISKY_BOTTLES.map((bottle, index) => {
      const texture = textures[index];
      return texture ? <group key={bottle.name} name={bottle.name}
        position={bottle.position} rotation={[0, Math.PI, 0]}>
        <WhiskyBottleBody bottle={bottle} />
        {bottle.labels.map((label, labelIndex) => <WhiskyBottleLabel key={labelIndex}
          bottle={bottle} label={label} texture={texture} />)}
      </group> : null;
    })}
  </group>;
}

useTexture.preload(WHISKY_BOTTLES.map(bottle => bottle.image));
