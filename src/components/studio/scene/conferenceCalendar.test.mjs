import { describe, expect, it } from 'bun:test';
import { conferenceEvents } from './conferenceCalendarData.ts';
import { eventsOnDate, monthGrid, shiftMonth } from './conferenceCalendarModel.ts';

const rangedEvent = {
  id: 'range',
  title: 'Academic meeting',
  startDate: '2028-02-28',
  endDate: '2028-03-01',
  participation: 'Attendee',
};

describe('monthGrid', () => {
  it('Given February 2028, when its month page is built, then leap day appears in a Monday-first grid', () => {
    const grid = monthGrid({ year: 2028, month: 1 });

    expect(grid).toHaveLength(42);
    expect(grid[0]?.isoDate).toBe('2028-01-31');
    expect(grid.find(cell => cell.isoDate === '2028-02-29')?.inMonth).toBe(true);
  });
});

describe('eventsOnDate', () => {
  it('Given a conference spanning a month boundary, when March first is read, then the conference is present', () => {
    expect(eventsOnDate('2028-03-01', [rangedEvent]).map(event => event.id)).toEqual(['range']);
  });
});

describe('shiftMonth', () => {
  it('Given January, when the previous paper is selected, then December of the prior year is returned', () => {
    expect(shiftMonth({ year: 2026, month: 0 }, -1)).toEqual({ year: 2025, month: 11 });
  });
});

describe('conferenceEvents', () => {
  it('Given the public snapshot, when calendar data is adapted, then only supported 2025+ roles are exposed', () => {
    expect(conferenceEvents.length).toBeGreaterThan(0);
    expect(conferenceEvents.every(event => event.startDate >= '2025-01-01')).toBe(true);
    expect(new Set(conferenceEvents.map(event => event.participation)).has('Faculty')).toBe(true);
  });

  it('Given September 2026, when listed conferences are read, then the month is empty', () => {
    expect(conferenceEvents.filter(event => event.startDate.startsWith('2026-09'))).toEqual([]);
  });
});
