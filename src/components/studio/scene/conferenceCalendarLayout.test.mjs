import { describe, expect, it } from 'bun:test';
import { monthGrid } from './conferenceCalendarModel.ts';
import { conferenceWeeks } from './conferenceCalendarLayout.ts';

const meeting = (id, startDate, endDate = startDate) => ({ id, title: id, startDate, endDate, participation: 'Speaker' });
const segmentsFor = (weeks, id) => weeks.flatMap(week => week.segments.filter(segment => segment.event.id === id));

describe('continuous calendar events', () => {
  it('spans July 9 through 11 with one bar over three date columns', () => {
    // Given a three-day conference inside one calendar week.
    const event = meeting('KASS', '2026-07-09', '2026-07-11');
    // When July is composed.
    const segments = segmentsFor(conferenceWeeks(monthGrid({ year: 2026, month: 6 }), [event]), event.id);
    // Then the single label covers Thursday through Saturday.
    expect(segments).toHaveLength(1);
    expect(segments[0]).toMatchObject({ column: 4, span: 3, lane: 0, continuesBefore: false, continuesAfter: false });
  });

  it('splits a Sunday-to-Tuesday conference only at the week boundary', () => {
    // Given one continuous event crossing Sunday to Monday.
    const event = meeting('cross-week', '2026-07-12', '2026-07-14');
    // When July is composed.
    const segments = segmentsFor(conferenceWeeks(monthGrid({ year: 2026, month: 6 }), [event]), event.id);
    // Then both pieces preserve one lane and expose continuation endpoints.
    expect(segments).toHaveLength(2);
    expect(segments[0]).toMatchObject({ column: 7, span: 1, lane: 0, continuesBefore: false, continuesAfter: true });
    expect(segments[1]).toMatchObject({ column: 1, span: 2, lane: 0, continuesBefore: true, continuesAfter: false });
  });

  it('preserves a month-crossing bar through visible neighboring dates', () => {
    // Given a meeting that begins in July and finishes in August.
    const event = meeting('cross-month', '2026-07-31', '2026-08-03');
    // When the July page includes its neighboring August date cells.
    const segments = segmentsFor(conferenceWeeks(monthGrid({ year: 2026, month: 6 }), [event]), event.id);
    // Then July 31 through August 2 share one piece, continued on August 3.
    expect(segments.map(({ column, span, continuesBefore, continuesAfter }) => ({ column, span, continuesBefore, continuesAfter }))).toEqual([
      { column: 5, span: 3, continuesBefore: false, continuesAfter: true },
      { column: 1, span: 1, continuesBefore: true, continuesAfter: false },
    ]);
  });

  it('clips long events at page edges while retaining continuation on every visible week', () => {
    // Given a multi-month event covering the entire page.
    const event = meeting('long', '2026-06-01', '2026-09-01');
    // When July is composed.
    const segments = segmentsFor(conferenceWeeks(monthGrid({ year: 2026, month: 6 }), [event]), event.id);
    // Then six full-width pieces all indicate that the event continues.
    expect(segments).toHaveLength(6);
    expect(segments.every(segment => segment.column === 1 && segment.span === 7 && segment.continuesBefore && segment.continuesAfter)).toBe(true);
  });

  it('keeps overlapping events in stable lanes independent of source ordering', () => {
    // Given overlapping ranges plus a later event that can reuse a completed lane.
    const events = [meeting('short', '2026-07-09'), meeting('long', '2026-07-09', '2026-07-15'), meeting('later', '2026-07-10', '2026-07-14')];
    const cells = monthGrid({ year: 2026, month: 6 });
    // When source order changes between reads.
    const first = conferenceWeeks(cells, events);
    const reversed = conferenceWeeks(cells, events.toReversed());
    // Then the longer range leads, continuations keep their lane, and no ranges collide.
    expect(first).toEqual(reversed);
    expect(segmentsFor(first, 'long').map(segment => segment.lane)).toEqual([0, 0]);
    expect(segmentsFor(first, 'short').map(segment => segment.lane)).toEqual([1]);
    expect(segmentsFor(first, 'later').map(segment => segment.lane)).toEqual([1, 1]);
    for (const week of first) {
      for (const segment of week.segments) {
        expect(week.segments.filter(other => other !== segment && other.lane === segment.lane
          && segment.column < other.column + other.span && other.column < segment.column + segment.span)).toHaveLength(0);
      }
    }
  });

  it('preserves six calendar weeks for both empty and crowded months', () => {
    // Given identical July dates with zero or many overlapping conferences.
    const cells = monthGrid({ year: 2026, month: 6 });
    const events = Array.from({ length: 12 }, (_, index) => meeting(String(index), '2026-07-09', '2026-07-11'));
    // When both pages are composed.
    const empty = conferenceWeeks(cells, []), busy = conferenceWeeks(cells, events);
    // Then date-cell geometry remains identical and every event remains in the layout data.
    expect(empty.map(week => week.days)).toEqual(busy.map(week => week.days));
    expect(busy).toHaveLength(6);
    expect(busy.flatMap(week => week.segments)).toHaveLength(12);
  });
});
