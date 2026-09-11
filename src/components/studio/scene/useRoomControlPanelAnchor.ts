import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef, type RefObject } from 'react';
import { Vector3, type Group } from 'three';
import type { RoomControl } from '../OfficeRoomControls';
import { getRoomControlPanelPosition, type PanelObstacle } from '../roomControlPanelPosition';
import type { Point } from './config';

export function useRoomControlPanelAnchor(control: RoomControl, panel?: RefObject<HTMLDivElement | null>, localObstacle?: readonly Point[]) {
  const group = useRef<Group>(null);
  const projected = useMemo(() => new Vector3(), []);
  const { gl } = useThree();
  useFrame(({ camera }) => {
    const element = panel?.current;
    if (!element || !group.current || element.dataset.device !== control || !element.matches(':popover-open') || window.innerWidth < 760) return;
    group.current.getWorldPosition(projected).project(camera);
    const canvas = gl.domElement.getBoundingClientRect();
    const x = canvas.left + (projected.x + 1) * canvas.width / 2, y = canvas.top + (1 - projected.y) * canvas.height / 2;
    let obstacle: PanelObstacle | undefined;
    if (localObstacle) {
      let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
      for (const corner of localObstacle) {
        group.current.localToWorld(projected.set(...corner)).project(camera);
        const screenX = canvas.left + (projected.x + 1) * canvas.width / 2, screenY = canvas.top + (1 - projected.y) * canvas.height / 2;
        left = Math.min(left, screenX); right = Math.max(right, screenX);
        top = Math.min(top, screenY); bottom = Math.max(bottom, screenY);
      }
      obstacle = { left, top, right, bottom };
    }
    const position = getRoomControlPanelPosition({ x, y }, { width: element.offsetWidth, height: element.offsetHeight },
      { width: window.innerWidth, height: window.innerHeight }, obstacle);
    const left = `${position.left}px`, top = `${position.top}px`;
    if (element.style.getPropertyValue('--office-control-left') !== left) element.style.setProperty('--office-control-left', left);
    if (element.style.getPropertyValue('--office-control-top') !== top) element.style.setProperty('--office-control-top', top);
    if (element.dataset.anchorDevice !== control) element.dataset.anchorDevice = control;
  });
  return group;
}
