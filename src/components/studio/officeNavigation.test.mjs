import { describe, expect, it } from 'bun:test';
import { OFFICE_HOME, officePathView, officeViewFromUrl } from './officeNavigation.ts';

const view = (search) => officeViewFromUrl(new URL(`https://takmd.com/${search}`));

describe('office addresses never resurrect the education page', () => {
  it('sends a stored education detail to the television', () => {
    expect(view('?exhibit=education&detail=%2Feducation%23overview')).toEqual({ focused: 'education', selected: 'education', details: null });
    expect(view('?detail=%2Feducation')).toEqual({ focused: null, selected: null, details: null });
    expect(view('?detail=%2Feducation%2F')).toEqual({ focused: null, selected: null, details: null });
  });
  it('keeps other stored details working', () => {
    expect(view('?detail=%2Fworkshops%2Fdummy').details).toBe('/workshops/dummy');
    expect(view('?detail=%2Fcv%23details').details).toBe('/cv#details');
  });
  it('opens the television for every education link, with or without a hash', () => {
    expect(officePathView('/education', OFFICE_HOME)).toEqual({ focused: 'education', selected: 'education', details: null });
    expect(officePathView('/education#overview', OFFICE_HOME)).toEqual({ focused: 'education', selected: 'education', details: null });
  });
  it('leaves the other office routes alone', () => {
    expect(officePathView('/research#overview', OFFICE_HOME).details).toBe('/research#overview');
    expect(officePathView('/workshops/dummy', OFFICE_HOME).details).toBe('/workshops/dummy');
    expect(officePathView('/ube', OFFICE_HOME)).toEqual({ focused: 'spine', selected: 'spine', details: '/ube' });
  });
});
