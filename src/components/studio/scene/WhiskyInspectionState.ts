import type { WHISKY_BOTTLES } from './WhiskyBottleSpecs';

export type WhiskyBottleId = typeof WHISKY_BOTTLES[number]['image'];
export type WhiskyInspectionState = {
  readonly bottle: WhiskyBottleId;
  readonly returning: boolean;
  readonly returningBottles: readonly WhiskyBottleId[];
  readonly closing: boolean;
} | null;

export function selectWhiskyBottle(state: WhiskyInspectionState, bottle: WhiskyBottleId): WhiskyInspectionState {
  const returningBottles = state
    ? [...new Set([...state.returningBottles, state.bottle])].filter(id => id !== bottle) : [];
  return { bottle, returning: false, returningBottles, closing: false };
}

export function returnWhiskyBottle(state: WhiskyInspectionState, closing: boolean): WhiskyInspectionState {
  if (state?.returning && state.closing === closing) return state;
  return state ? {
    ...state, returning: true, closing,
    returningBottles: [...new Set([...state.returningBottles, state.bottle])],
  } : null;
}

export function finishWhiskyReturn(state: WhiskyInspectionState, bottle: WhiskyBottleId): WhiskyInspectionState {
  if (!state || !state.returningBottles.includes(bottle)) return state;
  const returningBottles = state.returningBottles.filter(id => id !== bottle);
  return state.returning && returningBottles.length === 0 ? null : { ...state, returningBottles };
}
