import calendar from '../../../data/conference-calendar.json';
import type { ConferenceEvent, ConferenceParticipation } from './conferenceCalendarModel';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function participation(value: unknown): ConferenceParticipation | null {
  switch (value) {
    case 'Speaker': return 'Speaker';
    case 'Faculty': return 'Faculty';
    case 'Attendee': return 'Attendee';
    case 'Chair': return 'Chair';
    default: return null;
  }
}

function eventFrom(value: unknown): ConferenceEvent | null {
  if (typeof value !== 'object' || value === null
    || !('id' in value) || typeof value.id !== 'string'
    || !('title' in value) || typeof value.title !== 'string'
    || !('startDate' in value) || typeof value.startDate !== 'string'
    || !('participation' in value)) return null;
  const role = participation(value.participation);
  if (!role || !ISO_DATE.test(value.startDate) || value.startDate < '2025-01-01') return null;
  const endDate = 'endDate' in value && typeof value.endDate === 'string' ? value.endDate : undefined;
  const venue = 'venue' in value && typeof value.venue === 'string' ? value.venue : undefined;
  if (endDate && (!ISO_DATE.test(endDate) || endDate < value.startDate)) return null;
  return {
    id: value.id,
    title: value.title,
    startDate: value.startDate,
    ...(endDate ? { endDate } : {}),
    ...(venue ? { venue } : {}),
    participation: role,
  };
}

function eventsFrom(value: unknown): readonly ConferenceEvent[] {
  if (typeof value !== 'object' || value === null || !('events' in value) || !Array.isArray(value.events)) return [];
  return value.events.flatMap(item => {
    const event = eventFrom(item);
    return event ? [event] : [];
  }).toSorted((left, right) => left.startDate.localeCompare(right.startDate));
}

export const conferenceEvents = eventsFrom(calendar);
