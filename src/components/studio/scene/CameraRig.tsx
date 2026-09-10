import { useArrangement, moveFocus } from '../arrangement';
import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { MathUtils, Mesh, PerspectiveCamera, Vector2, Vector3 } from 'three';
import type { Camera, Object3D } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { StudioSceneProps } from '../types';
import { FOCUS, focusFov, MOBILE_FOCUS, MOBILE_TOUR, MOTION, SIDE_READER_SPACE, TOUR } from './config';
import type { CameraPose } from './config';
import { cancelSceneSingleAction, zoomPoseForPoint } from './sceneGesture';
import { useSceneInspection } from './SceneInspection';
import { monitorReadingPose, monitorReadingFov } from './monitorReading';
import { isSceneKeyboardEvent, panCameraWithArrow } from './cameraKeyboard';
import { awardPairReadingFov, awardPairReadingLayout } from './awardPairReading';

type CameraRigProps = Pick<StudioSceneProps,
  'selected' | 'compact' | 'reducedMotion' | 'viewCommand' | 'onReady' | 'bookshelfVisit'> & { readonly reading: boolean };

type SavedPose = {
  readonly position: Vector3;
  readonly target: Vector3;
};

type TransitionKind = 'focus' | 'guide' | 'return' | 'inspect' | 'restore-inspection' | 'object' | 'restore-object';
type Transition = {
  readonly kind: TransitionKind;
  readonly position: Vector3;
  readonly target: Vector3;
};

const CAMERA_TOLERANCE = 0.002;
const KEY_ZOOM_SCALE = 1 / 1.12;
const FREE_ORBIT_LIMITS = { minDistance: 0.10, maxDistance: 15, minPolarAngle: 0.3, maxPolarAngle: Math.PI / 2 } as const;
const FOCUSED_ORBIT_LIMITS = { minDistance: 0.08, maxDistance: 5.5, minPolarAngle: 0.35, maxPolarAngle: 1.52 } as const;

function toTransition(kind: TransitionKind, pose: CameraPose): Transition {
  return {
    kind,
    position: new Vector3(...pose.position),
    target: new Vector3(...pose.target),
  };
}

function clearOrbitMomentum(camera: Camera, orbit: OrbitControlsImpl): void {
  const position = camera.position.clone();
  const target = orbit.target.clone();
  const damping = orbit.enableDamping;
  orbit.enableDamping = false;
  orbit.update();
  camera.position.copy(position);
  orbit.target.copy(target);
  orbit.update();
  orbit.enableDamping = damping;
}

function applyOrbitLimits(orbit: OrbitControlsImpl, focused: boolean): void {
  const limits = focused ? FOCUSED_ORBIT_LIMITS : FREE_ORBIT_LIMITS;
  orbit.minDistance = limits.minDistance;
  orbit.maxDistance = limits.maxDistance;
  orbit.minPolarAngle = limits.minPolarAngle;
  orbit.maxPolarAngle = limits.maxPolarAngle;
}

function isSceneControl(object: Object3D): boolean {
  let current: Object3D | null = object;
  while (current) {
    if (current.userData.sceneControl === true) return true;
    current = current.parent;
  }
  return false;
}

function isVisibleSurface(object: Object3D): boolean {
  let current: Object3D | null = object;
  while (current) {
    if (!current.visible) return false;
    current = current.parent;
  }
  if (!(object instanceof Mesh)) return false;
  const materials = Array.isArray(object.material) ? object.material : [object.material];
  return materials.some(material => material.visible && material.colorWrite
    && (isSceneControl(object) || !material.transparent || material.opacity > 0.1));
}

export function CameraRig({ selected, compact, reducedMotion, viewCommand, onReady, bookshelfVisit, reading }: CameraRigProps) {
  const { editing, layout } = useArrangement();
  const { inspection, setInspection } = useSceneInspection();
  const screenFocused = selected === 'education' || selected === 'ai';
  const screenReading = screenFocused && reading;
  const { camera, size, gl, raycaster, scene, setFrameloop } = useThree();
  const controls = useRef<OrbitControlsImpl>(null);
  const transition = useRef<Transition | null>(null);
  const savedFreePose = useRef<SavedPose | null>(null);
  const inspectionReturnPose = useRef<SavedPose | null>(null);
  const objectReturnPose = useRef<SavedPose | null>(null);
  const previousObject = useRef(inspection);
  const focusPose = useCallback(() => moveFocus(selected === 'ai' ? monitorReadingPose()
    : (compact ? MOBILE_FOCUS : FOCUS)[selected ?? 'research'], selected ?? 'research', layout), [selected, compact, layout]);
  const activeView = useRef<0 | 1 | 2>(viewCommand.view);
  const lastViewSequence = useRef(viewCommand.sequence);
  const previousSelected = useRef(selected);
  const userMoved = useRef(false);
  const ready = useRef(false);
  const targetFov = useRef(42);
  const initialPose = useRef((compact ? MOBILE_TOUR : TOUR)[viewCommand.view]);
  const scratch = useMemo(() => ({ pointer: new Vector2(), position: new Vector3(), target: new Vector3() }), []);

  const surfaceAt = useCallback((clientX: number, clientY: number) => {
    const bounds = gl.domElement.getBoundingClientRect();
    scratch.pointer.set(
      ((clientX - bounds.left) / bounds.width) * 2 - 1,
      -((clientY - bounds.top) / bounds.height) * 2 + 1,
    );
    raycaster.setFromCamera(scratch.pointer, camera);
    return raycaster.intersectObjects(scene.children, true).find(hit => isVisibleSurface(hit.object));
  }, [camera, gl, raycaster, scene, scratch]);

  const zoomAt = useCallback((clientX: number, clientY: number, scale: number) => {
    const orbit = controls.current;
    if (editing || !orbit?.enabled || transition.current) return;
    clearOrbitMomentum(camera, orbit);
    const hit = surfaceAt(clientX, clientY);
    const forward = camera.getWorldDirection(scratch.position);
    const alignment = Math.max(0.1, raycaster.ray.direction.dot(forward));
    const currentDepth = camera.position.distanceTo(orbit.target);
    // Rebase the orbit plane onto real geometry, keeping the viewing direction unchanged.
    const depth = scale < 1 && hit
      ? MathUtils.clamp(hit.distance * alignment, orbit.minDistance, orbit.maxDistance)
      : currentDepth;
    const nextDepth = MathUtils.clamp(depth * scale, orbit.minDistance, orbit.maxDistance);
    camera.position.addScaledVector(raycaster.ray.direction, (depth - nextDepth) / alignment);
    orbit.target.copy(camera.position).addScaledVector(forward, nextDepth);
    orbit.update();
    userMoved.current = true;
  }, [camera, raycaster, scratch, surfaceAt, editing]);

  const finishTransition = useCallback((value: Transition, orbit: OrbitControlsImpl) => {
    camera.position.copy(value.position);
    orbit.target.copy(value.target);
    if (camera instanceof PerspectiveCamera) { camera.fov = targetFov.current; camera.updateProjectionMatrix(); }
    if (value.kind === 'focus') applyOrbitLimits(orbit, true);
    if (screenFocused) orbit.maxPolarAngle = Math.PI;
    if (value.kind === 'return') applyOrbitLimits(orbit, false);
    if (value.kind === 'inspect' || value.kind === 'restore-inspection' || value.kind === 'object' || value.kind === 'restore-object') applyOrbitLimits(orbit, selected !== null);
    orbit.update();
    transition.current = null;
    if (value.kind === 'return') savedFreePose.current = null;
    if (value.kind === 'restore-inspection') inspectionReturnPose.current = null;
    if (value.kind === 'restore-object') objectReturnPose.current = null;
    orbit.enabled = !screenReading && !editing;
  }, [camera, selected, screenFocused, screenReading, editing]);

  useLayoutEffect(() => {
    const orbit = controls.current;
    if (!orbit) return;
    camera.position.set(...initialPose.current.position);
    orbit.target.set(...initialPose.current.target);
    applyOrbitLimits(orbit, false);
    orbit.update();
  }, [camera]);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setFrameloop(entry?.isIntersecting ? 'always' : 'never');
    }, { rootMargin: '100px' });
    observer.observe(gl.domElement);
    return () => observer.disconnect();
  }, [gl, setFrameloop]);

  useEffect(() => {
    const canvas = gl.domElement;
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      const unit = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? canvas.clientHeight : 1;
      const pixels = MathUtils.clamp(event.deltaY * unit * (event.ctrlKey ? 8 : 1), -160, 160);
      if (pixels !== 0) zoomAt(event.clientX, event.clientY, Math.exp(pixels * 0.002));
    };
    const handleTouchStart = (event: TouchEvent) => {
      const orbit = controls.current;
      if (event.touches.length !== 2 || !orbit?.enabled || transition.current) return;
      const [first, second] = event.touches;
      const hit = surfaceAt((first.clientX + second.clientX) / 2, (first.clientY + second.clientY) / 2);
      if (!hit) return;
      const forward = camera.getWorldDirection(scratch.position);
      const depth = MathUtils.clamp(hit.distance * raycaster.ray.direction.dot(forward), orbit.minDistance, orbit.maxDistance);
      orbit.target.copy(camera.position).addScaledVector(forward, depth);
      orbit.update();
    };
    canvas.addEventListener('wheel', handleWheel, { capture: true, passive: false });
    canvas.addEventListener('touchstart', handleTouchStart, { capture: true, passive: true });
    return () => {
      canvas.removeEventListener('wheel', handleWheel, true);
      canvas.removeEventListener('touchstart', handleTouchStart, true);
    };
  }, [camera, gl, raycaster, scratch, surfaceAt, zoomAt]);

  useEffect(() => {
    const orbit = controls.current;
    if (!orbit) return;
    let touchStart: { id: number; x: number; y: number } | null = null;
    let lastTap: { time: number; x: number; y: number } | null = null;
    let touchZoomTime = 0;
    const inspectAt = (x: number, y: number) => {
      if (editing || screenReading) return;
      cancelSceneSingleAction(gl.domElement);
      const hit = surfaceAt(x, y);
      if (!hit) return;
      orbit.enabled = false;
      clearOrbitMomentum(camera, orbit);
      if (!inspectionReturnPose.current) inspectionReturnPose.current = { position: camera.position.clone(), target: orbit.target.clone() };
      window.dispatchEvent(new CustomEvent('office:zoomed', { detail: true }));
      const pose = zoomPoseForPoint(camera.position, hit.point);
      transition.current = { kind: 'inspect', position: pose.position, target: pose.target };
      userMoved.current = true;
    };
    const restoreZoom = () => {
      const saved = inspectionReturnPose.current;
      if (!saved) return;
      orbit.enabled = false;
      transition.current = { kind: 'restore-inspection', position: saved.position.clone(), target: saved.target.clone() };
      window.dispatchEvent(new CustomEvent('office:zoomed', { detail: false }));
    };
    const escapeZoom = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && inspectionReturnPose.current) { event.preventDefault(); event.stopImmediatePropagation(); restoreZoom(); }
    };
    window.addEventListener('office:zoom-close', restoreZoom);
    window.addEventListener('keydown', escapeZoom, true);
    const handleDoubleClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.shiftKey || event.ctrlKey || event.metaKey || event.altKey
        || performance.now() - touchZoomTime < 500) return;
      event.preventDefault();
      event.stopPropagation();
      inspectAt(event.clientX, event.clientY);
    };
    const touchDown = (event: PointerEvent) => {
      if (event.pointerType !== 'touch') return;
      if (!event.isPrimary) { touchStart = null; lastTap = null; return; }
      touchStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
    };
    const touchMove = (event: PointerEvent) => {
      if (touchStart?.id === event.pointerId && Math.hypot(event.clientX - touchStart.x, event.clientY - touchStart.y) > 5) {
        touchStart = null; lastTap = null;
      }
    };
    const touchUp = (event: PointerEvent) => {
      if (event.pointerType !== 'touch' || !event.isPrimary || touchStart?.id !== event.pointerId) return;
      touchStart = null;
      const time = performance.now();
      if (lastTap && time - lastTap.time <= 320 && Math.hypot(event.clientX - lastTap.x, event.clientY - lastTap.y) <= 18) {
        lastTap = null; touchZoomTime = time;
        inspectAt(event.clientX, event.clientY);
      } else lastTap = { time, x: event.clientX, y: event.clientY };
    };
    const cancelTouch = () => { touchStart = null; lastTap = null; };
    const canvas = gl.domElement;
    canvas.addEventListener('dblclick', handleDoubleClick, true);
    canvas.addEventListener('pointerdown', touchDown, true);
    canvas.addEventListener('pointermove', touchMove, true);
    canvas.addEventListener('pointerup', touchUp);
    canvas.addEventListener('pointercancel', cancelTouch, true);
    return () => {
      cancelSceneSingleAction(canvas);
      window.removeEventListener('office:zoom-close', restoreZoom);
      window.removeEventListener('keydown', escapeZoom, true);
      canvas.removeEventListener('dblclick', handleDoubleClick, true);
      canvas.removeEventListener('pointerdown', touchDown, true);
      canvas.removeEventListener('pointermove', touchMove, true);
      canvas.removeEventListener('pointerup', touchUp);
      canvas.removeEventListener('pointercancel', cancelTouch, true);
    };
  }, [camera, gl, surfaceAt, editing, screenReading]);

  useEffect(() => {
    const orbit = controls.current;
    if (!orbit || previousObject.current === inspection) return;
    previousObject.current = inspection;
    inspectionReturnPose.current = null;
    if (inspection) {
      if (!objectReturnPose.current) objectReturnPose.current = { position: camera.position.clone(), target: orbit.target.clone() };
      orbit.enabled = false;
      clearOrbitMomentum(camera, orbit);
      transition.current = { kind: 'object', position: new Vector3(...inspection.position), target: new Vector3(...inspection.target) };
    } else if (objectReturnPose.current) {
      orbit.enabled = false;
      clearOrbitMomentum(camera, orbit);
      transition.current = { kind: 'restore-object', position: objectReturnPose.current.position.clone(), target: objectReturnPose.current.target.clone() };
    }
  }, [camera, inspection]);

  useEffect(() => {
    if (!selected && !editing) return;
    objectReturnPose.current = null;
    setInspection(null);
  }, [selected, editing, setInspection]);

  useEffect(() => {
    const orbit = controls.current;
    if (!orbit || previousSelected.current === selected) return;
    inspectionReturnPose.current = null;
    window.dispatchEvent(new CustomEvent('office:zoomed', { detail: false }));
    if (selected) {
      if (!previousSelected.current) {
        savedFreePose.current = {
          position: camera.position.clone(),
          target: orbit.target.clone(),
        };
      }
      orbit.enabled = false;
      clearOrbitMomentum(camera, orbit);
      transition.current = toTransition('focus', focusPose());
    } else {
      orbit.enabled = false;
      clearOrbitMomentum(camera, orbit);
      applyOrbitLimits(orbit, false);
      if (camera instanceof PerspectiveCamera) camera.clearViewOffset();
      camera.updateProjectionMatrix();
      const saved = savedFreePose.current;
      const fallback = (compact ? MOBILE_TOUR : TOUR)[activeView.current];
      transition.current = saved
        ? { kind: 'return', position: saved.position.clone(), target: saved.target.clone() }
        : toTransition('return', fallback);
    }
    previousSelected.current = selected;
  }, [camera, compact, selected, size.width, size.height]);

  useEffect(() => {
    const orbit = controls.current;
    if (!orbit || viewCommand.sequence === lastViewSequence.current) return;
    inspectionReturnPose.current = null;
    lastViewSequence.current = viewCommand.sequence;
    activeView.current = viewCommand.view;
    userMoved.current = false;
    if (selected) return;
    orbit.enabled = false;
    clearOrbitMomentum(camera, orbit);
    transition.current = toTransition('guide', (compact ? MOBILE_TOUR : TOUR)[viewCommand.view]);
  }, [compact, selected, viewCommand]);

  useEffect(() => {
    const orbit = controls.current;
    if (!orbit) return;
    if (inspectionReturnPose.current || inspection) return;
    if (selected) {
      orbit.enabled = false;
      clearOrbitMomentum(camera, orbit);
      transition.current = toTransition('focus', focusPose());
      return;
    }
    if (!userMoved.current && !savedFreePose.current) {
      orbit.enabled = false;
      transition.current = toTransition('guide', (compact ? MOBILE_TOUR : TOUR)[activeView.current]);
    }
  }, [bookshelfVisit, compact, selected, size.height, size.width]);

  useEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return;
    targetFov.current = selected === 'ai' ? monitorReadingFov(size.width, size.height)
      : selected === 'award-photo' ? awardPairReadingFov(size.width, size.height)
      : focusFov(selected, compact, size.width, size.height);
    if (!selected || screenFocused) {
      camera.clearViewOffset();
      camera.updateProjectionMatrix();
      return;
    }
    if (selected === 'award-photo') {
      camera.setViewOffset(size.width, size.height, 0, awardPairReadingLayout(size.width, size.height).offsetY, size.width, size.height);
      camera.updateProjectionMatrix();
      return () => { camera.clearViewOffset(); camera.updateProjectionMatrix(); };
    }
    const compactReader = selected === 'family' || selected === 'books' || selected === 'bookshelf';
    const xOffset = compact ? 0 : (compactReader ? 352 : SIDE_READER_SPACE) / 2;
    const yOffset = compact ? size.height * 0.24 : 0;
    camera.setViewOffset(size.width, size.height, xOffset, yOffset, size.width, size.height);
    camera.updateProjectionMatrix();
    return () => {
      camera.clearViewOffset();
      camera.updateProjectionMatrix();
    };
  }, [camera, compact, selected, size.height, size.width]);

  useEffect(() => {
    const orbit = controls.current;
    const wrapper = gl.domElement.closest('.studio-scene');
    const keyTarget = wrapper instanceof HTMLElement ? wrapper : gl.domElement;
    if (!orbit) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (selected || editing || transition.current || !orbit.enabled
        || !isSceneKeyboardEvent(event, keyTarget, gl.domElement)) return;
      let handled = true;
      switch (event.key) {
        case '+':
        case '=': {
          const bounds = gl.domElement.getBoundingClientRect();
          zoomAt(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2, KEY_ZOOM_SCALE);
          break;
        }
        case '-':
        case '_': {
          const bounds = gl.domElement.getBoundingClientRect();
          zoomAt(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2, 1 / KEY_ZOOM_SCALE);
          break;
        }
        default: handled = orbit.enablePan && panCameraWithArrow(camera, orbit.target, event.key);
      }
      if (!handled) return;
      event.preventDefault();
      userMoved.current = true;
      orbit.update();
    };
    keyTarget.addEventListener('keydown', handleKeyDown);
    return () => keyTarget.removeEventListener('keydown', handleKeyDown);
  }, [camera, gl, zoomAt, editing, selected]);

  useEffect(() => { if (controls.current && !transition.current) controls.current.enabled = !editing && !screenReading; }, [editing, screenReading]);

  useFrame((_, delta) => {
    const orbit = controls.current;
    if (!orbit) return;
    if (editing) { orbit.enabled = false; return; }
    if (camera instanceof PerspectiveCamera && Math.abs(camera.fov - targetFov.current) > 0.01) {
      camera.fov += (targetFov.current - camera.fov) * (reducedMotion ? 1 : 1 - Math.exp(-MOTION.camera * Math.min(delta, 0.1)));
      camera.updateProjectionMatrix();
    }
    const active = transition.current;
    if (active) {
      const damping = reducedMotion ? 1 : 1 - Math.exp(-MOTION.camera * Math.min(delta, 0.1));
      camera.position.lerp(active.position, damping);
      orbit.target.lerp(active.target, damping);
      camera.lookAt(orbit.target);
      scratch.position.copy(camera.position).sub(active.position);
      scratch.target.copy(orbit.target).sub(active.target);
      if (reducedMotion || (scratch.position.lengthSq() <= CAMERA_TOLERANCE ** 2
        && scratch.target.lengthSq() <= CAMERA_TOLERANCE ** 2)) {
        finishTransition(active, orbit);
      }
    }
    if (!ready.current) {
      ready.current = true;
      onReady();
    }
  });

  return (
    <OrbitControls ref={controls} makeDefault enablePan zoomToCursor={!selected} enableDamping={!reducedMotion}
      dampingFactor={0.08}
      onStart={() => { if (!selected && !transition.current) userMoved.current = true; }} />
  );
}
