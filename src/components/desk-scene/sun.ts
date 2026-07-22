import * as SunCalc from 'suncalc';

export type SunState = {
  /** sun altitude in degrees (suncalc v2 convention; negative = below horizon) */
  altitude: number;
  /** sun azimuth in degrees clockwise from north (0 = N, 90 = E, 180 = S, 270 = W) */
  azimuth: number;
  /** 0..1 how "day" it is (0 night, 1 full day), smooth across twilight */
  daylight: number;
  /** directional sunlight color */
  sunColor: string;
  /** directional sunlight intensity */
  sunIntensity: number;
  /** ambient/hemisphere sky color */
  skyColor: string;
  /** ambient intensity */
  ambientIntensity: number;
  /** window sky gradient stops (top, bottom) */
  windowSky: [string, string];
  /** 0..1 desk lamp power (comes on through dusk) */
  lamp: number;
};

// Representative coordinates per IANA timezone (coarse — city-level accuracy is enough
// for lighting mood). Fallback estimates longitude from the UTC offset.
const TZ_COORDS: Record<string, [number, number]> = {
  'Asia/Seoul': [37.57, 126.98],
  'Asia/Tokyo': [35.68, 139.69],
  'Asia/Shanghai': [31.23, 121.47],
  'Asia/Hong_Kong': [22.32, 114.17],
  'Asia/Singapore': [1.35, 103.82],
  'Asia/Bangkok': [13.76, 100.5],
  'Asia/Kolkata': [28.61, 77.21],
  'Asia/Dubai': [25.2, 55.27],
  'Australia/Sydney': [-33.87, 151.21],
  'Europe/London': [51.51, -0.13],
  'Europe/Paris': [48.86, 2.35],
  'Europe/Berlin': [52.52, 13.41],
  'Europe/Madrid': [40.42, -3.7],
  'Europe/Rome': [41.9, 12.5],
  'Europe/Moscow': [55.76, 37.62],
  'Europe/Zurich': [47.38, 8.54],
  'America/New_York': [40.71, -74.01],
  'America/Chicago': [41.88, -87.63],
  'America/Denver': [39.74, -104.99],
  'America/Los_Angeles': [34.05, -118.24],
  'America/Toronto': [43.65, -79.38],
  'America/Vancouver': [49.28, -123.12],
  'America/Mexico_City': [19.43, -99.13],
  'America/Sao_Paulo': [-23.55, -46.63],
  'America/Argentina/Buenos_Aires': [-34.6, -58.38],
  'Africa/Cairo': [30.04, 31.24],
  'Africa/Johannesburg': [-26.2, 28.05],
  'Pacific/Auckland': [-36.85, 174.76],
};

export function guessCoords(): [number, number] {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && TZ_COORDS[tz]) return TZ_COORDS[tz];
  } catch {
    /* fall through */
  }
  // Longitude from UTC offset (15° per hour), mid-latitude guess
  const offsetHours = -new Date().getTimezoneOffset() / 60;
  return [35, offsetHours * 15];
}

/** `?hour=18.5` on the homepage overrides visitor time for visual review */
export function reviewDate(): Date {
  const now = new Date();
  if (typeof window === 'undefined') return now;
  const raw = new URLSearchParams(window.location.search).get('hour');
  if (raw === null) return now;
  const hour = Number(raw);
  if (!Number.isFinite(hour) || hour < 0 || hour > 24) return now;
  const d = new Date(now);
  d.setHours(Math.floor(hour), Math.round((hour % 1) * 60), 0, 0);
  return d;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function clamp01(t: number) {
  return Math.min(1, Math.max(0, t));
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function hexLerp(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const r = Math.round(lerp((pa >> 16) & 255, (pb >> 16) & 255, t));
  const g = Math.round(lerp((pa >> 8) & 255, (pb >> 8) & 255, t));
  const bl = Math.round(lerp(pa & 255, pb & 255, t));
  return `#${((r << 16) | (g << 8) | bl).toString(16).padStart(6, '0')}`;
}

// Continuous color ramps keyed on sun altitude (degrees).
// Twilight blue → low warm orange → noon near-white; symmetric for dawn/dusk,
// with dawn biased slightly cooler than dusk.
function sunColorAt(altDeg: number, morning: boolean): string {
  const horizon = morning ? '#ff9d62' : '#ff8442';
  const low = morning ? '#ffbe86' : '#ffab66';
  if (altDeg <= 0) return horizon;
  if (altDeg < 8) return hexLerp(horizon, low, altDeg / 8);
  if (altDeg < 20) return hexLerp(low, '#ffdcb0', (altDeg - 8) / 12);
  if (altDeg < 40) return hexLerp('#ffdcb0', '#fff4e0', (altDeg - 20) / 20);
  return '#fffaf2';
}

function skyColorAt(altDeg: number): string {
  if (altDeg <= -12) return '#0d1524'; // night navy
  if (altDeg <= 0) return hexLerp('#0d1524', '#8fa8c8', (altDeg + 12) / 12);
  if (altDeg < 12) return hexLerp('#8fa8c8', '#cfe0ef', altDeg / 12);
  return hexLerp('#cfe0ef', '#e8f1f8', clamp01((altDeg - 12) / 30));
}

function windowSkyAt(altDeg: number, morning: boolean): [string, string] {
  const lowBand = morning ? '#e0925e' : '#e87f40';
  if (altDeg <= -12) return ['#0a1020', '#141c30']; // deep night
  if (altDeg <= 0) {
    const t = (altDeg + 12) / 12;
    return [hexLerp('#0a1020', '#54648e', t), hexLerp('#141c30', lowBand, t)];
  }
  if (altDeg < 18) {
    const t = altDeg / 18;
    return [hexLerp('#54648e', '#87b0dc', t), hexLerp(lowBand, '#d4e4f2', t)];
  }
  return ['#87b0dc', '#d4e4f2'];
}

export function computeSun(date: Date, lat: number, lng: number): SunState {
  const pos = SunCalc.getPosition(date, lat, lng); // altitude/azimuth already in degrees (v2)
  const altDeg = pos.altitude;
  // morning vs evening: compare with solar noon
  const times = SunCalc.getTimes(date, lat, lng);
  const morning = date < times.solarNoon;

  const daylight = smoothstep(-8, 4, altDeg);
  const sunIntensity = altDeg <= 0 ? 0 : lerp(0.9, 3.4, smoothstep(0, 40, altDeg));
  // ambience keeps sinking through golden hour so low sun reads as evening, not noon
  const ambientIntensity = lerp(0.15, 0.95, daylight) * lerp(0.45, 1, smoothstep(4, 28, altDeg));
  const lamp = 1 - smoothstep(-6, 2, altDeg); // fades in through dusk, full at night

  return {
    altitude: pos.altitude,
    azimuth: pos.azimuth,
    daylight,
    sunColor: sunColorAt(altDeg, morning),
    sunIntensity,
    skyColor: skyColorAt(altDeg),
    ambientIntensity,
    windowSky: windowSkyAt(altDeg, morning),
    lamp,
  };
}
