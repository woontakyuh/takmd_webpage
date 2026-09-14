import { PlaybackGlyph } from './PlaybackGlyph';
import { Html } from '@react-three/drei';
import type { Dispatch } from 'react';
import { selectedTrack } from './Beosound9000State';
import type { BeosoundState, BeosoundAction } from './Beosound9000State';
import { screenOrigin } from './BeosoundRack';
export function BeosoundMiniPlayer({ state, dispatch, onOpen }: {
  readonly state: BeosoundState; readonly dispatch: Dispatch<BeosoundAction>; readonly onOpen: () => void;
}) {
  const playing = state.playback === 'playing' || state.playback === 'loading';
  return <Html wrapperClass="cd-screen-ui" onOcclude={() => undefined} calculatePosition={screenOrigin} zIndexRange={[42, 40]}>
    <div className="cd-mini-player" onPointerDown={event => event.stopPropagation()} onClick={event => event.stopPropagation()}>
      <button className="cd-mini-toggle" type="button" title={playing ? '음악 정지' : '음악 재생'} aria-label={playing ? '음악 정지' : '음악 재생'}
        onClick={() => dispatch({ type: playing ? 'pause' : 'play' })}><PlaybackGlyph playing={playing} /></button>
      <button className="cd-mini-track" type="button" onClick={onOpen} aria-label={`${selectedTrack(state)?.title ?? 'Music'} · CD 컬렉션 열기`}><span>{selectedTrack(state)?.title}</span></button>
    </div>
  </Html>;
}
