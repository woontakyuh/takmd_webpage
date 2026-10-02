import { useSyncExternalStore } from 'react';
import { TV_DARK_EDGES } from './tvBacklightColor';
import type { TvEdgeLights } from './tvBacklightColor';

type TvBacklightState = {
  readonly hovered: boolean;
  readonly edges: TvEdgeLights;
};

let contentEdges = TV_DARK_EDGES;
let inspectionEdges: TvEdgeLights | null = null;
let wallTvState: TvBacklightState = { hovered: false, edges: contentEdges };
const wallTvHoverListeners = new Set<() => void>();

function subscribeWallTvHover(listener: () => void) {
  wallTvHoverListeners.add(listener);
  return () => wallTvHoverListeners.delete(listener);
}

export function readWallTvBacklight() {
  return wallTvState;
}

function publishWallTvState(next: TvBacklightState) {
  if (wallTvState.hovered === next.hovered && (['left', 'top', 'right', 'bottom'] as const)
    .every(edge => wallTvState.edges[edge].color === next.edges[edge].color && wallTvState.edges[edge].intensity === next.edges[edge].intensity)) return;
  wallTvState = next;
  wallTvHoverListeners.forEach(listener => listener());
}

export function setWallTvHovered(hovered: boolean) {
  publishWallTvState({ ...wallTvState, hovered });
}

export function setWallTvContentEdges(edges: TvEdgeLights) {
  contentEdges = edges;
  publishWallTvState({ ...wallTvState, edges: inspectionEdges ?? contentEdges });
}

export function setWallTvInspectionEdges(edges: TvEdgeLights | null) {
  inspectionEdges = edges;
  publishWallTvState({ ...wallTvState, edges: inspectionEdges ?? contentEdges });
}

export function useWallTvBacklight() {
  return useSyncExternalStore(subscribeWallTvHover, readWallTvBacklight, readWallTvBacklight);
}
