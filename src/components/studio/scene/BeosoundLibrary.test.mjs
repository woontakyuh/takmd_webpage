import { describe, it, expect } from 'bun:test';
import { beosoundReducer, INITIAL_BEOSOUND, nextLoadedSlot } from './Beosound9000State';

describe('physical CD library', () => {
  it('keeps the owner sequence and stays silent on entry', () => {
    expect(INITIAL_BEOSOUND.slots).toEqual([1, 2, 3, 4, 5, 6]);
    expect(INITIAL_BEOSOUND.playback).toBe('stopped');
  });
  it('pauses before opening without changing the discs until transfer completes', () => {
    const start = { ...INITIAL_BEOSOUND, playback: 'playing' };
    const next = beosoundReducer(start, { type: 'exchange', slot: 1, album: 3 });
    expect(next.slots).toEqual(start.slots);
    expect(next.playback).toBe('stopped');
    expect(next.doorOpen).toBe(true);
    expect(next.exchange).toMatchObject({ slot: 1, album: 3, outgoing: 1, source: 3 });
  });
  it('returns the replaced disc to its case and leaves the source slot empty', () => {
    const moving = beosoundReducer(INITIAL_BEOSOUND, { type: 'exchange', slot: 1, album: 3 });
    const next = beosoundReducer(moving, { type: 'exchange-complete' });
    expect(next.slots).toEqual([3, 2, null, 4, 5, 6]);
    expect(next.exchange).toBe(null);
    expect(next.playback).toBe('stopped');
  });
  it('ejects a disc and skips empty slots during continuation', () => {
    const moving = beosoundReducer(INITIAL_BEOSOUND, { type: 'exchange', slot: 2, album: null });
    const next = beosoundReducer(moving, { type: 'exchange-complete' });
    expect(nextLoadedSlot(next, 1)).toBe(3);
    expect(nextLoadedSlot({ ...next, disc: 3 }, -1)).toBe(1);
  });
  it('ignores repeated commands during a physical transfer', () => {
    const moving = beosoundReducer(INITIAL_BEOSOUND, { type: 'exchange', slot: 1, album: 3 });
    expect(beosoundReducer(moving, { type: 'play' })).toBe(moving);
    expect(beosoundReducer(moving, { type: 'exchange', slot: 4, album: 5 })).toBe(moving);
  });
  it('handles a completely empty player without starting audio', () => {
    const empty = { ...INITIAL_BEOSOUND, slots: [null, null, null, null, null, null] };
    expect(nextLoadedSlot(empty, 1)).toBe(null);
    expect(beosoundReducer(empty, { type: 'play' }).playback).toBe('stopped');
  });
});
