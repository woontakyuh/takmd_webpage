import { describe, expect, it } from 'bun:test';
import { eventRecord } from './tvEventRecordModel';

const talk = { id: '3c5908af25b981e5b940f4e8ce3d83d1', title: 'World Spine Congress 2026 — KOMISS Session', date: '2026-11-27', venue: 'Hall 4, Songdo Convensia, Incheon, South Korea', topic: 'Existing lecture topic' };

describe('eventRecord', () => {
  it('marks a future dated event upcoming and retains its verified metadata', () => {
    const record = eventRecord(talk, undefined, '2026-09-22');

    expect(record.status).toBe('upcoming');
    expect(record.title).toBe(talk.title);
    expect(record.date).toBe('27 November 2026');
    expect(record.venue).toBe(talk.venue);
    expect(record.role).toBe('Speaker');
  });

  it('switches from upcoming to today and then record at the event date', () => {
    expect(eventRecord(talk, undefined, '2026-11-27').status).toBe('today');
    expect(eventRecord(talk, undefined, '2026-11-28').status).toBe('record');
  });

  it('uses an explicit media role before the calendar role', () => {
    const record = eventRecord(talk, 'Faculty', '2026-09-22');

    expect(record.role).toBe('Faculty');
  });

  it('does not infer a role or venue for a record without those source fields', () => {
    const record = eventRecord({ ...talk, id: 'unknown', venue: '' }, undefined, '2026-09-22');

    expect(record.role).toBe('');
    expect(record.venue).toBe('');
  });
});
