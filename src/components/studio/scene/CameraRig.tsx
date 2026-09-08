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

type CameraRigProps = Pick<StudioSceneProps,
  'selected' | 'compact' | 'reducedMotion' | 'viewCommand' | 'onReady'>;

type SavedPose = {
  readonly position: Vector3;
  readonly target: Vector3;
};

type TransitionKind = 'focus' | 'guide' | 'return' | 'inspect' | 'restore-inspection';
type Transition = {
  readonly kind: TransitionKind;
  readonly position: Vector3;
  readonly target: Vector3;
};

const CAMERA_TOLERANCE = 0.002;
const KEY_ROTATION_STEP = 0.08;
const KEY_ZOOM_SCALE = 1 / 1.12;
const KEY_PAN_STEP = 0.04;
const FREE_ORBIT_LIMITS = { minDistance: 0.10, maxDistance: 15, minPolarAngle: 0.3, maxPolarAngle: 1.45 } as const;
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

function isFormTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement
    && target.closest('input, textarea, select, button, a, [contenteditable="true"], [role="textbox"]') !== null;
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
    && (!material.transparent || material.opacity > 0.1));
}

export function CameraRig({ selected, compact, reducedMotion, viewCommand, onReady }: CameraRigProps) {
  const { editing, layout } = useArrangement();
  const { camera, size, gl, raycaster, scene, setFrameloop } = useThree();
  const controls = useRef<OrbitControlsImpl>(null);
  const transition = useRef<Transition | null>(null);
  const savedFreePose = useRef<SavedPose | null>(null);
  const inspectionReturnPose = useRef<SavedPose | null>(null);
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
    if (value.kind === 'return') applyOrbitLimits(orbit, false);
    if (value.kind === 'inspect' || value.kind === 'restore-inspection') applyOrbitLimits(orbit, selected !== null);
    orbit.update();
    transition.current = null;
    if (value.kind === 'return') savedFreePose.current = null;
    if (value.kind === 'restore-inspection') inspectionReturnPose.current = null;
    orbit.enabled = true;
  }, [camera, selected]);

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
    const handleDoubleClick = (event: MouseEvent) => {
      if (editing || event.button !== 0 || event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) return;
      cancelSceneSingleAction(gl.domElement);
      event.preventDefault();
      event.stopPropagation();
      orbit.enabled = false;
      clearOrbitMomentum(camera, orbit);
      const saved = inspectionReturnPose.current;
      if (saved) {
        transition.current = {
          kind: 'restore-inspection',
          position: saved.position.clone(),
          target: saved.target.clone(),
        };
        return;
      }
      const hit = surfaceAt(event.clientX, event.clientY);
      if (!hit) {
        orbit.enabled = true;
        return;
      }
      inspectionReturnPose.current = {
        position: camera.position.clone(),
        target: orbit.target.clone(),
      };
      const pose = zoomPoseForPoint(camera.position, hit.point);
      transition.current = { kind: 'inspect', position: pose.position, target: pose.target };
      userMoved.current = true;
    };
    gl.domElement.addEventListener('dblclick', handleDoubleClick, true);
    return () => {
      cancelSceneSingleAction(gl.domElement);
      gl.domElement.removeEventListener('dblclick', handleDoubleClick, true);
    };
  }, [camera, gl, surfaceAt, editing]);

  useEffect(() => {
    const orbit = controls.current;
    if (!orbit || previousSelected.current === selected) return;
    inspectionReturnPose.current = null;
    if (selected) {
      if (!previousSelected.current) {
        savedFreePose.current = {
          position: camera.position.clone(),
          target: orbit.target.clone(),
        };
      }
      orbit.enabled = false;
      clearOrbitMomentum(camera, orbit);
      transition.current = toTransition('focus', moveFocus((compact ? MOBILE_FOCUS : FOCUS)[selected], selected, layout));
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
    if (inspectionReturnPose.current) return;
    if (selected) {
      orbit.enabled = false;
      clearOrbitMomentum(camera, orbit);
      transition.current = toTransition('focus', moveFocus((compact ? MOBILE_FOCUS : FOCUS)[selected], selected, layout));
      return;
    }
    if (!userMoved.current && !savedFreePose.current) {
      orbit.enabled = false;
      transition.current = toTransition('guide', (compact ? MOBILE_TOUR : TOUR)[activeView.current]);
    }
  }, [compact, selected, size.height, size.width]);

  useEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return;
    targetFov.current = focusFov(selected, compact, size.width, size.height);
    if (!selected || selected === 'family') {
      camera.clearViewOffset();
      camera.updateProjectionMatrix();
      return;
    }
    const xOffset = compact ? 0 : SIDE_READER_SPACE / 2;
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
      if (editing || !orbit.enabled || isFormTarget(event.target)) return;
      let handled = true;
      if (event.shiftKey && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
        if (!orbit.enablePan) return;
        const horizontal = event.key === 'ArrowLeft' || event.key === 'ArrowRight';
        const sign = event.key === 'ArrowLeft' || event.key === 'ArrowDown' ? -1 : 1;
        const offset = new Vector3().setFromMatrixColumn(camera.matrix, horizontal ? 0 : 1)
          .multiplyScalar(camera.position.distanceTo(orbit.target) * KEY_PAN_STEP * sign);
        camera.position.add(offset);
        orbit.target.add(offset);
      } else switch (event.key) {
        case 'ArrowLeft': orbit.setAzimuthalAngle(orbit.getAzimuthalAngle() + KEY_ROTATION_STEP); break;
        case 'ArrowRight': orbit.setAzimuthalAngle(orbit.getAzimuthalAngle() - KEY_ROTATION_STEP); break;
        case 'ArrowUp': orbit.setPolarAngle(orbit.getPolarAngle() - KEY_ROTATION_STEP); break;
        case 'ArrowDown': orbit.setPolarAngle(orbit.getPolarAngle() + KEY_ROTATION_STEP); break;
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
        default: handled = false;
      }
      if (!handled) return;
      event.preventDefault();
      userMoved.current = true;
      orbit.update();
    };
    keyTarget.addEventListener('keydown', handleKeyDown);
    return () => keyTarget.removeEventListener('keydown', handleKeyDown);
  }, [camera, gl, zoomAt, editing]);

  useEffect(() => { if (controls.current && !transition.current) controls.current.enabled = !editing; }, [editing]);

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
