export type ConferenceParticipation = 'Speaker' | 'Faculty' | 'Attendee' | 'Chair';

export type ConferenceEvent = {
  readonly id: string;
  readonly title: string;
  readonly startDate: string;
  readonly endDate?: string;
  readonly venue?: string;
  readonly participation: ConferenceParticipation;
};

export type CalendarMonth = {
  readonly year: number;
  readonly month: number;
};

export type CalendarDay = {
  readonly isoDate: string;
  readonly day: number;
  readonly inMonth: boolean;
};

const DAYS_PER_PAGE = 42;
const MILLISECONDS_PER_DAY = 86_400_000;

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function eventsOnDate(date: string, events: readonly ConferenceEvent[]): readonly ConferenceEvent[] {
  return events.filter(event => event.startDate <= date && (event.endDate ?? event.startDate) >= date);
}

export function monthGrid(month: CalendarMonth): readonly CalendarDay[] {
  const first = new Date(Date.UTC(month.year, month.month, 1));
  const mondayOffset = (first.getUTCDay() + 6) % 7;
  const firstCell = first.getTime() - mondayOffset * MILLISECONDS_PER_DAY;
  return Array.from({ length: DAYS_PER_PAGE }, (_, index) => {
    const date = new Date(firstCell + index * MILLISECONDS_PER_DAY);
    return {
      isoDate: isoDate(date),
      day: date.getUTCDate(),
      inMonth: date.getUTCMonth() === month.month,
    };
  });
}

export function shiftMonth(month: CalendarMonth, direction: -1 | 1): CalendarMonth {
  const date = new Date(Date.UTC(month.year, month.month + direction, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() };
}
