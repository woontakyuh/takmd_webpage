import * as SunCalc from 'suncalc';
import locations from '../../data/timezone-locations.json';
import { computeSun } from '../desk-scene/sun';

export type LightMode = 'local' | 'day' | 'evening';
export type LocalDate = {
  readonly iso: string;
  readonly day: string;
  readonly month: string;
  readonly year: string;
  readonly weekday: string;
  readonly hours: string;
  readonly minutes: string;
  readonly seconds: string;
  readonly zone: string;
};
export type OfficeLight = {
  readonly timeZone: string;
  readonly approximate: true;
  readonly sun: Readonly<ReturnType<typeof computeSun>>;
  readonly position: readonly [number, number, number];
};

const zoneLocations: Readonly<Record<string, readonly number[]>> = locations;

export function localZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function coordinatesForZone(timeZone: string, offsetMinutes: number): readonly [number, number] {
  const point = zoneLocations[timeZone];
  if (point?.[0] !== undefined && point[1] !== undefined) return [point[0], point[1]];
  // A fixed-offset zone has no location; use its central meridian at a temperate latitude.
  return [35, Math.max(-180, Math.min(180, -offsetMinutes / 4))];
}

export function formatLocalDate(date: Date, timeZone: string): LocalDate {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone, day: '2-digit', month: 'short', year: 'numeric', weekday: 'short',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(value => value.type === type)?.value ?? '';
  return {
    iso: date.toISOString(), day: part('day'), month: part('month').toUpperCase(),
    year: part('year'), weekday: part('weekday').toUpperCase(), hours: part('hour'),
    minutes: part('minute'), seconds: part('second'), zone: timeZone.replaceAll('_', ' '),
  };
}

export function officeLight(date: Date, timeZone: string, mode: LightMode, offsetMinutes = date.getTimezoneOffset()): OfficeLight {
  const [latitude, longitude] = coordinatesForZone(timeZone, offsetMinutes);
  const noon = SunCalc.getTimes(date, latitude, longitude).solarNoon;
  const sample = mode === 'local' ? date : new Date(noon.getTime() + (mode === 'evening' ? 8 * 3_600_000 : 0));
  const sun = computeSun(sample, latitude, longitude);
  const altitude = sun.altitude * Math.PI / 180;
  const azimuth = sun.azimuth * Math.PI / 180;
  const hemisphere = latitude < 0 ? -1 : 1;
  // The cutaway office's left window faces the equator; +Z is east in the north.
  const position: readonly [number, number, number] = [
    Math.cos(azimuth) * Math.cos(altitude) * hemisphere * 10,
    Math.sin(altitude) * 10,
    Math.sin(azimuth) * Math.cos(altitude) * hemisphere * 10,
  ];
  return { timeZone, approximate: true, sun, position };
}
