import { Html, useGLTF, useTexture } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Vignette } from '@react-three/postprocessing';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { MonitorOS, OS_W, OS_H } from './os/MonitorOS';
import type { SceneMetrics } from './types';

// Scene by Henry Heffernan (portfolio-website, MIT) — baked models re-rendered in R3F,
// with our macOS mounted on the CRT instead of his inner-site.
const SCREEN_ZOOM_MS = 1100;
const HTML_PX_PER_UNIT = 39.6;

// his world is millimetre-ish scale
const CAMERA_POS = new THREE.Vector3(-20000, 12000, 20000);
const CAMERA_LOOK = new THREE.Vector3(0, -1000, 0);
const SCREEN_POS = new THREE.Vector3(0, 950, 255);
const SCREEN_ROT_X = -3 * THREE.MathUtils.DEG2RAD;
const SCREEN_W = 1280;
const SCREEN_H = 1024;

// our 16:9 OS letterboxed onto the 4:3 CRT
const OS_PLANE_W = SCREEN_W;
const OS_PLANE_H = (SCREEN_W / OS_W) * OS_H;
const OS_SCALE = (OS_PLANE_W * HTML_PX_PER_UNIT) / OS_W; // drei Html: world = px * scale / 39.6

// Henry's models are metre-scale and blown up x900 in his app — same here
const MODEL_SCALE = 900;

function BakedModel({ glb, map }: { glb: string; map: string }) {
  const gltf = useGLTF(glb);
  const texture = useTexture(map);
  const material = useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.flipY = false;
    texture.needsUpdate = true;
    return new THREE.MeshBasicMaterial({ map: texture });
  }, [texture]);
  useMemo(() => {
    gltf.scene.traverse((c) => {
      if ((c as THREE.Mesh).isMesh) (c as THREE.Mesh).material = material;
    });
  }, [gltf.scene, material]);
  return <primitive object={gltf.scene} scale={MODEL_SCALE} />;
}

export type HenrySceneProps = {
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

export function HenryScene({
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
}: HenrySceneProps) {
  const { camera, size } = useThree();
  const pointer = useRef({ x: 0, y: 0 });
  const lookCurrent = useRef(CAMERA_LOOK.clone());
  const screenAnim = useRef<{ phase: 'in' | 'out'; start: number | null; from: THREE.Vector3; lookFrom: THREE.Vector3; notified: boolean } | null>(null);

  useEffect(() => {
    const persp = camera as THREE.PerspectiveCamera;
    persp.fov = 35;
    persp.near = 10;
    persp.far = 900000;
    persp.updateProjectionMatrix();
    camera.position.copy(CAMERA_POS);
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
    if (screenAnim.current) {
      const anim = screenAnim.current;
      if (anim.start === null) anim.start = state.clock.elapsedTime;
      const t = Math.min(1, (state.clock.elapsedTime - anim.start) / (SCREEN_ZOOM_MS / 1000));
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const persp = camera as THREE.PerspectiveCamera;
      const halfV = THREE.MathUtils.degToRad(persp.fov / 2);
      const halfH = Math.atan(Math.tan(halfV) * (state.size.width / state.size.height));
      const dist = Math.max(
        OS_PLANE_W / 0.99 / (2 * Math.tan(halfH)),
        OS_PLANE_H / 0.99 / (2 * Math.tan(halfV)),
      );
      const focusPos = SCREEN_POS.clone().add(new THREE.Vector3(0, 0, dist));
      const toPos = anim.phase === 'in' ? focusPos : CAMERA_POS;
      const toLook = anim.phase === 'in' ? SCREEN_POS : CAMERA_LOOK;
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
      CAMERA_POS.x + pointer.current.x * 800,
      CAMERA_POS.y + pointer.current.y * 500,
      CAMERA_POS.z,
    );
    lookCurrent.current.lerp(CAMERA_LOOK, Math.min(1, 4 * delta));
    camera.lookAt(lookCurrent.current);
  });

  return (
    <>
      {effects && (
        <EffectComposer>
          <Vignette eskil={false} offset={0.12} darkness={0.55} />
        </EffectComposer>
      )}
      <color attach="background" args={['#0a0a0c']} />
      <BakedModel glb="/henry/environment.glb" map="/henry/baked_environment.jpg" />
      <BakedModel glb="/henry/computer_setup.glb" map="/henry/baked_computer.jpg" />
      <BakedModel glb="/henry/decor.glb" map="/henry/baked_decor.jpg" />

      {/* CRT screen: black 4:3 backing + our 16:9 OS letterboxed on it */}
      <group position={SCREEN_POS} rotation={[SCREEN_ROT_X, 0, 0]}>
        <mesh position={[0, 0, -1]}>
          <planeGeometry args={[SCREEN_W, SCREEN_H]} />
          <meshBasicMaterial color="#050506" />
        </mesh>
        <Html transform position={[0, 0, 1]} scale={OS_SCALE} zIndexRange={osActive ? [10, 0] : [-1, -10]}>
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
        {!osActive && (
          <mesh position={[0, 0, 0.5]} renderOrder={-100}>
            <planeGeometry args={[OS_PLANE_W, OS_PLANE_H]} />
            <meshBasicMaterial color="black" opacity={0} blending={THREE.NoBlending} />
          </mesh>
        )}
        {!osActive && (
          <mesh
            position={[0, 0, 2]}
            visible={false}
            onClick={(e) => {
              e.stopPropagation();
              onMonitorClick();
            }}
            onPointerOver={() => (document.body.style.cursor = 'pointer')}
            onPointerOut={() => (document.body.style.cursor = '')}
          >
            <planeGeometry args={[SCREEN_W, SCREEN_H]} />
          </mesh>
        )}
      </group>
    </>
  );
}
