import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Point } from './config';

export type SceneInspection = {
  readonly id: string;
  readonly position: Point;
  readonly target: Point;
};

type InspectionContext = {
  readonly inspection: SceneInspection | null;
  readonly setInspection: (value: SceneInspection | null) => void;
};

const Context = createContext<InspectionContext | null>(null);

export function SceneInspectionProvider({ children }: { readonly children: ReactNode }) {
  const [inspection, setInspection] = useState<SceneInspection | null>(null);
  const value = useMemo(() => ({ inspection, setInspection }), [inspection]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useSceneInspection() {
  const value = useContext(Context);
  if (!value) throw new Error('Scene inspection requires its provider');
  return value;
}
