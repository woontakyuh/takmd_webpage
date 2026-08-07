import { Html, useGLTF, useTexture } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Vignette } from '@react-three/postprocessing';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { MonitorOS, OS_W, OS_H } from './os/MonitorOS';
import { useSun } from './useSun';
import type { SceneMetrics } from './types';

// Room by Bruno Simon (my-room-in-3d, MIT) — baked-lighting pipeline preserved,
// night mix re-driven by the visitor's local sun.
const SCREEN_ZOOM_MS = 1100;
// drei Html transform: px-per-world-unit ≈ 39.6 at scale 1
const HTML_PX_PER_UNIT = 39.6;

const CAMERA_RADIUS = 30;
const CAMERA_PHI = Math.PI * 0.35;
const CAMERA_THETA = -Math.PI * 0.25;
const CAMERA_POS = new THREE.Vector3().setFromSpherical(
  new THREE.Spherical(CAMERA_RADIUS, CAMERA_PHI, CAMERA_THETA),
);
const CAMERA_LOOK = new THREE.Vector3(0, 2, 0);

const BAKED_VERT = `
varying vec2 vUv;
void main() {
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  vUv = uv;
}`;

const BAKED_FRAG = `
uniform sampler2D uBakedDayTexture;
uniform sampler2D uBakedNightTexture;
uniform sampler2D uBakedNeutralTexture;
uniform sampler2D uLightMapTexture;
uniform float uNightMix;
uniform float uNeutralMix;
uniform vec3 uLightTvColor;
uniform float uLightTvStrength;
uniform vec3 uLightDeskColor;
uniform float uLightDeskStrength;
uniform vec3 uLightPcColor;
uniform float uLightPcStrength;
varying vec2 vUv;

vec3 blendLighten(vec3 base, vec3 blend, float opacity) {
  return max(base, blend) * opacity + base * (1.0 - opacity);
}

void main() {
  vec3 bakedDayColor = texture2D(uBakedDayTexture, vUv).rgb;
  vec3 bakedNightColor = texture2D(uBakedNightTexture, vUv).rgb;
  vec3 bakedNeutralColor = texture2D(uBakedNeutralTexture, vUv).rgb;
  vec3 bakedColor = mix(mix(bakedDayColor, bakedNightColor, uNightMix), bakedNeutralColor, uNeutralMix);
  vec3 lightMapColor = texture2D(uLightMapTexture, vUv).rgb;

  bakedColor = blendLighten(bakedColor, uLightTvColor, lightMapColor.r * uLightTvStrength);
  bakedColor = blendLighten(bakedColor, uLightPcColor, lightMapColor.b * uLightPcStrength);
  bakedColor = blendLighten(bakedColor, uLightDeskColor, lightMapColor.g * uLightDeskStrength);

  gl_FragColor = vec4(bakedColor, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

function useBakedMaterial(nightMix: number) {
  const [day, night, neutral, lightMap] = useTexture([
    '/room/bakedDay.jpg',
    '/room/bakedNight.jpg',
    '/room/bakedNeutral.jpg',
    '/room/lightMap.jpg',
  ]);
  const material = useMemo(() => {
    for (const t of [day, night, neutral]) {
      t.colorSpace = THREE.SRGBColorSpace;
      t.flipY = false;
      t.needsUpdate = true;
    }
    lightMap.flipY = false;
    lightMap.needsUpdate = true;
    return new THREE.ShaderMaterial({
      uniforms: {
        uBakedDayTexture: { value: day },
        uBakedNightTexture: { value: night },
        uBakedNeutralTexture: { value: neutral },
        uLightMapTexture: { value: lightMap },
        uNightMix: { value: 1 },
        uNeutralMix: { value: 0 },
        uLightTvColor: { value: new THREE.Color('#ff115e') },
        uLightTvStrength: { value: 1.47 },
        uLightDeskColor: { value: new THREE.Color('#ff6700') },
        uLightDeskStrength: { value: 1.9 },
        uLightPcColor: { value: new THREE.Color('#0082ff') },
        uLightPcStrength: { value: 1.4 },
      },
      vertexShader: BAKED_VERT,
      fragmentShader: BAKED_FRAG,
    });
  }, [day, night, neutral, lightMap]);
  useEffect(() => {
    material.uniforms.uNightMix.value = nightMix;
  }, [material, nightMix]);
  return material;
}

type ScreenSurface = {
  center: THREE.Vector3;
  normal: THREE.Vector3;
  quaternion: THREE.Quaternion;
  width: number;
  height: number;
  aspect: number;
};

function measureScreen(scene: THREE.Object3D): ScreenSurface | null {
  let mesh: THREE.Mesh | null = null;
  scene.traverse((c) => {
    if (!mesh && (c as THREE.Mesh).isMesh) mesh = c as THREE.Mesh;
  });
  if (!mesh) return null;
  const m = mesh as THREE.Mesh;
  m.updateWorldMatrix(true, false);
  const box = new THREE.Box3().setFromObject(m);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  // world-space normal: average vertex normals, or first-triangle face normal when absent
  const avg = new THREE.Vector3();
  const normalAttr = m.geometry.attributes.normal;
  if (normalAttr) {
    const nm = new THREE.Matrix3().getNormalMatrix(m.matrixWorld);
    const tmp = new THREE.Vector3();
    for (let i = 0; i < normalAttr.count; i++) {
      avg.add(tmp.fromBufferAttribute(normalAttr, i));
    }
    avg.divideScalar(normalAttr.count).applyMatrix3(nm).normalize();
  } else {
    const pos = m.geometry.attributes.position;
    const idx = m.geometry.index;
    const vi = (i: number) => (idx ? idx.getX(i) : i);
    const a = new THREE.Vector3().fromBufferAttribute(pos, vi(0)).applyMatrix4(m.matrixWorld);
    const b = new THREE.Vector3().fromBufferAttribute(pos, vi(1)).applyMatrix4(m.matrixWorld);
    const c2 = new THREE.Vector3().fromBufferAttribute(pos, vi(2)).applyMatrix4(m.matrixWorld);
    avg.crossVectors(b.sub(a), c2.sub(a)).normalize();
  }
  // make sure it points into the room (toward the default camera corner)
  if (avg.dot(new THREE.Vector3().subVectors(CAMERA_POS, center)) < 0) avg.negate();
  // width = footprint in the horizontal plane, height = vertical extent
  const width = Math.hypot(size.x, size.z);
  const height = size.y;
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), avg);
  return { center, normal: avg, quaternion, width, height, aspect: width / height };
}

export type RoomSceneProps = {
  metrics: SceneMetrics;
  launchApp: { id: string; seq: number } | null;
  screenFocus: boolean;
  onScreenZoomed: () => void;
  onMonitorClick: () => void;
  osActive: boolean;
  onOsExit: () => void;
  reducedMotion: boolean;
  parallax: boolean;
  effects: boolean;
};

export function RoomScene({
  metrics,
  launchApp,
  screenFocus,
  onScreenZoomed,
  onMonitorClick,
  osActive,
  onOsExit,
  reducedMotion,
  parallax,
  effects,
}: RoomSceneProps) {
  const { camera, size } = useThree();
  const sun = useSun();
  const material = useBakedMaterial(1 - sun.daylight);

  const room = useGLTF('/room/roomModel.glb');
  const pcScreen = useGLTF('/room/pcScreenModel.glb');
  const macScreen = useGLTF('/room/macScreenModel.glb');

  useMemo(() => {
    room.scene.traverse((c) => {
      if ((c as THREE.Mesh).isMesh) (c as THREE.Mesh).material = material;
    });
  }, [room.scene, material]);

  // measure both candidate screens, mount the OS on the one closest to the OS aspect
  const surfaces = useMemo(() => {
    const pc = measureScreen(pcScreen.scene);
    const mac = measureScreen(macScreen.scene);
    const osAspect = OS_W / OS_H;
    let host = pc;
    let other = mac;
    if (pc && mac && Math.abs(mac.aspect - osAspect) < Math.abs(pc.aspect - osAspect)) {
      host = mac;
      other = pc;
    }
    // eslint-disable-next-line no-console
    console.log(
      '[room] pc',
      pc && { c: pc.center.toArray().map((v) => +v.toFixed(2)), w: +pc.width.toFixed(2), h: +pc.height.toFixed(2), n: pc.normal.toArray().map((v) => +v.toFixed(2)) },
      'mac',
      mac && { c: mac.center.toArray().map((v) => +v.toFixed(2)), w: +mac.width.toFixed(2), h: +mac.height.toFixed(2), n: mac.normal.toArray().map((v) => +v.toFixed(2)) },
    );
    return { host, other };
  }, [pcScreen.scene, macScreen.scene]);

  // OS plane sizing: fit inside the host screen by height (pillarbox on ultrawide)
  const osPlane = useMemo(() => {
    const host = surfaces.host;
    if (!host) return null;
    const osAspect = OS_W / OS_H;
    let h = host.height;
    let w = h * osAspect;
    if (w > host.width) {
      w = host.width;
      h = w / osAspect;
    }
    return {
      position: host.center.clone().add(host.normal.clone().multiplyScalar(0.03)),
      quaternion: host.quaternion,
      scale: (w * HTML_PX_PER_UNIT) / OS_W,
      width: w,
      height: h,
    };
  }, [surfaces]);

  // dark glass on both screen meshes (the OS floats just in front of the host)
  useMemo(() => {
    const dark = new THREE.MeshBasicMaterial({ color: '#0a0c10' });
    for (const s of [pcScreen.scene, macScreen.scene]) {
      s.traverse((c) => {
        if ((c as THREE.Mesh).isMesh) (c as THREE.Mesh).material = dark;
      });
    }
  }, [pcScreen.scene, macScreen.scene]);

  const pointer = useRef({ x: 0, y: 0 });
  const lookCurrent = useRef(CAMERA_LOOK.clone());
  const basePos = useRef(CAMERA_POS.clone());
  const screenAnim = useRef<{ phase: 'in' | 'out'; start: number | null; from: THREE.Vector3; lookFrom: THREE.Vector3; notified: boolean } | null>(null);

  useEffect(() => {
    const aspect = size.width / size.height;
    const persp = camera as THREE.PerspectiveCamera;
    persp.fov = aspect < 0.8 ? 34 : aspect < 1.2 ? 28 : 24;
    persp.updateProjectionMatrix();
    camera.position.copy(basePos.current);
    camera.lookAt(CAMERA_LOOK);
  }, [camera, size]);

  useEffect(() => {
    if (screenFocus) {
      if (reducedMotion) {
        onScreenZoomed();
        return;
      }
      screenAnim.current = { phase: 'in', start: null, from: camera.position.clone(), lookFrom: lookCurrent.current.clone(), notified: false };
    } else if (screenAnim.current) {
      screenAnim.current = { phase: 'out', start: null, from: camera.position.clone(), lookFrom: lookCurrent.current.clone(), notified: true };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenFocus]);

  useFrame((state, delta) => {
    if (screenAnim.current && osPlane) {
      const anim = screenAnim.current;
      if (anim.start === null) anim.start = state.clock.elapsedTime;
      const t = Math.min(1, (state.clock.elapsedTime - anim.start) / (SCREEN_ZOOM_MS / 1000));
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const persp = camera as THREE.PerspectiveCamera;
      const halfV = THREE.MathUtils.degToRad(persp.fov / 2);
      const halfH = Math.atan(Math.tan(halfV) * (state.size.width / state.size.height));
      const dist = Math.max(
        osPlane.width / 0.99 / (2 * Math.tan(halfH)),
        osPlane.height / 0.99 / (2 * Math.tan(halfV)),
      );
      const surface = surfaces.host!;
      const focusPos = surface.center.clone().add(surface.normal.clone().multiplyScalar(dist));
      const toPos = anim.phase === 'in' ? focusPos : basePos.current;
      const toLook = anim.phase === 'in' ? surface.center : CAMERA_LOOK;
      camera.position.lerpVectors(anim.from, toPos, e);
      lookCurrent.current.lerpVectors(anim.lookFrom, toLook, e);
      camera.lookAt(lookCurrent.current);
      if (t >= 1) {
        if (anim.phase === 'in' && !anim.notified) {
          anim.notified = true;
          onScreenZoomed();
        }
        if (anim.phase === 'out') screenAnim.current = null;
      }
      return;
    }
    if (parallax && !reducedMotion) {
      pointer.current.x = THREE.MathUtils.damp(pointer.current.x, state.pointer.x, 3, delta);
      pointer.current.y = THREE.MathUtils.damp(pointer.current.y, state.pointer.y, 3, delta);
    }
    camera.position.set(
      basePos.current.x + pointer.current.x * 0.6,
      basePos.current.y + pointer.current.y * 0.4,
      basePos.current.z,
    );
    lookCurrent.current.lerp(CAMERA_LOOK, Math.min(1, 4 * delta));
    camera.lookAt(lookCurrent.current);
  });

  return (
    <>
      {effects && (
        <EffectComposer>
          <Vignette eskil={false} offset={0.12} darkness={0.5} />
        </EffectComposer>
      )}
      <primitive object={room.scene} />
      <primitive object={pcScreen.scene} />
      <primitive object={macScreen.scene} />
      {osPlane && (
        <group position={osPlane.position} quaternion={osPlane.quaternion}>
          <Html transform position={[0, 0, 0.001]} scale={osPlane.scale} zIndexRange={[10, 0]}>
            <div style={{ width: OS_W, height: OS_H, position: 'relative', overflow: 'hidden' }}>
              <MonitorOS
                metrics={metrics}
                interactive={osActive}
                onWake={onMonitorClick}
                onExit={onOsExit}
                reducedMotion={reducedMotion}
                launchApp={launchApp}
              />
            </div>
          </Html>
        </group>
      )}
    </>
  );
}
