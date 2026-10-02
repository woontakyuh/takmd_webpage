// Fractional buffers reproduce WebKit shadow/transmission sampler errors in the room.
// iOS alternative browsers also use WebKit; desktop Chromium advertises AppleWebKit too.
export function needsWholePixelRatio(userAgent: string): boolean {
  return /AppleWebKit/i.test(userAgent) && !/Chrome|Chromium|Android/i.test(userAgent);
}

// Bound the drawing buffer independently of Retina density and desktop monitor size.
export function roomPixelRatio(width: number, height: number, deviceRatio: number, wholePixels = false): number {
  if (wholePixels) return 1;
  return Math.min(deviceRatio, 0.85, Math.sqrt(1_000_000 / Math.max(1, width * height)));
}

export class RenderBudget {
  private samples = 0;
  private slow = 0;
  private changedAt = 0;

  sample(costMs: number, now: number, ratio: number, ceiling: number): number {
    // Ignore isolated uploads; change at most once per two seconds without repeatedly
    // sharpening and softening the room as the pointer starts and stops.
    this.samples += 1;
    if (costMs > 22) this.slow += 1;
    if (this.samples < 30 || now - this.changedAt < 2000) return ratio;
    const overloaded = this.slow >= this.samples * 0.6;
    this.samples = 0;
    this.slow = 0;
    if (!overloaded) return ratio;
    const next = Math.max(ceiling * 0.65, ratio - 0.1);
    if (next < ratio) this.changedAt = now;
    return next;
  }
}
