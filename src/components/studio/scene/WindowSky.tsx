import { useTexture } from '@react-three/drei';
import { useEffect, useMemo, useRef } from 'react';
import { Color, MathUtils, ShaderMaterial, SRGBColorSpace, Vector3, Vector4 } from 'three';
import { ROOM } from './config';

const DAY_OUTLOOK = '/images/office-outlook/seongsu-han-river-day.webp';
const NIGHT_OUTLOOK = '/images/office-outlook/seongsu-han-river-night.webp';
const BACKDROP_X = -24;
const BACKDROP_WIDTH = 180;
const BACKDROP_ASPECT = 1835 / 857;

const vertexShader = `
  varying vec3 vWorldPosition;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
    gl_Position.z = gl_Position.w * 0.999;
  }
`;

const fragmentShader = `
  uniform sampler2D uDay;
  uniform sampler2D uNight;
  uniform float uNightMix;
  uniform float uPortalX;
  uniform vec4 uPortalBounds;
  uniform vec3 uViewOrigin;
  uniform float uAspect;
  varying vec3 vWorldPosition;

  void main() {
    vec3 ray = vWorldPosition - cameraPosition;
    if (abs(ray.x) < 0.00001) discard;

    float portalDistance = (uPortalX - cameraPosition.x) / ray.x;
    if (portalDistance <= 0.0 || portalDistance >= 1.0) discard;

    vec3 portalPoint = cameraPosition + ray * portalDistance;
    if (portalPoint.z < uPortalBounds.x || portalPoint.z > uPortalBounds.y
      || portalPoint.y < uPortalBounds.z || portalPoint.y > uPortalBounds.w) discard;

    vec3 outlook = vWorldPosition - uViewOrigin;
    vec2 panoramaUv = vec2(
      0.5 + atan(-outlook.z, -outlook.x) / 3.14159265,
      0.5 + atan(outlook.y, length(outlook.xz)) * uAspect / 3.14159265
    );
    vec3 dayColor = texture2D(uDay, panoramaUv).rgb;
    vec3 nightColor = texture2D(uNight, panoramaUv).rgb;
    gl_FragColor = vec4(mix(dayColor, nightColor, uNightMix), 1.0);
    #include <colorspace_fragment>
  }
`;

function nightMixFor(colors: readonly [string, string]): number {
  const top = new Color(colors[0]);
  const bottom = new Color(colors[1]);
  const luminance = (color: Color) => 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b;
  const averageLuminance = (luminance(top) + luminance(bottom)) / 2;
  return 1 - MathUtils.smoothstep(averageLuminance, 0.035, 0.42);
}

export function WindowSky({ colors }: { readonly colors: readonly [string, string] }) {
  const [day, night] = useTexture([DAY_OUTLOOK, NIGHT_OUTLOOK]);
  const material = useRef<ShaderMaterial>(null);
  const { leftX, window: opening } = ROOM.architecture;
  const centerY = (opening.top + opening.bottom) / 2;
  const nightMix = nightMixFor(colors);

  useEffect(() => {
    day.colorSpace = SRGBColorSpace;
    night.colorSpace = SRGBColorSpace;
    day.needsUpdate = true;
    night.needsUpdate = true;
  }, [day, night]);

  const uniforms = useMemo(() => ({
    uDay: { value: day },
    uNight: { value: night },
    uNightMix: { value: nightMix },
    uPortalX: { value: leftX - 0.04 },
    uViewOrigin: { value: new Vector3(0, centerY, opening.centerZ + 18) },
    uAspect: { value: BACKDROP_ASPECT },
    uPortalBounds: { value: new Vector4(
      opening.centerZ - opening.width / 2,
      opening.centerZ + opening.width / 2,
      opening.bottom,
      opening.top,
    ) },
  }), [day, leftX, night, opening.bottom, opening.centerZ, opening.top, opening.width]);

  useEffect(() => {
    if (material.current) material.current.uniforms.uNightMix.value = nightMix;
  }, [nightMix]);

  return <mesh name="Seongsu Han River outlook" position={[BACKDROP_X, centerY, opening.centerZ]}
    rotation={[0, Math.PI / 2, 0]} frustumCulled={false} renderOrder={-100}
    raycast={() => undefined}>
    <planeGeometry args={[BACKDROP_WIDTH, BACKDROP_WIDTH / BACKDROP_ASPECT]} />
    <shaderMaterial ref={material} uniforms={uniforms} vertexShader={vertexShader}
      fragmentShader={fragmentShader} depthWrite={false} toneMapped={false} />
  </mesh>;
}
