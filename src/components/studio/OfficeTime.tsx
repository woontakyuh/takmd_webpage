import { useEffect, useState } from 'react';
import { formatLocalDate, localZone, officeLight, type LightMode, type OfficeLight } from './localTime';

export function useOfficeLight(mode: LightMode): OfficeLight | null {
  const [light, setLight] = useState<OfficeLight | null>(null);
  useEffect(() => {
    const update = () => setLight(officeLight(new Date(), localZone(), mode));
    update();
    const timer = window.setInterval(update, 30_000);
    document.addEventListener('visibilitychange', update);
    window.addEventListener('focus', update);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', update);
      window.removeEventListener('focus', update);
    };
  }, [mode]);
  return light;
}

export function useLocalDate() {
  const [date, setDate] = useState<ReturnType<typeof formatLocalDate> | null>(null);
  useEffect(() => {
    const update = () => setDate(formatLocalDate(new Date(), localZone()));
    update();
    const timer = window.setInterval(update, 1000);
    document.addEventListener('visibilitychange', update);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', update); };
  }, []);
  return date;
}

export function LocalClockReadout() {
  const date = useLocalDate();
  if (!date) return null;
  return <time className="office-local-time" dateTime={date.iso} title={`Your device time · ${date.zone}`}>
    <span>{date.day} {date.month} {date.year} · {date.hours}:{date.minutes}:{date.seconds}</span>
    <small>{date.zone}</small>
  </time>;
}
