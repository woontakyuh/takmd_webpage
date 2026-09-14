import { Component, useEffect, useRef, type ReactNode } from 'react';
import { OFFICE_POSTER_MANIFEST } from './officePosterConfig';
import './office-poster.css';

export class SceneBoundary extends Component<{
  readonly children: ReactNode;
  readonly onError: () => void;
}, { readonly failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export function OfficePoster({ ready, failed, night, onHidden }: {
  readonly ready: boolean;
  readonly failed: boolean;
  readonly night: boolean;
  readonly onHidden: () => void;
}) {
  const poster = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ready || failed || !poster.current) return;
    let active = true;
    getComputedStyle(poster.current).opacity;
    Promise.all(poster.current.getAnimations().map(animation => animation.finished.catch(() => undefined)))
      .then(() => { if (active) onHidden(); });
    return () => { active = false; };
  }, [ready, failed, onHidden]);
  const time = night ? 'night' : 'day';
  const fallback = OFFICE_POSTER_MANIFEST.variants.at(-1);
  if (!fallback) return null;
  return <div ref={poster} className="office-poster" data-ready={ready && !failed} data-failed={failed} aria-hidden={ready && !failed}>
    <picture>
      {OFFICE_POSTER_MANIFEST.variants.slice(0, -1).map(variant => variant.media
        ? <source key={variant.id} media={variant.media} srcSet={time === 'night' ? variant.nightSrc : variant.daySrc} />
        : null)}
      <img src={time === 'night' ? fallback.nightSrc : fallback.daySrc} alt="Seated at the desk, with the CV monitor, keyboard and office TV in view"
        width={fallback.width} height={fallback.height} fetchPriority="high" decoding="async" />
    </picture>
    {OFFICE_POSTER_MANIFEST.variants.map(variant => {
      const scale = `max(${100 / variant.width}cqw, ${100 / variant.height}cqh)`;
      const center = variant.monitor.x + variant.monitor.across[0] / 2 - variant.width / 2;
      const clearance = `max(16px, ${variant.monitor.across[0] * 0.07} * ${scale})`;
      const top = variant.monitor.y + variant.monitor.across[1] / 2 - variant.height / 2;
      return <span key={variant.id} className="office-poster-status" data-variant={variant.id} role="status"
        style={{ left: `calc(50% + ${center} * ${scale})`, top: `calc(50% + ${top} * ${scale} - ${clearance})` }}>
        {failed ? 'The office couldn’t open. Please reload.' : 'Opening the office…'}
      </span>;
    })}
  </div>;
}
