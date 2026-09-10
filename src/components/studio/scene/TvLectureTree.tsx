import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Presentation } from '../types';

export function TvLectureTree({ presentations, selected, onSelect }: {
  readonly presentations: readonly Presentation[];
  readonly selected: string | undefined;
  readonly onSelect: (id: string) => void;
}) {
  const tree = useRef<HTMLElement>(null);
  const attachTree = useCallback((element: HTMLElement | null) => {
    tree.current = element;
    if (!element) return;
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      element.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest' });
      observer.disconnect();
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const selectedYear = presentations.find(talk => talk.id === selected)?.date.slice(0, 4);
  const [expanded, setExpanded] = useState<readonly string[]>(selectedYear ? [selectedYear] : []);
  const years = useMemo(() => {
    const ordered = presentations.toSorted((a, b) => b.date.localeCompare(a.date));
    return [...new Set(ordered.map(talk => talk.date.slice(0, 4)))].map(year => ({
      year, dates: [...new Set(ordered.filter(talk => talk.date.startsWith(year)).map(talk => talk.date))]
        .map(date => ({ date, talks: ordered.filter(talk => talk.date === date) })),
    }));
  }, [presentations]);
  useEffect(() => {
    if (selectedYear) setExpanded(current => current.includes(selectedYear) ? current : [...current, selectedYear]);
  }, [selectedYear]);
  useEffect(() => {
    tree.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [expanded, selected]);

  return <nav ref={attachTree} className="tv-lecture-tree" aria-label="Lectures by year and date">
    <p className="tv-lecture-index-label">LECTURE ARCHIVE</p>
    {years.map(({ year, dates }) => <div key={year} className="tv-lecture-year">
      <button className="tv-lecture-year-toggle" aria-expanded={expanded.includes(year)} aria-controls={`tv-year-${year}`}
        onClick={() => setExpanded(current => current.includes(year) ? current.filter(value => value !== year) : [...current, year])}>
        <span aria-hidden="true">{expanded.includes(year) ? '▾' : '▸'}</span>{year}<small>{dates.reduce((total, item) => total + item.talks.length, 0)}</small>
      </button>
      <div id={`tv-year-${year}`} hidden={!expanded.includes(year)}>
        {dates.map(({ date, talks }) => <section className="tv-lecture-date" key={date} aria-label={date}>
          <time dateTime={date}>{new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`))}</time>
          {talks.map(talk => {
            return <button key={talk.id} className="tv-lecture-entry" aria-current={selected === talk.id ? 'true' : undefined}
              title={[talk.title, talk.topic].filter(Boolean).join(' · ')} onClick={() => onSelect(talk.id)}>
              <strong>{talk.title}</strong>
            </button>;
          })}
        </section>)}
      </div>
    </div>)}
  </nav>;
}
