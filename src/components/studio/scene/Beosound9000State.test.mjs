import { describe, expect, it } from 'bun:test';
import { BEOSOUND_ALBUMS } from './BeosoundAlbums.ts';
import { Box3, Euler, Vector3 } from 'three';
import { BEOSOUND_9000, CD_SLOTS, INITIAL_BEOSOUND, beosoundReducer, cdPosition, moveClamper } from './Beosound9000State.ts';

describe('Beosound 9000 physical CD controller', () => {
  it('selects the sixth physical CD without claiming playback', () => {
    // Given the source-free initial device.
    const initial = INITIAL_BEOSOUND;
    // When its sixth CD selector is pressed.
    const next = beosoundReducer(initial, { type: 'disc', disc: 6 });
    // Then the carriage target changes without a playing state.
    expect(next.disc).toBe(6);
    expect(next.display).toBe('disc');
  });
  it('reports unavailable audio only after a play request', () => {
    // Given a selected CD with its glass raised.
    const initial = { ...INITIAL_BEOSOUND, disc: 4, doorOpen: true };
    // When play is requested before any audio source exists.
    const album = BEOSOUND_ALBUMS[4];
    let next;
    try {
      delete BEOSOUND_ALBUMS[4];
      next = beosoundReducer(initial, { type: 'play' });
    } finally { BEOSOUND_ALBUMS[4] = album; }
    // Then the glass closes and the display reports source availability.
    expect(next.display).toBe('unavailable');
    expect(next.doorOpen).toBe(false);
    expect(next.disc).toBe(4);
  });
  it('re-arms arrival when a still-loading CD is selected again', () => {
    const first = beosoundReducer(INITIAL_BEOSOUND, { type: 'disc', disc: 3 });
    const repeated = beosoundReducer(first, { type: 'disc', disc: 3 });
    expect(repeated.playback).toBe('loading');
    expect(repeated.disc).toBe(first.disc);
    expect(repeated.transportRequest).toBeGreaterThan(first.transportRequest);
    expect(beosoundReducer(repeated, { type: 'media', playback: 'playing' }).playback).toBe('playing');
  });
  it('parks the carriage at CD 1 when standby is pressed', () => {
    // Given a device left at CD 6 with its glass open.
    const initial = { ...INITIAL_BEOSOUND, disc: 6, doorOpen: true };
    // When standby is requested.
    const next = beosoundReducer(initial, { type: 'standby' });
    // Then it parks beside the first CD and closes the glass.
    expect(next).toMatchObject({ disc: 1, doorOpen: false, display: 'standby' });
  });
  for (const [disc, direction, expected] of [[1, -1, 6], [6, 1, 1], [3, 1, 4]]) {
    it(`steps from CD ${disc} in direction ${direction}`, () => {
      // Given a physical disc selection.
      const initial = { ...INITIAL_BEOSOUND, disc };
      // When the adjacent-disc control is pressed.
      const next = beosoundReducer(initial, { type: 'step', direction });
      // Then the six-disc cycle is preserved.
      expect(next.disc).toBe(expected);
    });
  }
  for (const [volume, delta, expected] of [[0, -1, 0], [90, 1, 90], [32, 1, 33]]) {
    it(`keeps volume ${volume} plus ${delta} in its physical range`, () => {
      // Given the indicated volume.
      const initial = { ...INITIAL_BEOSOUND, volume, muted: true };
      // When the volume key is pressed.
      const next = beosoundReducer(initial, { type: 'volume', delta });
      // Then volume is bounded, unmuted and shown without suggesting playback.
      expect(next).toMatchObject({ volume: expected, muted: false, display: 'volume' });
    });
  }
  it('separates the six 120 mm discs inside the measured chassis', () => {
    // Given the manufacturer envelope and standard CDs.
    const centers = CD_SLOTS.map(cdPosition);
    // When the complete disc row is laid out.
    const rowWidth = centers[5] - centers[0] + BEOSOUND_9000.discRadius * 2;
    // Then no neighboring CDs or case edges intersect.
    expect(BEOSOUND_9000.discPitch).toBeGreaterThan(.12);
    expect(rowWidth).toBeLessThan(BEOSOUND_9000.width);
  });
  it('travels from CD 1 to CD 6 in the documented typical four seconds', () => {
    // Given the first and sixth carriage centers.
    const from = cdPosition(1), target = cdPosition(6);
    // When four seconds of mechanical travel elapse.
    const end = moveClamper(from, target, 4, false);
    // Then the carriage reaches exactly the sixth CD.
    expect(end).toBe(target);
  });
  it('reverses continuously when a different disc is selected during travel', () => {
    // Given a carriage between CD 1 and 6.
    const current = .04, target = cdPosition(2);
    // When the next frame targets CD 2.
    const next = moveClamper(current, target, 1 / 60, false);
    // Then it moves from its current location without jumping or overshooting.
    expect(next).toBeLessThan(current);
    expect(next).toBeGreaterThan(target);
    expect(current - next).toBeCloseTo(BEOSOUND_9000.clamperSpeed / 60);
  });
  it('settles immediately with reduced motion', () => {
    // Given a carriage at CD 1 and reduced motion.
    const from = cdPosition(1), target = cdPosition(6);
    // When CD 6 is selected.
    const next = moveClamper(from, target, 0, true);
    // Then no intermediate motion remains.
    expect(next).toBe(target);
  });
  it('stays exactly still after arriving, including a long idle frame', () => {
    // Given a settled carriage.
    const target = cdPosition(4);
    // When the renderer produces another frame.
    const next = moveClamper(target, target, 100, false);
    // Then no drift or continued movement occurs.
    expect(next).toBe(target);
  });
  it('does not overshoot a neighboring CD after a long frame', () => {
    // Given a carriage just short of the second disc.
    const target = cdPosition(2), current = target - .001;
    // When the next frame arrives late.
    const next = moveClamper(current, target, .4, false);
    // Then the clamper stays centered over the CD.
    expect(next).toBe(target);
  });
  it('opens the loading cover without reporting audio availability', () => {
    // Given the resting device.
    const initial = INITIAL_BEOSOUND;
    // When the physical load button is pressed.
    const next = beosoundReducer(initial, { type: 'load' });
    // Then only the cover and its display change.
    expect(next).toMatchObject({ doorOpen: true, display: 'door', disc: 1 });
  });
  it('retains the chosen volume while muting', () => {
    // Given a device adjusted to volume 41.
    const initial = { ...INITIAL_BEOSOUND, volume: 41 };
    // When mute is selected.
    const next = beosoundReducer(initial, { type: 'mute' });
    // Then mute toggles without destroying the level to restore.
    expect(next).toMatchObject({ volume: 41, muted: true, display: 'volume' });
  });
  it('keeps the selected disc stopped when pause is pressed', () => {
    // Given an unavailable playback request at CD 4.
    const initial = { ...INITIAL_BEOSOUND, disc: 4, display: 'unavailable' };
    // When pause is pressed.
    const next = beosoundReducer(initial, { type: 'pause' });
    // Then the selected disc remains and its stopped state is restored.
    expect(next).toMatchObject({ disc: 4, display: 'disc' });
  });
  it('fits the near-upright chassis between the shelf, clock and television', () => {
    // Given the measured device, existing 300 mm shelf, clock edge and TV bottom.
    const device = BEOSOUND_9000, shelfTop = .82, tvBottom = 1.94 - 1.2493 / 2, clockLeft = .91 - .78 * .6 / 2;
    const points = [-1, 1].flatMap(x => [0, 1].flatMap(y => [-1, 1].map(z =>
      new Vector3(x * device.width / 2, y * device.height, z * device.depth / 2)
        .applyEuler(new Euler(device.tilt, 0, 0)).add(new Vector3(0, shelfTop + device.bracketHeight, 0)))));
    // When its actual tilt and mounting height are applied.
    const bounds = new Box3().setFromPoints(points);
    // Then no case edge crosses the shelf, clock or screen envelope.
    expect(bounds.min.y).toBeGreaterThan(shelfTop);
    expect(tvBottom - bounds.max.y).toBeGreaterThan(.17);
    expect(clockLeft - bounds.max.x).toBeGreaterThan(.24);
    expect(bounds.min.z).toBeGreaterThan(-.15);
    expect(bounds.max.z).toBeLessThan(.15);
  });
});
