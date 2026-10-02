export const PAPER_LEAF_THICKNESS = .00009;

export function bookPacketLayout(book: {
  readonly thickness: number;
  readonly coverThickness: number;
}, leftLeaves: number) {
  const paperDepth = book.thickness - book.coverThickness * 2;
  const leftDepth = Math.min(leftLeaves * PAPER_LEAF_THICKNESS, paperDepth * .8);
  const rightDepth = paperDepth - leftDepth;
  return { leftDepth, rightDepth, splitZ: paperDepth / 2 - leftDepth };
}

export function pageArchAt(distance: number, width: number): number {
  const u = Math.max(0, Math.min(1, distance / width));
  return Math.sin(Math.PI * u) * Math.exp(-3 * u);
}
