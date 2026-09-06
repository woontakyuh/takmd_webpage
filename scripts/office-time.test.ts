import { describe, it as test } from 'node:test';
import assert from 'node:assert/strict';
import { coordinatesForZone, formatLocalDate, officeLight } from '../src/components/studio/localTime';

describe('visitor calendar clock', () => {
  test('rolls the date and year over in the visitor time zone', () => {
    const before = formatLocalDate(new Date('2026-12-31T14:59:59Z'), 'Asia/Seoul');
    const after = formatLocalDate(new Date('2026-12-31T15:00:00Z'), 'Asia/Seoul');
    assert.deepEqual([before.day, before.year, before.hours, before.minutes, before.seconds], ['31', '2026', '23', '59', '59']);
    assert.deepEqual([after.day, after.year, after.hours, after.minutes, after.seconds], ['01', '2027', '00', '00', '00']);
    assert.equal(formatLocalDate(new Date('2026-12-31T15:00:00Z'), 'America/New_York').day, '31');
  });
  test('follows daylight saving transitions without a manual offset', () => {
    assert.equal(formatLocalDate(new Date('2026-03-08T06:59:59Z'), 'America/New_York').hours, '01');
    assert.equal(formatLocalDate(new Date('2026-03-08T07:00:00Z'), 'America/New_York').hours, '03');
    assert.equal(formatLocalDate(new Date('2026-11-01T05:59:59Z'), 'America/New_York').hours, '01');
    assert.equal(formatLocalDate(new Date('2026-11-01T06:00:00Z'), 'America/New_York').hours, '01');
  });
  test('resolves representative coordinates and fixed-offset fallback', () => {
    assert.ok(Math.abs(coordinatesForZone('Asia/Seoul', -540)[0] - 37.55) < 0.05);
    assert.ok(coordinatesForZone('Australia/Sydney', -600)[0] < 0);
    assert.deepEqual(coordinatesForZone('Etc/GMT-9', -540), [35, 135]);
  });
});

describe('office sunlight', () => {
  const sample = (hour: number) => officeLight(new Date(`2026-09-06T${String(hour).padStart(2, '0')}:00:00+09:00`), 'Asia/Seoul', 'local');
  test('morning and afternoon move the sun across the equator-facing window', () => {
    const morning = sample(9), afternoon = sample(16);
    assert.ok(morning.position[0] < 0);
    assert.ok(morning.position[2] > 0);
    assert.ok(afternoon.position[0] < 0);
    assert.ok(afternoon.position[2] < 0);
    assert.ok(morning.sun.sunIntensity > 0);
    assert.ok(afternoon.sun.sunIntensity > 0);
  });
  test('night has no direct sunlight and turns on the task lamp', () => {
    assert.equal(sample(0).sun.sunIntensity, 0);
    assert.equal(sample(0).sun.lamp, 1);
    assert.equal(sample(12).sun.daylight, 1);
    assert.equal(sample(12).sun.lamp, 0);
    assert.notDeepEqual(sample(0).sun.windowSky, sample(12).sun.windowSky);
  });
  test('southern hemisphere noon also reaches the left window', () => {
    const sydney = officeLight(new Date('2026-09-06T12:00:00+10:00'), 'Australia/Sydney', 'local');
    assert.ok(sydney.position[0] < 0);
    assert.ok(sydney.position[1] > 0);
  });
  test('previews leave local-time samples deterministic', () => {
    const instant = new Date('2026-09-05T15:00:00Z');
    assert.ok(officeLight(instant, 'Asia/Seoul', 'day').sun.sunIntensity > 2);
    assert.equal(officeLight(instant, 'Asia/Seoul', 'evening').sun.sunIntensity, 0);
    assert.equal(officeLight(instant, 'Asia/Seoul', 'local').sun.sunIntensity, 0);
    assert.equal(formatLocalDate(instant, 'Asia/Seoul').hours, '00');
    assert.equal(instant.toISOString(), '2026-09-05T15:00:00.000Z');
  });
});
