import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { CameraPose, Point } from './scene/config';
import type { ExhibitId } from './types';

export const FURNITURE = {
  desk: { label: 'Desk', center: [-0.05, 0, -1.5], radius: 1.02, handle: 1.35 },
  chair: { label: 'Desk chair', center: [-0.2, 0, -2.59], radius: 0.40, handle: 1.15 },
  sofa: { label: 'Sofa', center: [2, 0, 1.14], radius: 0.85, handle: 1.0 },
  table: { label: 'Coffee table', center: [0.78, 0, 1.08], radius: 0.65, handle: 0.55 },
  lounge: { label: 'Eames & ottoman', center: [-0.9, 0, 2.12], radius: 0.66, handle: 1.05 },
  plant: { label: 'Palm', center: [2.18, 0, -0.55], radius: 0.28, handle: 2.15 },
  mantis: { label: 'Mantis', center: [-1.75, 0, 2.62], radius: 0.15, handle: 1.7 },
  signe: { label: 'Signe', center: [-2.49, 0, 2.84], radius: 0.06, handle: 1.6 },
  music: { label: 'Guitar & amp', center: [2.12, 0, -2.1], radius: 0.61, handle: 1.1 },
} as const satisfies Record<string, { readonly label: string; readonly center: Point; readonly radius: number; readonly handle: number }>;
export type FurnitureId = keyof typeof FURNITURE;
export const FURNITURE_IDS: readonly FurnitureId[] = ['desk', 'chair', 'sofa', 'table', 'lounge', 'plant', 'mantis', 'signe', 'music'];
export type FurniturePose = { readonly x: number; readonly z: number; readonly angle: number };
type Layout = Partial<Record<FurnitureId, FurniturePose>>;
const ZERO: FurniturePose = { x: 0, z: 0, angle: 0 };
function clampPose(id: FurnitureId, pose: FurniturePose): FurniturePose {
  const { center, radius } = FURNITURE[id];
  const cosine = Math.abs(Math.cos(pose.angle)), sine = Math.abs(Math.sin(pose.angle));
  // The sofa's 1.60 m width runs along z in its designed pose; its back is only 0.445 m from the center.
  const halfX = id === 'sofa' ? 0.4445 * cosine + 0.8001 * sine : radius;
  const halfZ = id === 'sofa' ? 0.8001 * cosine + 0.4445 * sine : radius;
  return { x: Math.max(Math.min(0, -2.7 + halfX - center[0]), Math.min(Math.max(0, (id === 'sofa' ? 2.76 : 2.78) - halfX - center[0]), pose.x)),
    z: Math.max(Math.min(0, -3.32 + halfZ - center[2]), Math.min(Math.max(0, 3.27 - halfZ - center[2]), pose.z)), angle: pose.angle % (2 * Math.PI) };
}
function useArrangementState() {
  const [layout, setLayout] = useState<Layout>({});
  const [editing, setEditing] = useState(false);
  const [active, select] = useState<FurnitureId>('desk');
  const [notice, setNotice] = useState('');
  const snapshot = useRef<Layout>({});
  const cancel = () => { setLayout(snapshot.current); setEditing(false); };
  useEffect(() => {
    if (!editing) return;
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') cancel(); };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [editing]);
  return {
    layout, editing, active, select, notice,
    pose: (id: FurnitureId) => layout[id] ?? ZERO,
    start: () => { snapshot.current = layout; setEditing(true); setNotice(''); },
    cancel,
    finish: () => { setNotice('Layout kept for this visit. Reopening the office restores the original room.'); setEditing(false); },
    move: (id: FurnitureId, pose: FurniturePose) => setLayout(current => ({ ...current, [id]: clampPose(id, pose) })),
    reset: () => setLayout({}),
    resetActive: () => setLayout(current => ({ ...current, [active]: ZERO })),
  };
}
type Arrangement = ReturnType<typeof useArrangementState>;
const Context = createContext<Arrangement | null>(null);
export function ArrangementProvider({ children }: { readonly children: ReactNode }) {
  const value = useArrangementState();
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useArrangement() {
  const value = useContext(Context);
  if (!value) throw new Error('ArrangementProvider is required');
  return value;
}
export function moveFocus(pose: CameraPose, id: ExhibitId, layout: Layout): CameraPose {
  if (!['ai', 'research', 'projects', 'family'].includes(id)) return pose;
  const delta = layout.desk ?? ZERO;
  const center = FURNITURE.desk.center;
  const transform = (point: Point): Point => {
    const x = point[0] - center[0], z = point[2] - center[2];
    return [center[0] + delta.x + x * Math.cos(delta.angle) + z * Math.sin(delta.angle), point[1], center[2] + delta.z - x * Math.sin(delta.angle) + z * Math.cos(delta.angle)];
  };
  return { ...pose, position: transform(pose.position), target: transform(pose.target) };
}
