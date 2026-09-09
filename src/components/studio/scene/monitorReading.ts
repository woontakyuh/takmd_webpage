import { Euler, Vector3 } from 'three';
import { MONITOR, ROOM } from './config';
import type { CameraPose, Point } from './config';

export const MONITOR_SCREEN = {
  mount: [0, 0.37, 0],
  tilt: -0.04,
  surface: [0, 0.004, 0.0145],
  reader: [0, 0.004, 0.0147],
  readingDistance: 0.7,
} as const;

export function monitorReadingSize(width: number, height: number): number {
  const verticalClearance = width > height && height < 560 ? 32 : 128;
  const bezelWidth = Math.min(Math.max(32, width - 32), Math.max(32, height - verticalClearance) * MONITOR.width / MONITOR.height);
  return bezelWidth * MONITOR.screenWidth / MONITOR.width;
}

const tilt = new Euler(MONITOR_SCREEN.tilt, 0, 0);
const rotation = new Euler(0, ROOM.monitor.rotation, 0);
const screenCenter = new Vector3(...MONITOR_SCREEN.surface).applyEuler(tilt)
  .add(new Vector3(...MONITOR_SCREEN.mount)).applyEuler(rotation)
  .add(new Vector3(...ROOM.monitor.position));
const screenNormal = new Vector3(0, 0, 1).applyEuler(tilt).applyEuler(rotation);
const toPoint = (point: Vector3): Point => [point.x, point.y, point.z];

export function monitorReadingPose(): CameraPose {
  return {
    position: toPoint(screenCenter.clone().addScaledVector(screenNormal, MONITOR_SCREEN.readingDistance)),
    target: toPoint(screenCenter),
    zoom: 1,
  };
}

export function monitorReadingFov(width: number, height: number): number {
  return 2 * Math.atan(MONITOR.screenWidth * height / (2 * MONITOR_SCREEN.readingDistance * monitorReadingSize(width, height))) * 180 / Math.PI;
}
