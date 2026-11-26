export function frameInterval({ settled, interacting, animating }: {
  readonly settled: boolean; readonly interacting: boolean; readonly animating: boolean;
}): number {
  if (interacting) return 1000 / 60;
  if (!settled || animating) return 1000 / 30;
  return 1000 / 6;
}
