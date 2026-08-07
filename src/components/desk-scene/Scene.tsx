import { Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Outline, Selection, Vignette } from '@react-three/postprocessing';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { ClockFace } from './ClockFace';
import { ACCENT, DESK_TOP_Y, PALETTE, deskObjects } from './config';
import { DeskObjectMesh } from './DeskObjectMesh';
import { FittedGlb } from './FittedGlb';
import { MonitorOS, type OsSkin } from './os/MonitorOS';
import { Terminal } from './Terminal';
import { useSun } from './useSun';
import type { SunState } from './sun';
import type { DeskObject, SceneMetrics } from './types';

const CAMERA_POS = new THREE.Vector3(0, 1.15, 1.02);
const CAMERA_LOOK = new THREE.Vector3(0, 1.12, -0.78);
const SCREEN_ZOOM_MS = 950;

// pseudo desk-object so the terminal can react to monitor hover
const MONITOR_HINT = {
  id: 'monitor',
  command: 'takos --wake',
  terminalLines: ['Wake the screen into full TakOS.', 'Every section opens here, as an app.'],
} as unknown as DeskObject;

const MONITOR = { center: [0, 1.16, -0.78] as const, screenW: 0.78, screenH: 0.44 };
// drei Html transform: 620px DOM at scale 0.1 measures 1.565 world units → px-per-unit ≈ 39.6
const screenScaleFor = (pxWidth: number) => (MONITOR.screenW * 39.6) / pxWidth;
const TERMINAL_SCALE = screenScaleFor(620);
// full-diegetic OS resolution on the screen plane (same 1.773 aspect as the screen)
export const OS_W = 1280;
export const OS_H = 722;
const OS_SCALE = screenScaleFor(OS_W);

function WindowSky({ colors }: { colors: [string, string] }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 128;
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  useEffect(() => {
    const canvas = texture.image as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, colors[0]);
    grad.addColorStop(1, colors[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    texture.needsUpdate = true;
  }, [texture, colors]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh position={[-1.88, 1.6, -1.75]} rotation={[0, Math.PI / 2, 0]}>
      <planeGeometry args={[1.34, 1.4]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}

function Room() {
  return (
    <group>
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[7, 6]} />
        <meshStandardMaterial color={PALETTE.floor} roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, -0.6]} receiveShadow>
        <planeGeometry args={[3.4, 2.4]} />
        <meshStandardMaterial color={PALETTE.rug} roughness={1} />
      </mesh>
      {/* back wall */}
      <mesh position={[0, 1.6, -2.6]} receiveShadow>
        <planeGeometry args={[7, 3.2]} />
        <meshStandardMaterial color={PALETTE.wallBack} roughness={0.95} />
      </mesh>
      {/* left wall with window opening (window spans z -2.4..-1.1, y 0.9..2.3) */}
      <group rotation={[0, Math.PI / 2, 0]} position={[-1.85, 0, 0]}>
        {/* below / above window (wall local +x = world -z) */}
        <mesh position={[0, 0.45, 0]} receiveShadow>
          <planeGeometry args={[6, 0.9]} />
          <meshStandardMaterial color={PALETTE.wallSide} roughness={0.95} />
        </mesh>
        <mesh position={[0, 2.75, 0]} receiveShadow>
          <planeGeometry args={[6, 0.9]} />
          <meshStandardMaterial color={PALETTE.wallSide} roughness={0.95} />
        </mesh>
        {/* behind window (toward back corner) */}
        <mesh position={[2.7, 1.6, 0]} receiveShadow>
          <planeGeometry args={[0.6, 1.4]} />
          <meshStandardMaterial color={PALETTE.wallSide} roughness={0.95} />
        </mesh>
        {/* in front of window (toward camera) */}
        <mesh position={[-0.95, 1.6, 0]} receiveShadow>
          <planeGeometry args={[4.1, 1.4]} />
          <meshStandardMaterial color={PALETTE.wallSide} roughness={0.95} />
        </mesh>
        {/* window frame: opening local x 1.1..2.4 */}
        {[2.27, 0.93].map((y, i) => (
          <mesh key={`h${i}`} position={[1.75, y, 0.02]}>
            <boxGeometry args={[1.42, 0.06, 0.06]} />
            <meshStandardMaterial color="#e0d8ca" roughness={0.8} />
          </mesh>
        ))}
        {[1.1, 1.75, 2.4].map((x, i) => (
          <mesh key={`v${i}`} position={[x, 1.6, 0.02]}>
            <boxGeometry args={[0.06, 1.46, 0.06]} />
            <meshStandardMaterial color="#e0d8ca" roughness={0.8} />
          </mesh>
        ))}
      </group>
      {/* right wall */}
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[2.9, 1.6, 0]} receiveShadow>
        <planeGeometry args={[6, 3.2]} />
        <meshStandardMaterial color={PALETTE.wallSide} roughness={0.95} />
      </mesh>
      {/* bookshelf against back wall, visible around the monitor */}
      <group position={[1.55, 0, -2.5]}>
        <mesh position={[0, 1.1, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.3, 2.2, 0.3]} />
          <meshStandardMaterial color={PALETTE.shelf} roughness={0.9} />
        </mesh>
        {[0.45, 0.95, 1.45, 1.95].map((y) =>
          [-0.42, -0.14, 0.14, 0.42].map((x, i) => (
            <mesh key={`${y}${x}`} position={[x, y, 0.17]} castShadow>
              <boxGeometry args={[0.2, 0.28 - (i % 2) * 0.05, 0.16]} />
              <meshStandardMaterial
                color={['#7a5c48', '#5d6e5f', '#8f8578', '#5c4a63', '#a4552f'][Math.floor(i + y * 10) % 5]}
                roughness={0.9}
              />
            </mesh>
          )),
        )}
      </group>
      {/* sofa + coffee table on the left, beyond the desk */}
      <group position={[-0.95, 0, -2.15]}>
        <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 0.44, 0.7]} />
          <meshStandardMaterial color={PALETTE.sofa} roughness={1} />
        </mesh>
        <mesh position={[0, 0.6, -0.28]} castShadow>
          <boxGeometry args={[1.5, 0.5, 0.18]} />
          <meshStandardMaterial color={PALETTE.sofa} roughness={1} />
        </mesh>
        {[-0.68, 0.68].map((x) => (
          <mesh key={x} position={[x, 0.5, 0]} castShadow>
            <boxGeometry args={[0.14, 0.24, 0.7]} />
            <meshStandardMaterial color={PALETTE.sofa} roughness={1} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Desk() {
  return (
    <group>
      <mesh position={[0, DESK_TOP_Y - 0.02, -0.55]} castShadow receiveShadow>
        <boxGeometry args={[2.5, 0.04, 1]} />
        <meshStandardMaterial color={PALETTE.deskTop} roughness={0.7} />
      </mesh>
      {[
        [-1.15, -0.12],
        [-1.15, -0.98],
        [1.15, -0.12],
        [1.15, -0.98],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, (DESK_TOP_Y - 0.04) / 2, z]} castShadow>
          <boxGeometry args={[0.06, DESK_TOP_Y - 0.04, 0.06]} />
          <meshStandardMaterial color={PALETTE.deskLeg} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function DeskProps({ lampOn }: { lampOn: number }) {
  return (
    <group>
      {/* desk lamp — becomes the key light after sunset */}
      <group position={[1.08, DESK_TOP_Y, -0.85]}>
        <mesh position={[0, 0.015, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.09, 0.03, 24]} />
          <meshStandardMaterial color={PALETTE.lampShade} roughness={0.5} />
        </mesh>
        <mesh position={[-0.05, 0.19, 0]} rotation={[0, 0, 0.5]} castShadow>
          <cylinderGeometry args={[0.012, 0.012, 0.36, 12]} />
          <meshStandardMaterial color={PALETTE.lampShade} roughness={0.5} />
        </mesh>
        <mesh position={[-0.16, 0.34, 0]} rotation={[0, 0, 0.9]} castShadow>
          <coneGeometry args={[0.075, 0.12, 24, 1, true]} />
          <meshStandardMaterial color={PALETTE.lampShade} roughness={0.5} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[-0.18, 0.315, 0]}>
          <sphereGeometry args={[0.028, 16, 16]} />
          <meshStandardMaterial
            color="#fff2d8"
            emissive="#ffc46b"
            emissiveIntensity={lampOn * 2.2}
            roughness={0.4}
          />
        </mesh>
      </group>
      {/* mug */}
      <mesh position={[0.42, DESK_TOP_Y + 0.045, -0.38]} castShadow>
        <cylinderGeometry args={[0.04, 0.036, 0.09, 20]} />
        <meshStandardMaterial color="#5d6e5f" roughness={0.6} />
      </mesh>
      {/* plant */}
      <group position={[-1.08, DESK_TOP_Y, -0.88]}>
        <mesh position={[0, 0.05, 0]} castShadow>
          <cylinderGeometry args={[0.055, 0.045, 0.1, 20]} />
          <meshStandardMaterial color="#9c6b4f" roughness={0.9} />
        </mesh>
        {[
          [0, 0.16, 0, 0.06],
          [0.05, 0.14, 0.02, 0.045],
          [-0.04, 0.15, -0.03, 0.05],
        ].map(([x, y, z, r], i) => (
          <mesh key={i} position={[x, y, z]} castShadow>
            <sphereGeometry args={[r, 12, 12]} />
            <meshStandardMaterial color="#4d6b4a" roughness={0.95} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// Personal deco objects (non-interactive) — Higgsfield GLBs of Tak's real desk items
function DecoGlbProps() {
  return (
    <group>
      {/* Mac mini beside the monitor stand */}
      <group position={[0.34, DESK_TOP_Y, -0.8]} rotation={[0, -0.2, 0]}>
        <FittedGlb url="/models/computer.glb" fit={0.2} fallback={null} />
      </group>
      {/* VW microbus with surfboard, parked by the monitor */}
      <group position={[-0.13, DESK_TOP_Y, -0.8]} rotation={[0, 0.55, 0]}>
        <FittedGlb url="/models/vwbus.glb" fit={0.17} fallback={null} />
      </group>
      {/* die-cast fire truck near the keyboard */}
      <group position={[-0.36, DESK_TOP_Y, -0.35]} rotation={[0, -0.45, 0]}>
        <FittedGlb url="/models/firetruck.glb" fit={0.13} fallback={null} />
      </group>
      {/* Bing surfboard leaning against the bookshelf's left edge */}
      <group position={[1.0, 0, -2.14]} rotation={[0, 0.25, -0.09]}>
        <FittedGlb url="/models/surfboard.glb" fit={1.35} fallback={null} />
      </group>
    </group>
  );
}

function Monitor({
  metrics,
  active,
  reducedMotion,
  daylight,
  onHover,
  onClick,
  osActive,
  osSkin,
  onSkinChange,
  onExit,
  launchApp,
}: {
  metrics: SceneMetrics;
  active: DeskObject | null;
  reducedMotion: boolean;
  daylight: number;
  onHover: (id: string | null) => void;
  onClick: () => void;
  osActive: boolean;
  osSkin: OsSkin;
  onSkinChange: (skin: OsSkin) => void;
  onExit: () => void;
  launchApp: { id: string; seq: number } | null;
}) {
  const [cx, cy, cz] = MONITOR.center;
  return (
    <group position={[cx, cy, cz]}>
      {/* shell */}
      <mesh castShadow>
        <boxGeometry args={[MONITOR.screenW + 0.06, MONITOR.screenH + 0.06, 0.045]} />
        <meshStandardMaterial color={PALETTE.monitorShell} roughness={0.55} />
      </mesh>
      {/* stand */}
      <mesh position={[0, -(MONITOR.screenH / 2) - 0.11, -0.01]} castShadow>
        <cylinderGeometry args={[0.022, 0.028, 0.2, 16]} />
        <meshStandardMaterial color={PALETTE.monitorShell} roughness={0.55} />
      </mesh>
      <mesh position={[0, cy * -1 + DESK_TOP_Y + 0.012, 0]} castShadow>
        <boxGeometry args={[0.26, 0.024, 0.17]} />
        <meshStandardMaterial color={PALETTE.monitorShell} roughness={0.55} />
      </mesh>
      {/* screen backing (visible while the DOM terminal loads) */}
      <mesh position={[0, 0, 0.024]}>
        <planeGeometry args={[MONITOR.screenW, MONITOR.screenH]} />
        <meshStandardMaterial color="#101216" roughness={0.35} emissive="#1c2026" emissiveIntensity={0.6} />
      </mesh>
      {/* screen content lives ON the monitor plane, always — full diegetic.
          click/hover live on the DOM itself (drei Html's inner wrapper swallows canvas raycasts) */}
      {osActive ? (
        <Html transform position={[0, 0, 0.026]} scale={OS_SCALE} zIndexRange={[10, 0]}>
          <div
            style={{
              width: OS_W,
              height: OS_H,
              position: 'relative',
              overflow: 'hidden',
              filter: `brightness(${0.96 + daylight * 0.06})`,
            }}
          >
            <MonitorOS
              metrics={metrics}
              skin={osSkin}
              onSkinChange={onSkinChange}
              onExit={onExit}
              reducedMotion={reducedMotion}
              launchApp={launchApp}
            />
          </div>
        </Html>
      ) : (
        <Html transform position={[0, 0, 0.026]} scale={TERMINAL_SCALE} zIndexRange={[10, 0]}>
          <div
            style={{ cursor: 'pointer', filter: `brightness(${0.94 + daylight * 0.08})` }}
            onMouseEnter={() => onHover('monitor')}
            onMouseLeave={() => onHover(null)}
            onClick={onClick}
            role="button"
            aria-label="Sit down at the monitor"
          >
            <Terminal metrics={metrics} active={active} reducedMotion={reducedMotion} />
          </div>
        </Html>
      )}
    </group>
  );
}

function Lights({ sun }: { sun: SunState }) {
  const dirRef = useRef<THREE.DirectionalLight>(null);
  const target = useMemo(() => {
    const t = new THREE.Object3D();
    t.position.set(0.4, DESK_TOP_Y, -0.5);
    return t;
  }, []);

  const lampPower = sun.lamp;
  // sun enters through the left window; height follows altitude, reach follows azimuth
  const altRad = (Math.max(sun.altitude, 0) * Math.PI) / 180;
  const azRad = (sun.azimuth * Math.PI) / 180;
  const sunY = 0.9 + Math.sin(altRad) * 3.2;
  const sunZ = -1.75 - Math.sin(azRad) * 1.2; // morning light rakes in from the back, evening from the front

  return (
    <group>
      <hemisphereLight args={[sun.skyColor, '#4a453d', sun.ambientIntensity]} />
      <ambientLight intensity={0.08 + sun.daylight * 0.18} color={sun.skyColor} />
      {sun.sunIntensity > 0.01 && (
        <>
          <directionalLight
            ref={dirRef}
            position={[-4.2, sunY, sunZ]}
            color={sun.sunColor}
            intensity={sun.sunIntensity}
            target={target}
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-camera-near={0.5}
            shadow-camera-far={12}
            shadow-camera-left={-3}
            shadow-camera-right={3}
            shadow-camera-top={3}
            shadow-camera-bottom={-3}
            shadow-bias={-0.0004}
          />
          <primitive object={target} />
        </>
      )}
      {/* faint moonlight through the window at night */}
      {sun.daylight < 0.4 && (
        <directionalLight
          position={[-4, 2.6, -0.2]}
          color="#7d90b8"
          intensity={(0.4 - sun.daylight) * 0.45}
        />
      )}
      {/* desk lamp — key light after dusk */}
      <pointLight
        position={[0.88, DESK_TOP_Y + 0.32, -0.82]}
        color="#ffc98a"
        intensity={lampPower * 1.8}
        distance={3.2}
        decay={1.8}
        castShadow={false}
      />
      {/* monitor glow onto the desk */}
      <pointLight position={[0, 1.1, -0.6]} color="#aebccb" intensity={0.25 + (1 - sun.daylight) * 0.35} distance={1.6} decay={2} />
      <WindowSky colors={sun.windowSky} />
      <DeskProps lampOn={lampPower} />
      {/* bounce fill from the window side during the day */}
      <pointLight position={[-1.4, 1.8, -1.2]} color={sun.sunColor} intensity={sun.daylight * 0.9} distance={5} decay={2} />
    </group>
  );
}

export type SceneProps = {
  metrics: SceneMetrics;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onActivate: (object: DeskObject) => void;
  launchApp: { id: string; seq: number } | null;
  screenFocus: boolean;
  onScreenZoomed: () => void;
  onMonitorClick: () => void;
  osActive: boolean;
  osSkin: OsSkin;
  onSkinChange: (skin: OsSkin) => void;
  onOsExit: () => void;
  reducedMotion: boolean;
  parallax: boolean;
  effects: boolean;
};

export function Scene({
  metrics,
  hoveredId,
  onHover,
  onActivate,
  launchApp,
  screenFocus,
  onScreenZoomed,
  onMonitorClick,
  osActive,
  osSkin,
  onSkinChange,
  onOsExit,
  reducedMotion,
  parallax,
  effects,
}: SceneProps) {
  const { camera, size } = useThree();
  const sun = useSun();
  const pointer = useRef({ x: 0, y: 0 });
  const lookCurrent = useRef(CAMERA_LOOK.clone());
  const basePos = useRef(CAMERA_POS.clone());
  const screenAnim = useRef<{ phase: 'in' | 'out'; start: number | null; from: THREE.Vector3; lookFrom: THREE.Vector3; notified: boolean } | null>(null);

  // narrow viewports pull the camera back and widen the fov so the monitor stays framed
  useEffect(() => {
    const aspect = size.width / size.height;
    const persp = camera as THREE.PerspectiveCamera;
    persp.fov = aspect < 0.8 ? 60 : aspect < 1.2 ? 53 : 48;
    persp.updateProjectionMatrix();
    basePos.current.set(CAMERA_POS.x, CAMERA_POS.y, aspect < 0.8 ? 1.85 : aspect < 1.2 ? 1.35 : CAMERA_POS.z);
    camera.position.copy(basePos.current);
    camera.lookAt(CAMERA_LOOK);
  }, [camera, size]);

  useEffect(() => {
    document.body.style.cursor = hoveredId ? 'pointer' : '';
    return () => {
      document.body.style.cursor = '';
    };
  }, [hoveredId]);

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
    // monitor screen focus animation takes priority over everything
    if (screenAnim.current) {
      const anim = screenAnim.current;
      if (anim.start === null) anim.start = state.clock.elapsedTime;
      const t = Math.min(1, (state.clock.elapsedTime - anim.start) / (SCREEN_ZOOM_MS / 1000));
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; // ease-in-out cubic
      const [mx, my, mz] = MONITOR.center;
      const persp = camera as THREE.PerspectiveCamera;
      const halfV = THREE.MathUtils.degToRad(persp.fov / 2);
      const halfH = Math.atan(Math.tan(halfV) * (state.size.width / state.size.height));
      const dist = Math.max(
        MONITOR.screenW / 0.92 / (2 * Math.tan(halfH)),
        MONITOR.screenH / 0.92 / (2 * Math.tan(halfV)),
      );
      const screenPos = new THREE.Vector3(mx, my, mz + 0.03 + dist);
      const screenLook = new THREE.Vector3(mx, my, mz);
      const toPos = anim.phase === 'in' ? screenPos : basePos.current;
      const toLook = anim.phase === 'in' ? screenLook : CAMERA_LOOK;
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
    // idle: micro parallax
    if (parallax && !reducedMotion) {
      pointer.current.x = THREE.MathUtils.damp(pointer.current.x, state.pointer.x, 3, delta);
      pointer.current.y = THREE.MathUtils.damp(pointer.current.y, state.pointer.y, 3, delta);
    }
    camera.position.set(
      basePos.current.x + pointer.current.x * 0.045,
      basePos.current.y + pointer.current.y * 0.03,
      basePos.current.z,
    );
    lookCurrent.current.lerp(CAMERA_LOOK, Math.min(1, 4 * delta));
    camera.lookAt(lookCurrent.current);
  });

  const activeObject =
    deskObjects.find((o) => o.id === hoveredId) ?? (hoveredId === 'monitor' ? MONITOR_HINT : null);

  return (
    <Selection>
      {effects && (
        <EffectComposer autoClear={false} multisampling={4}>
          <Outline
            blur
            edgeStrength={4.5}
            visibleEdgeColor={new THREE.Color(ACCENT).getHex()}
            hiddenEdgeColor={0x000000}
            width={1200}
          />
          <Vignette eskil={false} offset={0.15} darkness={0.45} />
        </EffectComposer>
      )}
      <Lights sun={sun} />
      <Room />
      <Desk />
      <DecoGlbProps />
      <Monitor
        metrics={metrics}
        active={activeObject}
        reducedMotion={reducedMotion}
        daylight={sun.daylight}
        onHover={onHover}
        onClick={onMonitorClick}
        osActive={osActive}
        osSkin={osSkin}
        onSkinChange={onSkinChange}
        onExit={onOsExit}
        launchApp={launchApp}
      />
      {deskObjects.map((object) => (
        <DeskObjectMesh
          key={object.id}
          object={object}
          hovered={hoveredId === object.id}
          reducedMotion={reducedMotion}
          onHover={onHover}
          onActivate={(id) => {
            const found = deskObjects.find((o) => o.id === id);
            if (found) onActivate(found);
          }}
        />
      ))}
      {/* live clock face overlaid on the flip-clock GLB's blank cards */}
      <group
        position={deskObjects.find((o) => o.id === 'clock')!.position}
        rotation={deskObjects.find((o) => o.id === 'clock')!.rotation}
      >
        <ClockFace position={[0, 0.104, 0.055]} />
      </group>
    </Selection>
  );
}
