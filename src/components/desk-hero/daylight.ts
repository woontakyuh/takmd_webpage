export interface DaylightState {
  /** Fractional local hour, 0-24. */
  readonly hour: number;
  readonly label: string;
  /** Window-side light color, strongest at the left window. */
  readonly window: string;
  /** Warm desk bounce light. */
  readonly warm: string;
  /** Whole-scene darkening, 0 (noon) to ~0.5 (deep night). */
  readonly dim: number;
  /** Cool ambient tint opacity for night/blue hours. */
  readonly cool: number;
  /** Desk lamp glow intensity, 0-1. */
  readonly lamp: number;
}

type Rgba = readonly [number, number, number, number];

interface DaylightKeyframe {
  readonly hour: number;
  readonly window: Rgba;
  readonly warm: Rgba;
  readonly dim: number;
  readonly cool: number;
  readonly lamp: number;
}

// Keyframes describe the light coming through the left window across a day.
// Values between keyframes are linearly interpolated so light drifts
// continuously instead of snapping between presets.
const keyframes: readonly DaylightKeyframe[] = [
  { hour: 0, window: [70, 96, 140, 0.3], warm: [232, 179, 104, 0.02], dim: 0.5, cool: 0.28, lamp: 1 },
  { hour: 5, window: [88, 110, 150, 0.28], warm: [232, 179, 104, 0.04], dim: 0.44, cool: 0.24, lamp: 0.9 },
  { hour: 6.5, window: [244, 170, 120, 0.3], warm: [240, 160, 90, 0.22], dim: 0.22, cool: 0.08, lamp: 0.35 },
  { hour: 8, window: [255, 224, 168, 0.24], warm: [232, 179, 104, 0.16], dim: 0.05, cool: 0.04, lamp: 0 },
  { hour: 12, window: [255, 250, 235, 0.2], warm: [232, 179, 104, 0.1], dim: 0, cool: 0.05, lamp: 0 },
  { hour: 16, window: [255, 236, 196, 0.22], warm: [232, 179, 104, 0.16], dim: 0.02, cool: 0.03, lamp: 0 },
  { hour: 18, window: [250, 178, 102, 0.32], warm: [238, 150, 70, 0.26], dim: 0.12, cool: 0.02, lamp: 0.15 },
  { hour: 19.5, window: [196, 124, 124, 0.3], warm: [214, 126, 92, 0.18], dim: 0.3, cool: 0.14, lamp: 0.6 },
  { hour: 21, window: [96, 116, 160, 0.3], warm: [232, 179, 104, 0.06], dim: 0.42, cool: 0.22, lamp: 0.9 },
  { hour: 24, window: [70, 96, 140, 0.3], warm: [232, 179, 104, 0.02], dim: 0.5, cool: 0.28, lamp: 1 },
];

const phaseLabels: readonly (readonly [number, string])[] = [
  [5, "Night"],
  [8, "Dawn"],
  [11, "Morning"],
  [15, "Midday"],
  [17.5, "Afternoon"],
  [19, "Golden hour"],
  [21, "Dusk"],
  [24, "Night"],
];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpRgba(a: Rgba, b: Rgba, t: number): string {
  const r = Math.round(lerp(a[0], b[0], t));
  const g = Math.round(lerp(a[1], b[1], t));
  const bl = Math.round(lerp(a[2], b[2], t));
  const alpha = lerp(a[3], b[3], t);

  return `rgba(${r},${g},${bl},${alpha.toFixed(3)})`;
}

function labelForHour(hour: number): string {
  const match = phaseLabels.find(([end]) => hour < end);

  return match ? match[1] : "Night";
}

export function getDaylight(now: Date | null, hourOverride?: number | null): DaylightState {
  const hour =
    hourOverride != null && Number.isFinite(hourOverride)
      ? ((hourOverride % 24) + 24) % 24
      : now
        ? now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600
        : 12;

  let from = keyframes[0];
  let to = keyframes[keyframes.length - 1];

  for (let index = 0; index < keyframes.length - 1; index += 1) {
    if (hour >= keyframes[index].hour && hour <= keyframes[index + 1].hour) {
      from = keyframes[index];
      to = keyframes[index + 1];
      break;
    }
  }

  const span = to.hour - from.hour || 1;
  const t = (hour - from.hour) / span;

  return {
    hour,
    label: labelForHour(hour),
    window: lerpRgba(from.window, to.window, t),
    warm: lerpRgba(from.warm, to.warm, t),
    dim: lerp(from.dim, to.dim, t),
    cool: lerp(from.cool, to.cool, t),
    lamp: lerp(from.lamp, to.lamp, t),
  };
}

/** Brightness/saturation filter applied to desk object cutouts so they sink into the scene light. */
export function objectLightFilter(daylight: DaylightState): string {
  const brightness = 1 - daylight.dim * 0.42;
  const saturate = 1 - daylight.dim * 0.24;

  return `brightness(${brightness.toFixed(3)}) saturate(${saturate.toFixed(3)})`;
}
