import type { WHISKY_BOTTLES } from './WhiskyBottleSpecs';

export type WhiskyBottleId = typeof WHISKY_BOTTLES[number]['image'];
export type WhiskyInspectionState = {
  readonly bottle: WhiskyBottleId;
  readonly returning: boolean;
  readonly next: WhiskyBottleId | null;
  readonly closing: boolean;
} | null;

export function selectWhiskyBottle(state: WhiskyInspectionState, bottle: WhiskyBottleId): WhiskyInspectionState {
  if (!state) return { bottle, returning: false, next: null, closing: false };
  if (state.bottle === bottle) return { ...state, returning: false, next: null, closing: false };
  return { ...state, returning: true, next: bottle, closing: false };
}

export function returnWhiskyBottle(state: WhiskyInspectionState, closing: boolean): WhiskyInspectionState {
  return state ? { ...state, returning: true, next: null, closing } : null;
}

export function finishWhiskyReturn(state: WhiskyInspectionState): WhiskyInspectionState {
  return state?.next ? selectWhiskyBottle(null, state.next) : null;
}
