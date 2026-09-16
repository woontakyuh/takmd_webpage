import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Presentation } from '../types';

export function TvLectureTree({ presentations, selected, onSelect, scrollOffset = 0, onScrollOffset }: {
  readonly presentations: readonly Presentation[];
  readonly selected: string | undefined;
  readonly onSelect: (id: string) => void;
  readonly scrollOffset?: number;
  readonly onScrollOffset?: (offset: number) => void;
}) {
  const tree = useRef<HTMLElement>(null);
  const initialScrollOffset = useRef(scrollOffset);
  const attachTree = useCallback((element: HTMLElement | null) => {
    tree.current = element;
    if (!element) return;
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      if (initialScrollOffset.current === 0) element.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest' });
      observer.disconnect();
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const selectedYear = presentations.find(talk => talk.id === selected)?.date.slice(0, 4);
  const previousSelectedYear = useRef(selectedYear);
  const [expanded, setExpanded] = useState<readonly string[]>(selectedYear ? [selectedYear] : []);
  const years = useMemo(() => {
    const ordered = presentations.toSorted((a, b) => b.date.localeCompare(a.date));
    return [...new Set(ordered.map(talk => talk.date.slice(0, 4)))].map(year => ({
      year, dates: [...new Set(ordered.filter(talk => talk.date.startsWith(year)).map(talk => talk.date))]
        .map(date => ({ date, talks: ordered.filter(talk => talk.date === date) })),
    }));
  }, [presentations]);
  useLayoutEffect(() => {
    const element = tree.current;
    if (element) element.scrollTop = initialScrollOffset.current * element.clientHeight;
  }, []);
  useEffect(() => {
    if (!selectedYear) return;
    setExpanded([selectedYear]);
    if (previousSelectedYear.current !== selectedYear) {
      const element = tree.current;
      if (element) element.scrollTop = 0;
      onScrollOffset?.(0);
    }
    previousSelectedYear.current = selectedYear;
  }, [onScrollOffset, selectedYear]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const element = tree.current;
      if (initialScrollOffset.current === 0) element?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest' });
      if (element) onScrollOffset?.(element.scrollTop / Math.max(1, element.clientHeight));
    });
    return () => cancelAnimationFrame(frame);
  }, [expanded, onScrollOffset, selected]);

  return <nav ref={attachTree} className="tv-lecture-tree" aria-label="Lectures by year and date"
    onScroll={event => onScrollOffset?.(event.currentTarget.scrollTop / Math.max(1, event.currentTarget.clientHeight))}>
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
