import { useEffect, useMemo, useRef, useState } from 'react';
import { OfficeIcon } from '../OfficeIcon';
import { conferenceEvents } from './conferenceCalendarData';
import { eventsOnDate, monthGrid, shiftMonth } from './conferenceCalendarModel';
import type { CalendarMonth, ConferenceEvent } from './conferenceCalendarModel';
import './conference-calendar.css';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const MONTH_FORMAT = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric', timeZone: 'UTC' });

function eventDates(event: ConferenceEvent): string {
  if (!event.endDate || event.endDate === event.startDate) return event.startDate;
  return `${event.startDate}–${event.endDate.slice(5)}`;
}

export default function ConferenceCalendar({ onClose }: { readonly onClose: () => void }) {
  const now = new Date();
  const [month, setMonth] = useState<CalendarMonth>({ year: now.getFullYear(), month: now.getMonth() });
  const closeButton = useRef<HTMLButtonElement>(null);
  const cells = useMemo(() => monthGrid(month), [month]);
  const monthEvents = useMemo(() => conferenceEvents.filter(event => {
    const monthStart = new Date(Date.UTC(month.year, month.month, 1)).toISOString().slice(0, 10);
    const monthEnd = new Date(Date.UTC(month.year, month.month + 1, 0)).toISOString().slice(0, 10);
    return event.startDate <= monthEnd && (event.endDate ?? event.startDate) >= monthStart;
  }), [month]);
  const label = MONTH_FORMAT.format(new Date(Date.UTC(month.year, month.month, 1)));

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || document.querySelector('dialog:modal')) return;
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        setMonth(current => shiftMonth(current, event.key === 'ArrowLeft' ? -1 : 1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [onClose]);

  return <div className="conference-calendar-stage" onPointerDown={event => event.stopPropagation()}
    onDoubleClick={event => event.stopPropagation()} onWheel={event => event.stopPropagation()}>
    <button ref={closeButton} className="conference-calendar-close" type="button" onClick={onClose}
      aria-label="Close conference calendar and return to office"><OfficeIcon name="close" /></button>
    <section className="conference-calendar-paper" role="dialog" aria-modal="false"
      aria-labelledby="conference-calendar-title" lang="en">
      <button className="conference-calendar-edge conference-calendar-edge-left" type="button"
        onClick={() => setMonth(current => shiftMonth(current, -1))} aria-label="Previous month"><span aria-hidden="true">‹</span></button>
      <button className="conference-calendar-edge conference-calendar-edge-right" type="button"
        onClick={() => setMonth(current => shiftMonth(current, 1))} aria-label="Next month"><span aria-hidden="true">›</span></button>
      <header>
        <p>Conference calendar</p>
        <h2 id="conference-calendar-title">{label}</h2>
      </header>
      <div className="conference-calendar-weekdays" aria-hidden="true">
        {WEEKDAYS.map(day => <span key={day}>{day}</span>)}
      </div>
      <div className="conference-calendar-grid" role="list" aria-label={label}>
        {cells.map(cell => {
          const events = eventsOnDate(cell.isoDate, monthEvents);
          return <div className="conference-calendar-day" data-in-month={cell.inMonth} data-has-event={events.length > 0}
            role="listitem" aria-label={`${cell.isoDate}${events.length > 0 ? `: ${events.map(event => event.title).join(', ')}` : ''}`}
            key={cell.isoDate}>
            <time dateTime={cell.isoDate}>{cell.day}</time>
            {events.map(event => <span className="conference-calendar-mark" key={event.id}>{event.title}</span>)}
          </div>;
        })}
      </div>
      <div className="conference-calendar-ledger" aria-live="polite">
        {monthEvents.length === 0 ? <p className="conference-calendar-empty">No conferences listed this month.</p>
          : monthEvents.map(event => <article key={event.id}>
            <time dateTime={event.startDate}>{eventDates(event)}</time>
            <div><h3>{event.title}</h3><p>{[event.participation, event.venue].filter(Boolean).join(' · ')}</p></div>
          </article>)}
      </div>
    </section>
  </div>;
}
