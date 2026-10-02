import { useEffect, useState } from 'react';
import './visitorCount.css';

type VisitCount = { readonly count: number; readonly since: string };
const sessionKey = 'takmd:visit-session:v1';
const sessionPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function getSessionId(): string | null {
  try {
    const stored = sessionStorage.getItem(sessionKey);
    if (stored && sessionPattern.test(stored)) return stored;
    const id = crypto.randomUUID();
    sessionStorage.setItem(sessionKey, id);
    return id;
  } catch (error) {
    if (error instanceof DOMException || error instanceof TypeError) return null;
    throw error;
  }
}

function parseCount(value: unknown): VisitCount | null {
  if (typeof value !== 'object' || value === null || !('count' in value) || !('since' in value)) return null;
  if (typeof value.count !== 'number' || !Number.isSafeInteger(value.count) || value.count < 0) return null;
  if (typeof value.since !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value.since)) return null;
  return { count: value.count, since: value.since };
}

async function loadCount(signal: AbortSignal): Promise<VisitCount | null> {
  const sessionId = getSessionId();
  try {
    const response = await fetch('/api/visits', {
      method: sessionId ? 'POST' : 'GET',
      ...(sessionId ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId }) } : {}),
      credentials: 'omit', mode: 'same-origin', cache: 'no-store',
      signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]),
    });
    if (!response.ok || response.status === 204) return null;
    return parseCount(await response.json());
  } catch (error) {
    if (error instanceof Error) return null;
    throw error;
  }
}

export function VisitorCount() {
  const [visits, setVisits] = useState<VisitCount | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    let requested = false;
    const countVisibleVisit = () => {
      if (document.visibilityState !== 'visible' || requested) return;
      requested = true;
      void loadCount(controller.signal).then(result => {
        if (!controller.signal.aborted) setVisits(result);
      });
    };
    countVisibleVisit();
    document.addEventListener('visibilitychange', countVisibleVisit);
    return () => {
      controller.abort();
      document.removeEventListener('visibilitychange', countVisibleVisit);
    };
  }, []);
  if (!visits) return null;
  return <span className="studio-visitor-count" title={`Visits since ${visits.since}. One per browser-tab session; refreshes count once.`}>
    {visits.count.toLocaleString('en-US')} {visits.count === 1 ? 'visit' : 'visits'}
  </span>;
}
