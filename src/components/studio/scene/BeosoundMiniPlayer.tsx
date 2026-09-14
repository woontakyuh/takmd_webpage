import { Html } from '@react-three/drei';
import type { Dispatch } from 'react';
import { albumAtSlot, selectedTrack } from './Beosound9000State';
import type { BeosoundState, BeosoundAction } from './Beosound9000State';
import { screenOrigin } from './BeosoundRack';
export function BeosoundMiniPlayer({ state, dispatch, onOpen }: {
  readonly state: BeosoundState; readonly dispatch: Dispatch<BeosoundAction>; readonly onOpen: () => void;
}) {
  if (!['playing', 'paused', 'error'].includes(state.playback)) return null;
  return <Html wrapperClass="cd-screen-ui" onOcclude={() => undefined} calculatePosition={screenOrigin} zIndexRange={[42, 40]}>
    <div className="cd-mini-player" onPointerDown={event => event.stopPropagation()} onClick={event => event.stopPropagation()}>
      <button type="button" onClick={onOpen}><span>{selectedTrack(state)?.title}</span><small>{albumAtSlot(state, state.disc)?.artist} · CD {state.disc}</small></button>
      <button type="button" aria-label={state.playback === 'playing' ? 'Pause music' : state.playback === 'error' ? 'Retry music' : 'Resume music'}
        onClick={() => dispatch({ type: state.playback === 'playing' ? 'pause' : 'play' })}>{state.playback === 'playing' ? 'Ⅱ' : '▷'}</button>
    </div>
  </Html>;
}
