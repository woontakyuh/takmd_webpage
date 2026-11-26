import { describe, expect, test } from 'bun:test';
import presentationsData from '../../data/presentations.json';
import { featuredPresentation } from './collection';
import type { Presentation } from './types';

const talks = presentationsData.presentations as Presentation[];
const at = (iso: string) => featuredPresentation(talks, Date.parse(iso))?.date;

describe('featured TV lecture', () => {
  test('leads with the first congress lecture in the week before it', () => {
    expect(at('2026-11-26T16:00:00+09:00')).toBe('2026-11-27');
    expect(at('2026-11-21T09:00:00+09:00')).toBe('2026-11-27');
  });
  test('moves to the next lecture once the first day has passed in Seoul', () => {
    expect(at('2026-11-27T23:59:00+09:00')).toBe('2026-11-27');
    expect(at('2026-11-28T00:01:00+09:00')).toBe('2026-11-28');
  });
  test('falls back to the most recent lecture given when none is coming up', () => {
    expect(at('2026-11-17T09:00:00+09:00')).toBe('2026-11-14');
  });
});
