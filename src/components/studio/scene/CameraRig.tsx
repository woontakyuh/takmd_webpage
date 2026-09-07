import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { PerspectiveCamera, Vector3 } from 'three';
import type { Camera } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { StudioSceneProps } from '../types';
import { FOCUS, focusFov, MOBILE_FOCUS, MOBILE_TOUR, MOTION, SIDE_READER_SPACE, TOUR } from './config';
import type { CameraPose } from './config';

type CameraRigProps = Pick<StudioSceneProps,
  'selected' | 'compact' | 'reducedMotion' | 'viewCommand' | 'onReady'>;

type SavedPose = {
  readonly position: Vector3;
  readonly target: Vector3;
};

type TransitionKind = 'focus' | 'guide' | 'return';
type Transition = {
  readonly kind: TransitionKind;
  readonly position: Vector3;
  readonly target: Vector3;
};

const CAMERA_TOLERANCE = 0.002;
const KEY_ROTATION_STEP = 0.08;
const KEY_ZOOM_SCALE = 1 / 1.12;
const KEY_PAN_STEP = 0.04;
const FREE_ORBIT_LIMITS = { minDistance: 0.10, maxDistance: 13, minPolarAngle: 0.3, maxPolarAngle: 1.45 } as const;
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

export function CameraRig({ selected, compact, reducedMotion, viewCommand, onReady }: CameraRigProps) {
  const { camera, size, gl, setFrameloop } = useThree();
  const controls = useRef<OrbitControlsImpl>(null);
  const transition = useRef<Transition | null>(null);
  const savedFreePose = useRef<SavedPose | null>(null);
  const activeView = useRef<0 | 1 | 2>(viewCommand.view);
  const lastViewSequence = useRef(viewCommand.sequence);
  const previousSelected = useRef(selected);
  const userMoved = useRef(false);
  const ready = useRef(false);
  const targetFov = useRef(42);
  const initialPose = useRef((compact ? MOBILE_TOUR : TOUR)[viewCommand.view]);
  const scratch = useMemo(() => ({ position: new Vector3(), target: new Vector3() }), []);

  const finishTransition = useCallback((value: Transition, orbit: OrbitControlsImpl) => {
    camera.position.copy(value.position);
    orbit.target.copy(value.target);
    if (camera instanceof PerspectiveCamera) { camera.fov = targetFov.current; camera.updateProjectionMatrix(); }
    if (value.kind === 'focus') applyOrbitLimits(orbit, true);
    if (value.kind === 'return') applyOrbitLimits(orbit, false);
    orbit.update();
    transition.current = null;
    if (value.kind === 'return') savedFreePose.current = null;
    orbit.enabled = true;
  }, [camera]);

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
    const orbit = controls.current;
    if (!orbit || previousSelected.current === selected) return;
    if (selected) {
      if (!previousSelected.current) {
        savedFreePose.current = {
          position: camera.position.clone(),
          target: orbit.target.clone(),
        };
      }
      orbit.enabled = false;
      clearOrbitMomentum(camera, orbit);
      transition.current = toTransition('focus', (compact ? MOBILE_FOCUS : FOCUS)[selected]);
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
    if (selected) {
      orbit.enabled = false;
      clearOrbitMomentum(camera, orbit);
      transition.current = toTransition('focus', (compact ? MOBILE_FOCUS : FOCUS)[selected]);
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
      if (!orbit.enabled || isFormTarget(event.target)) return;
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
        case '=': orbit.dollyIn(KEY_ZOOM_SCALE); break;
        case '-':
        case '_': orbit.dollyOut(KEY_ZOOM_SCALE); break;
        default: handled = false;
      }
      if (!handled) return;
      event.preventDefault();
      userMoved.current = true;
      orbit.update();
    };
    keyTarget.addEventListener('keydown', handleKeyDown);
    return () => keyTarget.removeEventListener('keydown', handleKeyDown);
  }, [camera, gl]);

  useFrame((_, delta) => {
    const orbit = controls.current;
    if (!orbit) return;
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
