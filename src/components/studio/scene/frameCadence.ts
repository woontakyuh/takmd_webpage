export function frameInterval({ phone, settled, interacting, animating }: {
  readonly phone: boolean; readonly settled: boolean; readonly interacting: boolean; readonly animating: boolean;
}): number {
  if (interacting) return 1000 / 60;
  if (!phone || !settled || animating) return 1000 / 30;
  return 1000 / 6;
}
