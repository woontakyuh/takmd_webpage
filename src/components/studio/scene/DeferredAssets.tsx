import { createContext, useContext, useEffect, useState, Suspense } from 'react';
import type { ReactNode } from 'react';

// Models that are not in the opening view — the guitar, the amplifier, the surfboard, the garments, the plush pig —
// are mounted only after the room is ready and the browser is idle, so the first load carries the room and not
// sixteen megabytes of things behind the visitor. Each waits in its own Suspense so its arrival never blanks the room.

const RoomReadyContext = createContext(false);

export function RoomReadyProvider({ ready, children }: { readonly ready: boolean; readonly children: ReactNode }) {
  return <RoomReadyContext.Provider value={ready}>{children}</RoomReadyContext.Provider>;
}

let queued = 0;

export const useRoomReady = () => useContext(RoomReadyContext);

export function Deferred({ children }: { readonly children: ReactNode }) {
  const ready = useContext(RoomReadyContext);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (!ready || mounted) return;
    // Stagger the arrivals a little so several models do not decode in the same frame.
    const order = queued++;
    const idle = window.requestIdleCallback?.bind(window) ?? ((run: () => void) => window.setTimeout(run, 400));
    const cancel = window.cancelIdleCallback?.bind(window);
    let timer = 0;
    const handle = idle(() => { timer = window.setTimeout(() => setMounted(true), order * 250); });
    return () => { if (cancel && typeof handle === 'number') cancel(handle); window.clearTimeout(timer); };
  }, [ready, mounted]);
  if (!mounted) return null;
  return <Suspense fallback={null}>{children}</Suspense>;
}
