import { Component, type ReactNode } from 'react';
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
  return <div className="office-poster" data-ready={ready && !failed} data-failed={failed} aria-hidden={ready && !failed}>
    <picture>
      <source media="(max-width: 759px)" srcSet={`/studio/office-preview-${time}-mobile.webp`} />
      <img src={`/studio/office-preview-${time}.webp`} alt="The TakMD office overlooking the Han River"
        width="1440" height="900" fetchPriority="high" decoding="async" />
    </picture>
    <div className="office-poster-status" role="status">
      <span>{failed ? 'The interactive office is unavailable.' : 'Opening the office…'}</span>
      <button type="button" disabled={!interactive} onClick={onProfile}>{failed ? 'Explore the profile' : 'Read the CV while the office opens'}</button>
    </div>
  </div>;
}
