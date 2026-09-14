import { Html } from '@react-three/drei';
import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties, Dispatch } from 'react';
import { PlaybackGlyph } from './PlaybackGlyph';
import { albumAtSlot, selectedTrack } from './Beosound9000State';
import type { BeosoundState, BeosoundAction } from './Beosound9000State';
import { screenOrigin } from './BeosoundRack';

export function BeosoundMiniPlayer({ state, dispatch }: {
  readonly state: BeosoundState; readonly dispatch: Dispatch<BeosoundAction>;
}) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => { setHost(document.getElementById('office-music-control')); }, []);
  const portal = useMemo(() => ({ current: host! }), [host]);
  const playing = state.playback === 'playing';
  const canPause = playing || state.playback === 'loading';
  const track = selectedTrack(state);
  const album = albumAtSlot(state, state.disc);
  const title = [track?.title, album?.artist].filter(Boolean).join(' · ');
  if (!host) return null;
  return <Html portal={portal} wrapperClass="office-music-portal" calculatePosition={screenOrigin} onOcclude={() => undefined} zIndexRange={[2, 1]}>
    <div className="office-music" onPointerDown={event => event.stopPropagation()} onClick={event => event.stopPropagation()}>
      <button className="office-music-toggle" type="button" title={canPause ? '음악 일시정지' : '음악 재생'} aria-label={canPause ? '음악 일시정지' : '음악 재생'}
        onClick={() => dispatch({ type: canPause ? 'pause' : 'play' })}><PlaybackGlyph playing={canPause} /></button>
      {playing && title && <div className="office-music-title" role="status" aria-label={`재생 중: ${title}`}>
        <div className="office-music-marquee" key={title} style={{ '--track-duration': `${Math.max(12, title.length * .28)}s` } as CSSProperties} aria-hidden="true">
          <span>{title}</span><span>{title}</span>
        </div>
      </div>}
    </div>
  </Html>;
}
