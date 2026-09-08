import { useSyncExternalStore } from 'react';

const TV_CONTENT_FALLBACK = ['#9D998F', '#9AA7A4'] as const;

type TvBacklightState = {
  readonly hovered: boolean;
  readonly colors: readonly [string, string];
};

let wallTvState: TvBacklightState = { hovered: false, colors: [...TV_CONTENT_FALLBACK] };
const wallTvHoverListeners = new Set<() => void>();

function subscribeWallTvHover(listener: () => void) {
  wallTvHoverListeners.add(listener);
  return () => wallTvHoverListeners.delete(listener);
}

function readWallTvState() {
  return wallTvState;
}

function publishWallTvState(next: TvBacklightState) {
  if (wallTvState.hovered === next.hovered && wallTvState.colors[0] === next.colors[0] && wallTvState.colors[1] === next.colors[1]) return;
  wallTvState = next;
  wallTvHoverListeners.forEach(listener => listener());
}

export function setWallTvHovered(hovered: boolean) {
  publishWallTvState({ ...wallTvState, hovered });
}

export function setWallTvContentColors(colors: readonly [string, string]) {
  publishWallTvState({ ...wallTvState, colors: [...colors] });
}

export function useWallTvBacklight() {
  return useSyncExternalStore(subscribeWallTvHover, readWallTvState, readWallTvState);
}
