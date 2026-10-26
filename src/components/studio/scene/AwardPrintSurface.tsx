import { useEffect, useMemo } from 'react';
import { MeshStandardMaterial, PlaneGeometry } from 'three';
import type { Texture } from 'three';
import { AWARD_PRINTS, printGeometry } from './AwardPrintCalibration';
export { AWARD_PRINTS } from './AwardPrintCalibration';

export function AwardPrintSurface({
  id,
  texture,
  inkMap,
  width,
  height,
  position = [0, 0, 0],
}: {
  id: string;
  texture: Texture;
  inkMap?: Texture;
  width: number;
  height: number;
  position?: [number, number, number];
}) {
  const spec = AWARD_PRINTS[id];
  const geometry = useMemo(() => {
    if (spec.metal) return new PlaneGeometry(width, height);
    const canvas = document.createElement('canvas');
    canvas.width = spec.calibrationWidth ?? 768;
    canvas.height = Math.round((canvas.width * spec.view[1]) / spec.view[0]);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx || !(texture.image instanceof HTMLImageElement))
      throw new Error('Award print source unavailable');
    ctx.drawImage(texture.image, 0, 0, canvas.width, canvas.height);
    return printGeometry(
      width,
      height,
      ctx.getImageData(0, 0, canvas.width, canvas.height),
      spec,
    );
  }, [texture, spec, width, height]);
  const material = useMemo(() => {
    const result = new MeshStandardMaterial({
      map: texture,
      roughness: spec.metal ? 0.5 : 0.85,
      metalness: spec.metal ? 0.48 : 0,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    result.onBeforeCompile = (shader) => {
      if (inkMap) {
        shader.uniforms.awardInkMap = { value: inkMap };
        shader.fragmentShader = shader.fragmentShader
          .replace(
            '#include <common>',
            '#include <common>\nuniform sampler2D awardInkMap;',
          )
          .replace(
            '#include <metalnessmap_fragment>',
            '#include <metalnessmap_fragment>\nmetalnessFactor *= 1.-texture2D(awardInkMap,vMapUv).r*.85;',
          );
      } else {
        shader.vertexShader = shader.vertexShader
          .replace(
            '#include <common>',
            '#include <common>\nattribute vec3 printGain; varying vec3 vPrintGain;',
          )
          .replace(
            '#include <begin_vertex>',
            '#include <begin_vertex>\nvPrintGain=printGain;',
          );
        shader.fragmentShader = shader.fragmentShader
          .replace(
            '#include <common>',
            '#include <common>\nvarying vec3 vPrintGain;',
          )
          .replace(
            '#include <map_fragment>',
            '#include <map_fragment>\ndiffuseColor.rgb *= vPrintGain;',
          );
      }
    };
    result.customProgramCacheKey = () =>
      `award-print-calibration-v14-${Boolean(inkMap)}`;
    return result;
  }, [texture, spec.metal, inkMap]);
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );
  return (
    <mesh
      name={`${id}-restored-print`}
      geometry={geometry}
      material={material}
      position={position}
      receiveShadow
    />
  );
}
