import { useTexture } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { NoColorSpace, RepeatWrapping, SRGBColorSpace, Vector2 } from 'three';
import type { Texture } from 'three';

export type InteriorSurface = 'oak' | 'linen' | 'stone';

type TexturePaths = {
  readonly map: string;
  readonly normalMap: string;
  readonly roughnessMap: string;
};

export type InteriorMaterial = {
  readonly map: Texture;
  readonly normalMap: Texture;
  readonly roughnessMap: Texture;
  readonly normalScale: Vector2;
};

const INTERIOR_TEXTURE_PATHS: Readonly<Record<InteriorSurface, TexturePaths>> = {
  oak: {
    map: '/textures/interior/oak/diffuse.jpg',
    normalMap: '/textures/interior/oak/normal.jpg',
    roughnessMap: '/textures/interior/oak/roughness.jpg',
  },
  linen: {
    map: '/textures/interior/linen/diffuse.jpg',
    normalMap: '/textures/interior/linen/normal.jpg',
    roughnessMap: '/textures/interior/linen/roughness.jpg',
  },
  stone: {
    map: '/textures/interior/stone/diffuse.jpg',
    normalMap: '/textures/interior/stone/normal.jpg',
    roughnessMap: '/textures/interior/stone/roughness.jpg',
  },
};

const NORMAL_STRENGTH: Readonly<Record<InteriorSurface, number>> = {
  oak: 0.18,
  linen: 0.12,
  stone: 0.16,
};

function prepareTexture(texture: Texture, repeatX: number, repeatY: number, colorSpace: typeof SRGBColorSpace | typeof NoColorSpace): Texture {
  const clone = texture.clone();
  clone.colorSpace = colorSpace;
  clone.wrapS = RepeatWrapping;
  clone.wrapT = RepeatWrapping;
  clone.repeat.set(repeatX, repeatY);
  clone.anisotropy = 4;
  clone.needsUpdate = true;
  return clone;
}

export function useInteriorMaterial(
  surface: InteriorSurface,
  repeat: readonly [number, number] = [1, 1],
): InteriorMaterial {
  const [repeatX, repeatY] = repeat;
  const sources = useTexture(INTERIOR_TEXTURE_PATHS[surface]);
  const material = useMemo<InteriorMaterial>(() => ({
    map: prepareTexture(sources.map, repeatX, repeatY, SRGBColorSpace),
    normalMap: prepareTexture(sources.normalMap, repeatX, repeatY, NoColorSpace),
    roughnessMap: prepareTexture(sources.roughnessMap, repeatX, repeatY, NoColorSpace),
    normalScale: new Vector2(NORMAL_STRENGTH[surface], NORMAL_STRENGTH[surface]),
  }), [repeatX, repeatY, sources.map, sources.normalMap, sources.roughnessMap, surface]);

  useEffect(() => () => {
    material.map.dispose();
    material.normalMap.dispose();
    material.roughnessMap.dispose();
  }, [material]);

  return material;
}
