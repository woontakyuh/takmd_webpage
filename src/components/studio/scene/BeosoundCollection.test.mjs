import {describe,it,expect} from 'bun:test';
import {ALBUM_IDS,BEOSOUND_ALBUMS} from './BeosoundAlbums';
import {INITIAL_BEOSOUND,beosoundReducer,nextPlayable,selectedAudio} from './Beosound9000State';
import {TRACK_AUDIO,trackAudio} from './BeosoundTracks';
import {parseCdPlacement} from './BeosoundStorage';
const mount=(state,slot,album)=>beosoundReducer(beosoundReducer(state,{type:'exchange',slot,album}),{type:'exchange-complete'});
describe('expanded album collection',()=>{
 it('has nine distinct releases with full ordered track lists and six supplied recordings',()=>{
  expect(ALBUM_IDS).toHaveLength(9);expect(Object.keys(TRACK_AUDIO)).toHaveLength(6);
  for(const id of ALBUM_IDS){const a=BEOSOUND_ALBUMS[id];expect(a.tracks.length).toBeGreaterThan(1);expect(a.tracks.map(t=>t.number)).toEqual(a.tracks.map((_,i)=>i+1));}
  expect(BEOSOUND_ALBUMS[7].album).toBe('Separation Anxiety');expect(BEOSOUND_ALBUMS[8].tracks).toHaveLength(12);expect(BEOSOUND_ALBUMS[9].tracks).toHaveLength(12);
 });
 it('can mount a seventh album without falsely enabling playback',()=>{
  const state=mount(INITIAL_BEOSOUND,1,7);expect(state.slots).toEqual([7,2,3,4,5,6]);expect(selectedAudio(state)).toBeUndefined();
  expect(beosoundReducer(state,{type:'play'}).playback).toBe('stopped');expect(nextPlayable(state).disc).toBe(2);
 });
 it('preserves music and closes the glass when placing in another slot',()=>{
  const playing={...INITIAL_BEOSOUND,playback:'playing'};
  const moving=beosoundReducer(playing,{type:'exchange',slot:4,album:7});
  expect(moving.playback).toBe('playing');expect(moving.doorOpen).toBe(false);expect(moving.exchange.keepsAudio).toBe(true);
  const settled=beosoundReducer(moving,{type:'exchange-complete'});expect(settled.disc).toBe(1);expect(settled.track).toBe(3);expect(settled.playback).toBe('playing');
 });
 it('stops audio when relocating the currently playing physical disc',()=>{
  const moving=beosoundReducer({...INITIAL_BEOSOUND,playback:'playing'},{type:'exchange',slot:4,album:1});
  expect(moving.playback).toBe('stopped');expect(mount(INITIAL_BEOSOUND,4,1).slots).toEqual([null,2,3,1,5,6]);
 });
 it('uses the exact selected track and never marks unavailable tracks playing',()=>{
  expect(beosoundReducer(INITIAL_BEOSOUND,{type:'track',disc:2,track:2})).toMatchObject({disc:2,track:2,playback:'loading'});
  expect(beosoundReducer(INITIAL_BEOSOUND,{type:'track',disc:2,track:1})).toBe(INITIAL_BEOSOUND);
 });
 it('continues within an album before moving to the next playable slot',()=>{
  TRACK_AUDIO['1:4']='/test-only.mp3';
  try {expect(nextPlayable(INITIAL_BEOSOUND)).toMatchObject({disc:1,track:4});expect(nextPlayable({...INITIAL_BEOSOUND,track:4})).toMatchObject({disc:2,track:2});}
  finally {delete TRACK_AUDIO['1:4'];}
 });
 it('skips unavailable albums and empty slots, wraps, and stops if none can play',()=>{
  const state={...INITIAL_BEOSOUND,slots:[1,7,null,9,5,8]};expect(nextPlayable(state)).toMatchObject({disc:5,track:5});
  expect(nextPlayable({...state,disc:5,track:5})).toMatchObject({disc:1,track:3});
  expect(nextPlayable({...state,slots:[null,7,8,9,null,null]})).toBeNull();
 });
 it('restores only valid unique six-slot placements and stays silent',()=>{
  const slots=[9,2,null,7,5,8];expect(parseCdPlacement(JSON.stringify({version:1,slots}))).toEqual(slots);
  expect(beosoundReducer(INITIAL_BEOSOUND,{type:'restore',slots}).playback).toBe('stopped');
  for(const raw of [null,'oops','{}','{"version":2,"slots":[1,2,3,4,5,6]}',JSON.stringify({version:1,slots:[1,1,3,4,5,6]}),JSON.stringify({version:1,slots:[1,2,3,4,5,100]})])expect(parseCdPlacement(raw)).toEqual(INITIAL_BEOSOUND.slots);
 });
});

it('standby resets the printed track number to the first playable track in slot one', () => {
  const selected = beosoundReducer(INITIAL_BEOSOUND, { type: 'track', disc: 5, track: 5 });
  const parked = beosoundReducer(selected, { type: 'standby' });
  expect(parked.disc).toBe(1);
  expect(parked.track).toBe(3);
  expect(beosoundReducer(parked, { type: 'play' }).playback).toBe('loading');
});
