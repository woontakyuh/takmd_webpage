import type { CSSProperties } from 'react';
import { TV_EVENT_RECORD } from './tvEventRecordModel';
import type { TvEventRecordData } from './tvEventRecordModel';

export function TvEventRecord({ record, compact }: { readonly record: TvEventRecordData; readonly compact: boolean }) {
  const design = TV_EVENT_RECORD;
  const style: CSSProperties & Record<`--tv-record-${string}`, string> = {
    '--tv-record-background': design.background,
    '--tv-record-foreground': design.foreground,
    '--tv-record-secondary': design.secondary,
    '--tv-record-accent': design.accent,
    '--tv-record-inset': `${design.inset}px`,
    '--tv-record-status-top': `${design.statusTop}px`,
    '--tv-record-title-top': `${design.titleTop}px`,
    '--tv-record-date-top': `${design.dateTop}px`,
    '--tv-record-venue-top': `${design.venueTop}px`,
    '--tv-record-materials-top': `${design.materialsTop}px`,
    '--tv-record-title-size': `${compact ? design.compactTitleSize : design.titleSize}px`,
    '--tv-record-detail-size': `${compact ? design.compactDetailSize : design.detailSize}px`,
  };
  return <article className="tv-screen-record" style={style} data-status={record.status} aria-label="Event details">
    <p className="tv-screen-record-status">{record.statusLabel}</p>
    <h2>{record.title}</h2>
    <p className="tv-screen-record-date">{[record.date, record.role].filter(Boolean).join(' · ')}</p>
    {record.venue && <p className="tv-screen-record-venue">{record.venue}</p>}
    <p className="tv-screen-record-materials">{record.materials}</p>
  </article>;
}
