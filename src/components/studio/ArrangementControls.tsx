import { FURNITURE, FURNITURE_IDS, useArrangement } from './arrangement';
import { OfficeIcon } from './OfficeIcon';
export function ArrangementControls({ onStart }: { readonly onStart: () => void }) {
  const state = useArrangement();
  const pose = state.pose(state.active);
  if (!state.editing) return <><button onClick={() => { onStart(); state.start(); }} aria-label="Arrange furniture"><OfficeIcon name="arrange" /><span>Arrange</span></button><p className="office-layout-status" role="status">{state.notice}</p></>;
  return <section className="office-arrange-panel" aria-label="Arrange furniture">
    <header><strong>Arrange furniture</strong><button onClick={state.finish}>Done</button></header>
    <p>Drag a round handle. The room stays still while you move it.</p>
    <select aria-label="Furniture to move" value={state.active} onChange={event => {
      const id = FURNITURE_IDS.find(id => id === event.target.value); if (id) state.select(id);
    }}>{FURNITURE_IDS.map(id => <option value={id} key={id}>{FURNITURE[id].label}</option>)}</select>
    <div className="office-arrange-steps">
      <button aria-label="Move left" onClick={() => state.move(state.active, { ...pose, x: pose.x - 0.1 })}>←</button>
      <button aria-label="Move backward" onClick={() => state.move(state.active, { ...pose, z: pose.z + 0.1 })}>↑</button>
      <button aria-label="Move forward" onClick={() => state.move(state.active, { ...pose, z: pose.z - 0.1 })}>↓</button>
      <button aria-label="Move right" onClick={() => state.move(state.active, { ...pose, x: pose.x + 0.1 })}>→</button>
      <button aria-label="Rotate furniture" onClick={() => state.move(state.active, { ...pose, angle: pose.angle + Math.PI / 12 })}>Rotate 15°</button>
    </div>
    <footer><button onClick={state.resetActive}>Reset item</button><button onClick={state.reset}>Reset all</button><button onClick={state.cancel}>Cancel</button></footer>
    <small>10 cm steps · Esc cancels · Changes last for this visit only.</small>
    {state.notice && <p role="status">{state.notice}</p>}
  </section>;
}
