import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useState } from 'react';
import {
  Box3, Color, Frustum, HalfFloatType, MathUtils, Matrix4, PerspectiveCamera, Vector2, Vector3, Vector4, WebGLRenderTarget,
} from 'three';
import { createBanpoLandscape } from './BanpoLandscape';
import { ROOM } from './config';
import { createWindowRegionProjector, cropExteriorCamera } from './WindowRenderRegion';

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
  uniform sampler2D uExterior;
  uniform vec2 uResolution;
  uniform vec2 uOrigin;
  uniform float uPortalX;
  uniform vec4 uPortalBounds;
  varying vec3 vWorldPosition;
  void main() {
    vec3 ray = vWorldPosition - cameraPosition;
    if (abs(ray.x) < 0.00001) discard;
    float portalDistance = (uPortalX - cameraPosition.x) / ray.x;
    if (portalDistance <= 0.0 || portalDistance >= 1.0) discard;
    vec3 portalPoint = cameraPosition + ray * portalDistance;
    if (portalPoint.z < uPortalBounds.x || portalPoint.z > uPortalBounds.y
      || portalPoint.y < uPortalBounds.z || portalPoint.y > uPortalBounds.w) discard;
    gl_FragColor = texture2D(uExterior, (gl_FragCoord.xy - uOrigin) / uResolution);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function nightMixFor(colors: readonly [string, string]): number {
  const top = new Color(colors[0]);
  const bottom = new Color(colors[1]);
  const luminance = (color: Color) => 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b;
  return 1 - MathUtils.smoothstep((luminance(top) + luminance(bottom)) / 2, 0.035, 0.42);
}

type WindowSkyProps = {
  readonly colors: readonly [string, string];
  readonly reducedMotion: boolean;
};

export function WindowSky({ colors, reducedMotion }: WindowSkyProps) {
  const { leftX, window: opening } = ROOM.architecture;
  const centerY = (opening.top + opening.bottom) / 2;
  const nightMix = nightMixFor(colors);
  const [exterior, setExterior] = useState<ReturnType<typeof createBanpoLandscape> | null>(null);
  useEffect(() => {
    // Start network and GPU work only after React commits, not on abandoned Suspense attempts.
    const landscape = createBanpoLandscape();
    setExterior(landscape);
    return () => landscape.dispose();
  }, []);
  const output = useMemo(() => new WebGLRenderTarget(1, 1, { type: HalfFloatType, samples: 2 }), []);
  const exteriorCamera = useMemo(() => new PerspectiveCamera(), []);
  const saved = useMemo(() => ({ viewport: new Vector4(), scissor: new Vector4() }), []);
  const visibility = useMemo(() => ({
    frustum: new Frustum(), matrix: new Matrix4(),
    opening: new Box3(
      new Vector3(leftX - 0.05, opening.bottom, opening.centerZ - opening.width / 2),
      new Vector3(leftX + 0.05, opening.top, opening.centerZ + opening.width / 2),
    ),
  }), [leftX, opening.bottom, opening.top, opening.centerZ, opening.width]);
  const regionFor = useMemo(() => createWindowRegionProjector(visibility.opening), [visibility]);
  const bufferSize = useMemo(() => new Vector2(), []);
  const uniforms = useMemo(() => ({
    uExterior: { value: output.texture },
    uResolution: { value: new Vector2(1, 1) },
    uOrigin: { value: new Vector2() },
    uPortalX: { value: leftX - 0.04 },
    uPortalBounds: { value: new Vector4(
      opening.centerZ - opening.width / 2,
      opening.centerZ + opening.width / 2,
      opening.bottom,
      opening.top,
    ) },
  }), [leftX, opening.bottom, opening.centerZ, opening.top, opening.width, output]);

  useEffect(() => { exterior?.setNightMix(nightMix); }, [exterior, nightMix]);
  useEffect(() => () => output.dispose(), [output]);

  useFrame(({ camera, gl, clock }) => {
    if (!exterior || !(camera instanceof PerspectiveCamera)) return;
    camera.updateMatrixWorld();
    visibility.matrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    visibility.frustum.setFromProjectionMatrix(visibility.matrix);
    if (!visibility.frustum.intersectsBox(visibility.opening)) return;
    gl.getDrawingBufferSize(bufferSize);
    const { x: width, y: height } = bufferSize;
    const region = regionFor(camera, width, height);
    uniforms.uResolution.value.set(region.width, region.height);
    uniforms.uOrigin.value.set(region.x, height - region.y - region.height);
    if (output.width !== region.width || output.height !== region.height) output.setSize(region.width, region.height);
    exteriorCamera.copy(camera);
    exteriorCamera.position.add(exterior.cameraOffset);
    exteriorCamera.far = 12000;
    exteriorCamera.updateProjectionMatrix();
    cropExteriorCamera(exteriorCamera, region, width, height);
    exteriorCamera.updateMatrixWorld();
    exterior.setTime(reducedMotion ? 0 : clock.elapsedTime);

    const target = gl.getRenderTarget();
    const cubeFace = gl.getActiveCubeFace();
    const mipLevel = gl.getActiveMipmapLevel();
    const scissorTest = gl.getScissorTest();
    const autoClear = gl.autoClear;
    const shadows = gl.shadowMap.enabled;
    gl.getViewport(saved.viewport);
    gl.getScissor(saved.scissor);
    try {
      gl.shadowMap.enabled = false;
      gl.autoClear = true;
      gl.setRenderTarget(output);
      gl.setScissorTest(false);
      gl.render(exterior.scene, exteriorCamera);
    } finally {
      gl.setRenderTarget(target, cubeFace, mipLevel);
      gl.setViewport(saved.viewport);
      gl.setScissor(saved.scissor);
      gl.setScissorTest(scissorTest);
      gl.shadowMap.enabled = shadows;
      gl.autoClear = autoClear;
    }
  }, 0.5);

  return <mesh name="Banpo Han River outlook" position={[-24, centerY, opening.centerZ]}
    rotation={[0, Math.PI / 2, 0]} frustumCulled={false} renderOrder={-100}
    raycast={() => undefined}>
    <planeGeometry args={[180, 84]} />
    <shaderMaterial name="Rendered Han River window" uniforms={uniforms} vertexShader={vertexShader}
      fragmentShader={fragmentShader} depthWrite={false} />
  </mesh>;
}
