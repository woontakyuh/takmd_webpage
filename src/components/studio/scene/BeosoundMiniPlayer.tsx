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
      <button type="button" onClick={onOpen}><span>{selectedTrack(state)?.title}</span></button>
      <button type="button" aria-label={playing ? '음악 정지' : '음악 재생'}
        onClick={() => dispatch({ type: playing ? 'pause' : 'play' })}>{playing ? 'Ⅱ 정지' : '▶ 재생'}</button>
    </div>
  </Html>;
}
