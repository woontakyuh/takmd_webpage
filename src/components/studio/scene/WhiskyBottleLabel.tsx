import { useEffect, useMemo } from 'react';
import { Color, Float32BufferAttribute } from 'three';
import type { MeshStandardMaterial, Texture } from 'three';
import { createBottleGeometry } from './WhiskyBottleGeometry';
import { WHISKY_PHOTO_BOUNDS } from './WhiskyPhotoBounds';
import type { BottleLabelSpec, BottleSpec } from './WhiskyBottleSpecs';

type LabelProps = {
  readonly bottle: BottleSpec;
  readonly label: BottleLabelSpec;
  readonly texture: Texture;
};

export function WhiskyBottleLabel({ bottle, label, texture }: LabelProps) {
  const geometry = useMemo(() => {
    const patch = createBottleGeometry(bottle, {low: label.low, high: label.high,
      halfAngle: label.halfAngle, offset: .00035});
    const photo = WHISKY_PHOTO_BOUNDS[bottle.image];
    const position = patch.getAttribute('position');
    const uv = patch.getAttribute('uv');
    const localUv = new Float32Array(position.count * 2);
    for (let i = 0; i < position.count; i += 1) {
      localUv[i * 2] = uv.getX(i);
      localUv[i * 2 + 1] = uv.getY(i);
      uv.setXY(i, photo.centerU + position.getX(i) / (bottle.radius * 2) * photo.widthU,
        photo.bottomV + position.getY(i) / bottle.height * photo.heightV);
    }
    patch.setAttribute('labelUv', new Float32BufferAttribute(localUv, 2));
    return patch;
  }, [bottle, label]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const finish = useMemo(() => (shader: Parameters<MeshStandardMaterial['onBeforeCompile']>[0]) => {
    shader.vertexShader = 'attribute vec2 labelUv; varying vec2 vLabelUv;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvLabelUv = labelUv;');
    shader.fragmentShader = 'varying vec2 vLabelUv;\n' + shader.fragmentShader;
    const dark = label.low > .7;
    const coloredPaper = bottle.image.includes('bowmore-17') || bottle.image.includes('glendronach-18');
    const copper = bottle.image.includes('ballantines') && label.high < .2;
    const paper = dark ? '#191b1a' : copper ? '#c2925b' : '#e9dfc8';
    const bounds = WHISKY_PHOTO_BOUNDS[bottle.image];
    shader.uniforms.labelPaper = { value: new Color(paper) };
    shader.uniforms.labelVLow = { value: bounds.bottomV + label.low * bounds.heightV };
    shader.uniforms.labelVHigh = { value: bounds.bottomV + label.high * bounds.heightV };
    shader.fragmentShader = 'uniform vec3 labelPaper; uniform float labelVLow; uniform float labelVHigh;\n' + shader.fragmentShader;
    let mask = '';

    if (label.kind === 'crest' && bottle.image.includes('lagavulin')) {
      mask = `vec2 crest = abs(vLabelUv - 0.5);
        float end = max(crest.y - 0.29, 0.0) / 0.21;
        if (pow(crest.x / 0.49, 2.0) + end * end > 1.0) discard;`;
    }
    if (bottle.image.includes('bowmore')) {
      mask = `float side = pow(abs(vLabelUv.x - .5) * 2.0, 2.0);
        if (vLabelUv.y > 1.0 - .18 * side) discard;`;
    }
    if (bottle.image.endsWith('/bookers.png')) {
      mask += `float strength = step(0.445, vMapUv.x) * step(vMapUv.x, 0.55)
        * step(0.215, vMapUv.y) * step(vMapUv.y, 0.232);
        diffuseColor.rgb = mix(diffuseColor.rgb, texture2D(map, vec2(vMapUv.x, 0.21)).rgb, strength);`;
    }
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
      ${mask}
      ${dark || coloredPaper ? '' : `
      vec3 paperLight = vec3(.25);
      for (int sampleIndex = 0; sampleIndex < 5; sampleIndex++) {
        float paperV = mix(labelVLow, labelVHigh, .08 + float(sampleIndex) * .21);
        paperLight = max(paperLight, texture2D(map, vec2(vMapUv.x, paperV)).rgb);
      }
      diffuseColor.rgb = clamp(diffuseColor.rgb / paperLight, 0.0, 1.0) * labelPaper;
      `}
`);
  }, [bottle.image, label.kind, label.low, label.high]);
  return <mesh name={`${bottle.name} ${label.kind} label`} geometry={geometry} receiveShadow>
    <meshStandardMaterial map={texture} roughness={.68} transparent opacity={1}
      metalness={0} onBeforeCompile={finish}
      customProgramCacheKey={() => `${bottle.image}-${label.kind}-${label.low}-delit-print`}
      polygonOffset polygonOffsetFactor={-1} />
  </mesh>;
}
