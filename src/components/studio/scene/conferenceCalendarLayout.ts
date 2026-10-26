import type { CalendarDay, ConferenceEvent } from './conferenceCalendarModel';

export type ConferenceSegment = {
  readonly event: ConferenceEvent;
  readonly column: number;
  readonly span: number;
  readonly lane: number;
  readonly continuesBefore: boolean;
  readonly continuesAfter: boolean;
};

export type ConferenceWeek = {
  readonly days: readonly CalendarDay[];
  readonly segments: readonly ConferenceSegment[];
};

export function conferenceWeeks(cells: readonly CalendarDay[], events: readonly ConferenceEvent[]): readonly ConferenceWeek[] {
  const first = cells[0], last = cells.at(-1);
  if (!first || !last) return [];
  const laneEnds: string[] = [];
  const positioned = events.filter(event => event.startDate <= last.isoDate && (event.endDate ?? event.startDate) >= first.isoDate)
    .toSorted((left, right) => left.startDate.localeCompare(right.startDate)
      || (right.endDate ?? right.startDate).localeCompare(left.endDate ?? left.startDate) || left.id.localeCompare(right.id))
    .map(event => {
      const available = laneEnds.findIndex(end => end < event.startDate);
      const lane = available < 0 ? laneEnds.length : available;
      laneEnds[lane] = event.endDate ?? event.startDate;
      return { event, lane };
    });
  const weeks: ConferenceWeek[] = [];
  for (let offset = 0; offset < cells.length; offset += 7) {
    const days = cells.slice(offset, offset + 7);
    const start = days[0], end = days.at(-1);
    if (!start || !end) continue;
    const segments = positioned.flatMap(({ event, lane }): ConferenceSegment[] => {
      const eventEnd = event.endDate ?? event.startDate;
      if (event.startDate > end.isoDate || eventEnd < start.isoDate) return [];
      const column = days.findIndex(day => day.isoDate >= event.startDate) + 1;
      const lastColumn = days.findLastIndex(day => day.isoDate <= eventEnd) + 1;
      return [{ event, column, span: lastColumn - column + 1, lane,
        continuesBefore: event.startDate < start.isoDate, continuesAfter: eventEnd > end.isoDate }];
    });
    weeks.push({ days, segments });
  }
  return weeks;
}
