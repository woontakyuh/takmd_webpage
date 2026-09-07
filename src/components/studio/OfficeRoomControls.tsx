import { OfficeIcon } from './OfficeIcon';
import type { HaloSettings } from './types';

type Props = {
  readonly blindLift: number;
  readonly lightsOn: boolean;
  readonly automaticLight: boolean;
  readonly onBlindLift: (value: number) => void;
  readonly onLights: (value: boolean) => void;
  readonly onAutomaticLight: () => void;
  readonly roomBrightness: number;
  readonly onRoomBrightness: (value: number) => void;
  readonly haloSettings: HaloSettings;
  readonly haloOn: boolean;
  readonly onHaloSettings: (value: HaloSettings) => void;
};

export function OfficeRoomControls({ blindLift, lightsOn, automaticLight, onBlindLift, onLights, onAutomaticLight,
  roomBrightness, onRoomBrightness, haloSettings, haloOn, onHaloSettings }: Props) {
  const percent = Math.round(blindLift * 100);
  return <>
    <button popoverTarget="office-room-settings" aria-label="Room settings">
      <OfficeIcon name="room" /><span>Room</span>
    </button>
    <div id="office-room-settings" className="office-room-panel" popover="auto" role="dialog" aria-label="Room settings">
      <header><strong>Make yourself at home</strong><button popoverTarget="office-room-settings" popoverTargetAction="hide" aria-label="Close room settings"><OfficeIcon name="close" /></button></header>
      <div className="office-room-light">
        <div><span>Room lights</span><small>{automaticLight ? 'Following local light' : 'Manual control'}</small></div>
        <button type="button" role="switch" aria-label="Room lights" aria-checked={lightsOn} onClick={() => onLights(!lightsOn)}>{lightsOn ? 'On' : 'Off'}</button>
      </div>
      <label className="office-room-range" htmlFor="office-room-brightness">Brightness <output>{Math.round(roomBrightness * 100)}%</output></label>
      <input id="office-room-brightness" type="range" min="0" max="100" value={Math.round(roomBrightness * 100)}
        onChange={event => onRoomBrightness(Number(event.currentTarget.value) / 100)} />
      {!automaticLight && <button className="office-room-auto" onClick={onAutomaticLight}>Use local light</button>}
      <section className="office-room-halo" aria-label="BenQ ScreenBar Halo 2 controls">
        <div className="office-room-light"><span>ScreenBar Halo 2</span><button role="switch" aria-label="Halo 2 power" aria-checked={haloOn}
          onClick={() => onHaloSettings({ ...haloSettings, enabled: !haloOn, brightness: haloSettings.brightness || 0.65 })}>{haloOn ? 'On' : 'Off'}</button></div>
        <label className="office-room-range" htmlFor="office-halo-brightness">Halo brightness <output>{Math.round(haloSettings.brightness * 100)}%</output></label>
        <input id="office-halo-brightness" type="range" min="0" max="100" value={Math.round(haloSettings.brightness * 100)}
          onChange={event => onHaloSettings({ ...haloSettings, enabled: true, brightness: Number(event.currentTarget.value) / 100 })} />
        <label className="office-room-range" htmlFor="office-halo-temperature">Color temperature <output>{haloSettings.temperature} K</output></label>
        <input id="office-halo-temperature" type="range" min="2700" max="6500" step="100" value={haloSettings.temperature}
          onChange={event => onHaloSettings({ ...haloSettings, temperature: Number(event.currentTarget.value) })} />
      </section>
      <div className="office-room-shades">
        <label htmlFor="office-shade-lift">Palladiom shades <output>{percent}% open</output></label>
        <input id="office-shade-lift" type="range" min="0" max="100" step="1" value={percent}
          aria-valuetext={`${percent}% open`} onChange={event => onBlindLift(Number(event.currentTarget.value) / 100)} />
        <div><button onClick={() => onBlindLift(1)} disabled={percent === 100}>Raise</button><button onClick={() => onBlindLift(0)} disabled={percent === 0}>Lower</button></div>
      </div>
    </div>
  </>;
}
