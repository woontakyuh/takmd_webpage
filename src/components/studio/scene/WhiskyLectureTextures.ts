import { useEffect, useRef, useState } from 'react';
import { SRGBColorSpace, TextureLoader } from 'three';
import type { Texture } from 'three';
import { publicHighResolutionSlide } from '../publicSlideSource';
import type { TalkSlide } from '../types';
import { visibleLecturePages } from './WhiskyLectureMotion';

export function useLectureTextures(page: number, slides: readonly TalkSlide[], anisotropy: number) {
  const owned = useRef(new Map<number, Texture>());
  const loaded = useRef(new Map<number, Texture>());
  const [textures, setTextures] = useState<ReadonlyMap<number, Texture>>(new Map());
  useEffect(() => {
    const required = visibleLecturePages(page, slides.length);
    const loader = new TextureLoader();
    for (const [key, texture] of owned.current) {
      if (required.includes(key)) continue;
      texture.dispose();
      owned.current.delete(key);
      loaded.current.delete(key);
    }
    for (const key of required) {
      const slide = slides[key];
      if (!slide || owned.current.has(key)) continue;
      const load = (source: string, fallback: boolean) => {
        const texture = loader.load(source, ready => {
          if (owned.current.get(key) !== ready) { ready.dispose(); return; }
          loaded.current.set(key, ready);
          setTextures(new Map(loaded.current));
        }, undefined, () => {
          if (owned.current.get(key) !== texture) return;
          texture.dispose();
          owned.current.delete(key);
          if (fallback) load(slide.src, false);
        });
        texture.colorSpace = SRGBColorSpace;
        texture.anisotropy = anisotropy;
        owned.current.set(key, texture);
      };
      const hd = publicHighResolutionSlide(slide);
      load(hd ?? slide.src, hd !== undefined);
    }
    setTextures(new Map(loaded.current));
  }, [anisotropy, page, slides]);
  useEffect(() => {
    const resources = owned.current;
    const ready = loaded.current;
    return () => {
      resources.forEach(texture => texture.dispose());
      resources.clear();
      ready.clear();
    };
  }, []);
  return textures;
}
