import { useEffect, useState } from 'react';
import { computeSun, guessCoords, reviewDate, type SunState } from './sun';

/**
 * Visitor-local sun state, refreshed every minute. Coordinates come from the
 * Geolocation API when already granted, otherwise a timezone-based guess —
 * we never prompt: lighting mood is not worth a permission dialog.
 */
export function useSun(): SunState {
  const [coords, setCoords] = useState<[number, number]>(() => guessCoords());
  const [sun, setSun] = useState<SunState>(() => computeSun(reviewDate(), coords[0], coords[1]));

  useEffect(() => {
    if (!navigator.permissions?.query || !navigator.geolocation) return;
    let cancelled = false;
    navigator.permissions
      .query({ name: 'geolocation' })
      .then((status) => {
        if (cancelled || status.state !== 'granted') return;
        navigator.geolocation.getCurrentPosition(
          (p) => !cancelled && setCoords([p.coords.latitude, p.coords.longitude]),
          () => undefined,
          { maximumAge: 3_600_000, timeout: 5_000 },
        );
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const update = () => setSun(computeSun(reviewDate(), coords[0], coords[1]));
    update();
    const id = window.setInterval(update, 60_000);
    return () => window.clearInterval(id);
  }, [coords]);

  return sun;
}
