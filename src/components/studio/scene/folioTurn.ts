export type PaperDirection = 1 | -1;

type Identifiable = { readonly id: string };

export type RestingFolio<T extends Identifiable> = {
  readonly kind: 'rest';
  readonly displayed: T;
};

export type TurningFolio<T extends Identifiable> = {
  readonly kind: 'turn';
  readonly displayed: T;
  readonly from: T;
  readonly to: T;
  readonly leaf: T;
  readonly base: T;
  readonly direction: PaperDirection;
  readonly target: number;
  readonly initialAngle: number;
  readonly preserveAngle: boolean;
  readonly sequence: number;
};

export type FolioTurnState<T extends Identifiable> = RestingFolio<T> | TurningFolio<T>;

export const FOLIO_TURN_ANGLE = Math.PI;

export function beginFolioTurn<T extends Identifiable>(state: FolioTurnState<T>, incoming: T, direction: PaperDirection, sequence: number): FolioTurnState<T> {
  if (state.kind === 'rest' && state.displayed.id === incoming.id) return { kind: 'rest', displayed: incoming };

  if (state.kind === 'turn' && state.from.id === incoming.id) {
    return {
      kind: 'turn',
      displayed: incoming,
      from: state.displayed,
      to: incoming,
      leaf: state.leaf,
      base: state.base,
      direction,
      target: state.direction === 1 ? 0 : FOLIO_TURN_ANGLE,
      initialAngle: state.initialAngle,
      preserveAngle: true,
      sequence,
    };
  }

  const from = state.displayed;
  const previousTurnIsVisible = state.kind === 'turn';
  const nextTurn = direction === 1;
  return {
    kind: 'turn',
    displayed: incoming,
    from,
    to: incoming,
    leaf: nextTurn ? from : incoming,
    base: nextTurn ? incoming : from,
    direction,
    target: nextTurn ? FOLIO_TURN_ANGLE : 0,
    initialAngle: nextTurn ? 0 : FOLIO_TURN_ANGLE,
    preserveAngle: previousTurnIsVisible,
    sequence,
  };
}

export function settleFolioTurn<T extends Identifiable>(state: TurningFolio<T>): RestingFolio<T> {
  return { kind: 'rest', displayed: state.to };
}
