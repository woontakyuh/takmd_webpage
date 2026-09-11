import { describe, expect, it } from 'bun:test';
import { viewAfterSceneInspection } from './officeDetailState.ts';

describe('one active office detail', () => {
  for (const selected of ['family', 'award-photo', 'books', 'research', 'education']) {
    it(`Given ${selected} is open, when another scene object is inspected, then the old reader and focus are released`, () => {
      const view = { selected, focused: selected, details: null };
      const next = viewAfterSceneInspection(view, null, 'conference-calendar');
      expect(next.selected).toBeNull();
      expect(next.focused).toBeNull();
      expect(next.details).toBeNull();
    });
  }
  it('Given a new photo has opened, when an existing inspection refits its camera, then the newer photo selection is preserved', () => {
    const photo = { selected: 'family', focused: 'family', details: null };
    const next = viewAfterSceneInspection(photo, 'credential-snu', 'credential-snu');
    expect(next).toBe(photo);
  });
  it('Given an inspection is closing, when its id clears, then no older description reopens', () => {
    const idle = { selected: null, focused: null, details: null };
    const next = viewAfterSceneInspection(idle, 'conference-calendar', null);
    expect(next).toBe(idle);
  });
});
