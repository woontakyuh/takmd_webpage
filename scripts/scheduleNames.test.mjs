import { describe, expect, it } from 'bun:test';
import { applyOverrides } from './schedule-overrides';
import overrides from '../src/data/schedule-overrides.json';
import presentations from '../src/data/presentations.json';
import calendar from '../src/data/conference-calendar.json';

const { _comment, ...englishOverrides } = overrides;

const cases = [
  { date: '2026-11-27', rawName: 'WSC 2026 발표 · KOMISS Registry', name: 'World Spinoscopy Congress (WSC) 2026 — KOMISS Registry' },
  { date: '2026-05-08', rawName: 'WCMISST', name: '8th World Congress of Minimally Invasive Spine Surgery and Techniques (WCMISST 2026)' },
];

describe('verified schedule names', () => {
  for (const item of cases) {
    it(`keeps the verified event identity across sync and public snapshots for ${item.rawName}`, () => {
      // Given the live Notion name and the checked-in presentation metadata.
      const saved = presentations.presentations.find(record => record.date === item.date);
      if (!saved) throw new Error(`Missing presentation: ${item.date}`);
      const raw = { ...saved, name: item.rawName };
      // When the same override step as fetch-schedule runs.
      const output = applyOverrides(raw, englishOverrides);
      // Then every public event title uses the verified name and the talk metadata survives.
      expect(output.name).toBe(item.name);
      expect(saved.name).toBe(output.name);
      expect(calendar.events.find(event => event.id === saved.id)?.title).toBe(output.name);
      expect(output.topics).toEqual(raw.topics);
      expect(output.societies).toEqual(raw.societies);
      expect(raw.name).toBe(item.rawName);
    });
  }

  it('uses the verified organizer page when Notion still links to the redirected WCMISST domain', () => {
    // Given the original Notion link.
    const raw = { date: '2026-05-08', name: 'WCMISST', place: '', topics: [], url: 'https://wcmisst2026.org/' };
    // When the sync overrides run.
    const output = applyOverrides(raw, englishOverrides);
    // Then the public link points to the organizer source verified for this event.
    expect(output.url).toBe('https://unitedscientificgroup.org/wcmisst/about');
    expect(presentations.presentations.find(record => record.date === raw.date)?.url).toBe(output.url);
  });

  it('preserves an unverified acronym when no override exists', () => {
    // Given an unknown event with no source-backed expansion.
    const raw = { date: '2030-01-02', name: 'WSC', place: '', topics: ['Original topic'], url: '' };
    // When a future sync encounters it.
    const output = applyOverrides(raw, englishOverrides);
    // Then no expansion or other metadata is invented.
    expect(output).toEqual(raw);
  });
});
