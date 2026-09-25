import { useCallback, useEffect, useRef, useState } from 'react';
import { OFFICE_HOME, officePathView, officeViewFromUrl, officeViewUrl } from './officeNavigation';
import type { OfficeView } from './officeNavigation';

export function useOfficeNavigation() {
  const [view, setView] = useState<OfficeView>(OFFICE_HOME);
  const current = useRef(view);
  const entries = useRef<OfficeView[]>([OFFICE_HOME]);
  const index = useRef(0);
  const waiting = useRef(false);
  const session = useRef('');
  const apply = useCallback((value: OfficeView) => { current.current = value; setView(value); }, []);

  useEffect(() => {
    session.current = crypto.randomUUID();
    const url = new URL(window.location.href);
    const initial = url.pathname !== '/' ? officePathView(url.pathname + url.search + url.hash, OFFICE_HOME) ?? OFFICE_HOME : officeViewFromUrl(url);
    entries.current = [initial];
    index.current = 0;
    apply(initial);
    window.history.replaceState({ officeSession: session.current, officeIndex: 0 }, '', officeViewUrl(window.location.href, initial));
    const restore = (event: PopStateEvent) => {
      waiting.current = false;
      const state: unknown = event.state;
      if (state && typeof state === 'object' && 'officeSession' in state && state.officeSession === session.current
        && 'officeIndex' in state && typeof state.officeIndex === 'number' && entries.current[state.officeIndex]) {
        index.current = state.officeIndex;
        apply(entries.current[state.officeIndex]);
      } else {
        const value = officeViewFromUrl(new URL(window.location.href));
        entries.current = [value]; index.current = 0; apply(value);
      }
    };
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, [apply]);

  const go = useCallback((value: OfficeView, replace = false) => {
    if (waiting.current || JSON.stringify(value) === JSON.stringify(current.current)) return;
    if (replace) entries.current[index.current] = value;
    else {
      entries.current = entries.current.slice(0, index.current + 1);
      entries.current.push(value); index.current += 1;
    }
    const state = { officeSession: session.current, officeIndex: index.current };
    if (replace) window.history.replaceState(state, '', officeViewUrl(window.location.href, value));
    else window.history.pushState(state, '', officeViewUrl(window.location.href, value));
    apply(value);
  }, [apply]);

  const close = useCallback(() => {
    if (waiting.current) return;
    if (index.current > 0 && window.history.state?.officeSession === session.current) {
      waiting.current = true;
      apply(entries.current[index.current - 1]);
      window.history.back();
    } else go(OFFICE_HOME, true);
  }, [apply, go]);

  return { view, current, go, close };
}
