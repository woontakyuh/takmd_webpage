import type { Presentation } from '../types';
import { conferenceEvents } from './conferenceCalendarData';
import { PALETTE } from './config';

export const TV_EVENT_RECORD = {
  background: PALETTE.nightBg, foreground: PALETTE.paperLight, secondary: PALETTE.line,
  accent: PALETTE.tealLight, font: '"Manrope Variable", "Avenir Next", sans-serif',
  inset: 64, statusTop: 64, titleTop: 160, dateTop: 464, venueTop: 544, materialsTop: 736,
  titleSize: 64, compactTitleSize: 80, detailSize: 32, compactDetailSize: 48,
} as const;

const STATUS_LABEL = { upcoming: 'Upcoming', today: 'Today', record: 'Event record' } as const;

export function eventRecord(talk: Presentation | null, mediaRole?: string, today = new Date().toISOString().slice(0, 10)) {
  const status = talk && talk.date > today ? 'upcoming' : talk?.date === today ? 'today' : 'record';
  return {
    status,
    statusLabel: STATUS_LABEL[status],
    title: talk?.title || 'Talks & teaching',
    date: talk ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
      .format(new Date(`${talk.date}T00:00:00Z`)) : '',
    venue: talk?.venue || '',
    role: mediaRole || conferenceEvents.find(event => event.id === talk?.id)?.participation || '',
    materials: 'Presentation materials not added',
  };
}

export type TvEventRecordData = ReturnType<typeof eventRecord>;

function wrappedLines(context: CanvasRenderingContext2D, text: string, width: number): readonly string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && context.measureText(next).width > width) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function drawLines(context: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, lineHeight: number, balanced = false): void {
  const count = wrappedLines(context, text, width).length;
  let lower = 0;
  let upper = width;
  if (balanced && count > 1) {
    // Match the reader heading's balanced wrapping in the physical canvas texture.
    for (let pass = 0; pass < 16; pass += 1) {
      const midpoint = (lower + upper) / 2;
      if (wrappedLines(context, text, midpoint).length > count) lower = midpoint;
      else upper = midpoint;
    }
  }
  wrappedLines(context, text, upper).forEach((line, index) => context.fillText(line, x, y + index * lineHeight));
}

export function drawTvEventRecord(context: CanvasRenderingContext2D, record: TvEventRecordData, compact: boolean, left: number): void {
  const design = TV_EVENT_RECORD;
  const x = left + design.inset;
  const width = 1600 - left - design.inset * 2;
  const titleSize = compact ? design.compactTitleSize : design.titleSize;
  const detailSize = compact ? design.compactDetailSize : design.detailSize;
  context.fillStyle = design.background;
  context.fillRect(left, 0, 1600 - left, 820);
  context.textBaseline = 'top';
  context.fillStyle = design.accent;
  context.font = `500 ${detailSize}px ${design.font}`;
  context.fillText(record.statusLabel, x, design.statusTop);
  context.fillStyle = design.foreground;
  context.font = `500 ${titleSize}px ${design.font}`;
  drawLines(context, record.title, x, design.titleTop, width, titleSize * 1.2, true);
  context.font = `${detailSize}px ${design.font}`;
  context.fillText([record.date, record.role].filter(Boolean).join(' · '), x, design.dateTop);
  context.fillStyle = design.secondary;
  drawLines(context, record.venue, x, design.venueTop, width, detailSize * 1.4);
  context.fillRect(x, design.materialsTop - 24, width, 1);
  context.fillText(record.materials, x, design.materialsTop);
}
