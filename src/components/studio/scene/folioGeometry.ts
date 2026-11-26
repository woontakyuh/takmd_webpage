import type { FolioTurnState } from './folioTurn';

export const FOLIO = {
  hingeX: -0.515,
  spineHeight: 0.074,
  pageThickness: 0.047,
  rightPageX: -0.485,
  paperBaseY: 0.012,
  coverLiningY: 0.0095,
} as const;

type IndexedPaper = { readonly id: string; readonly index: number };

export function folioStackLayers<T extends IndexedPaper>(state: FolioTurnState<T>, count: number) {
  if (state.kind === 'rest') return { left: state.displayed.index, right: count - state.displayed.index, turning: 0 };
  const left = Math.min(state.leaf.index, state.base.index);
  const right = count - Math.max(state.leaf.index, state.base.index);
  return { left, right, turning: count - left - right };
}

export function folioBindingPose(angle: number) {
  const spineAngle = angle / 2;
  return {
    coverX: FOLIO.hingeX - Math.sin(spineAngle) * FOLIO.spineHeight,
    coverY: Math.cos(spineAngle) * FOLIO.spineHeight,
    spineAngle,
  };
}
