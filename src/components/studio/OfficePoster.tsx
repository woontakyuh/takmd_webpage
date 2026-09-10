import { Component, type ReactNode } from 'react';
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

export function OfficePoster({ ready, failed, night, interactive, onProfile }: {
  readonly ready: boolean;
  readonly failed: boolean;
  readonly night: boolean;
  readonly interactive: boolean;
  readonly onProfile: () => void;
}) {
  const time = night ? 'night' : 'day';
  const fallback = OFFICE_POSTER_MANIFEST.variants.at(-1);
  if (!fallback) return null;
  return <div className="office-poster" data-ready={ready && !failed} data-failed={failed} aria-hidden={ready && !failed}>
    <picture>
      {OFFICE_POSTER_MANIFEST.variants.slice(0, -1).map(variant => variant.media
        ? <source key={variant.id} media={variant.media} srcSet={time === 'night' ? variant.nightSrc : variant.daySrc} />
        : null)}
      <img src={time === 'night' ? fallback.nightSrc : fallback.daySrc} alt="The TakMD office overlooking the Han River"
        width={fallback.width} height={fallback.height} fetchPriority="high" decoding="async" />
    </picture>
    <div className="office-poster-status" role="status">
      <span>{failed ? 'The interactive office is unavailable.' : 'Opening the office…'}</span>
      <button type="button" disabled={!interactive} onClick={onProfile}>{failed ? 'Explore the profile' : 'Read the CV while the office opens'}</button>
    </div>
  </div>;
}
