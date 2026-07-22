export type PrimitivePart = {
  kind: 'box' | 'cylinder' | 'sphere' | 'torus';
  size: [number, number, number]; // box: w/h/d, cylinder: rTop/rBottom/height, sphere: r/-/-, torus: r/tube/-
  position?: [number, number, number];
  rotation?: [number, number, number];
  color: string;
  roughness?: number;
  metalness?: number;
};

export type PrimitiveSpec = {
  parts: PrimitivePart[];
};

export type DeskObject = {
  id: string;
  label: string;
  glb?: string; // '/models/spine.glb' — loaded when present, primitive fallback otherwise
  glbFit?: number; // target size of the GLB's largest dimension in world units (default 0.3)
  fallback: PrimitiveSpec;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  route?: string; // absent = functional object (no navigation)
  external?: boolean;
  command: string; // terminal command line shown on hover, e.g. 'open spine.md'
  terminalLines: string[];
  hitSize: [number, number, number]; // invisible collider box (slightly larger than mesh)
  hitOffset?: [number, number, number];
};

export type SceneMetrics = {
  publications: number;
  presentations: number;
  cases: number;
  latestCase: string;
};
