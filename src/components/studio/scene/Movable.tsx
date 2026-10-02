import { Html } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useMemo, useRef, type ReactNode, type PointerEvent } from 'react';
import { Plane, Raycaster, Vector2, Vector3 } from 'three';
import { FURNITURE, useArrangement, type FurnitureId } from '../arrangement';

export function Movable({ id, children, handle = true }: { readonly id: FurnitureId; readonly children: ReactNode; readonly handle?: boolean }) {
  const state = useArrangement(), pose = state.pose(id), item = FURNITURE[id];
  const { camera, gl } = useThree();
  const drag = useRef<{ readonly x: number; readonly z: number; readonly start: Vector3 } | null>(null);
  const math = useMemo(() => ({ ray: new Raycaster(), pointer: new Vector2(), floor: new Plane(new Vector3(0, 1, 0), 0), hit: new Vector3() }), []);
  const hit = (event: PointerEvent<HTMLButtonElement>) => {
    const box = gl.domElement.getBoundingClientRect();
    math.pointer.set((event.clientX - box.left) / box.width * 2 - 1, -(event.clientY - box.top) / box.height * 2 + 1);
    math.ray.setFromCamera(math.pointer, camera);
    return math.ray.ray.intersectPlane(math.floor, math.hit);
  };
  return <group name={`Furniture layout ${id}`} position={[item.center[0] + pose.x, 0, item.center[2] + pose.z]} rotation={[0, pose.angle, 0]}>
    <group position={[-item.center[0], 0, -item.center[2]]}>{children}</group>
    {state.editing && handle && <Html center position={[0, item.handle, 0]} zIndexRange={[18, 12]}>
      <button className="office-move-handle" data-active={state.active === id} aria-label={`Move ${item.label}`} title={`Drag ${item.label}`}
        onPointerDown={event => { event.stopPropagation(); state.select(id); const point = hit(event); if (!point) return; drag.current = { x: pose.x, z: pose.z, start: point.clone() }; event.currentTarget.setPointerCapture(event.pointerId); }}
        onPointerMove={event => { event.stopPropagation(); const start = drag.current, point = hit(event); if (!start || !point) return; state.move(id, { ...pose, x: start.x + point.x - start.start.x, z: start.z + point.z - start.start.z }); }}
        onPointerUp={event => { drag.current = null; event.currentTarget.releasePointerCapture(event.pointerId); }}
        onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }}
        onDoubleClick={event => event.stopPropagation()}>✥<span>{item.label}</span></button>
    </Html>}
  </group>;
}
