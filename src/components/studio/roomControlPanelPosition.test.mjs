import { describe, expect, it } from 'bun:test';
import { getRoomControlPanelPosition } from './roomControlPanelPosition.ts';

describe('physical control panel placement', () => {
  it('places a panel beside the clicked left wall dimmer', () => {
    // Given the dimmer location from the desktop overview.
    const anchor = { x: 360, y: 454 };
    // When its measured control panel opens.
    const panel = getRoomControlPanelPosition(anchor, { width: 280, height: 420 }, { width: 1920, height: 966 });
    // Then it occupies the adjacent free left side and leaves the dimmer exposed.
    expect(panel.left + 280).toBe(anchor.x - 24);
    expect(panel.top).toBeLessThan(anchor.y);
    expect(panel.top + 420).toBeGreaterThan(anchor.y);
  });

  it('keeps the shade panel left of the window switch', () => {
    // Given a switch just outside the window opening.
    const anchor = { x: 998, y: 390 };
    // When the shade plate opens.
    const panel = getRoomControlPanelPosition(anchor, { width: 280, height: 412 }, { width: 1920, height: 966 });
    // Then the panel stays clear of the glass to the right.
    expect(panel.left + 280).toBe(anchor.x - 24);
  });

  it('uses the adjacent right side when the left side cannot fit', () => {
    // Given a wall dimmer near the left edge after orbiting.
    const anchor = { x: 80, y: 400 };
    // When the panel needs a full readable width.
    const panel = getRoomControlPanelPosition(anchor, { width: 280, height: 420 }, { width: 1280, height: 720 });
    // Then it remains next to the switch without clipping or covering the switch.
    expect(panel.left).toBe(anchor.x + 24);
  });

  it('places Halo on the free side of its dial without covering the Mac mini top', () => {
    // Given the projected desk dial and the nearby Mac mini surface to its left.
    const anchor = { x: 900, y: 520 };
    const mini = { left: 750, top: 460, right: 865, bottom: 540 };
    // When the Halo control opens next to the physical dial.
    const panel = getRoomControlPanelPosition(anchor, { width: 280, height: 350 }, { width: 1920, height: 966 }, mini);
    // Then the panel uses the dial's free right side and leaves the computer exposed.
    expect(panel.left).toBe(anchor.x + 24);
    expect(panel.left).toBeGreaterThan(mini.right);
  });

  it('finds another visible side when Halo and the Mac mini are close to the right edge', () => {
    // Given a dial whose preferred right-hand panel would overflow.
    const anchor = { x: 1220, y: 400 };
    const mini = { left: 1080, top: 350, right: 1180, bottom: 440 };
    // When the panel is composed in the current viewport.
    const panel = getRoomControlPanelPosition(anchor, { width: 280, height: 350 }, { width: 1280, height: 720 }, mini);
    // Then the fallback remains entirely visible and does not cover the computer.
    expect(panel.left).toBeGreaterThanOrEqual(16);
    expect(panel.left + 280).toBeLessThanOrEqual(1264);
    expect(panel.left + 280 <= mini.left || panel.left >= mini.right || panel.top + 350 <= mini.top || panel.top >= mini.bottom).toBe(true);
  });

  for (const anchor of [{ x: 30, y: 20 }, { x: 1270, y: 710 }, { x: -100, y: 300 }, { x: 1500, y: 1200 }]) {
    it(`keeps the entire panel visible for an anchor at ${anchor.x}, ${anchor.y}`, () => {
      // Given an edge or offscreen switch after camera movement.
      const viewport = { width: 1280, height: 720 };
      // When its measured panel is placed.
      const panel = getRoomControlPanelPosition(anchor, { width: 280, height: 420 }, viewport);
      // Then all panel edges remain inside the viewport gutter.
      expect(panel.left).toBeGreaterThanOrEqual(16);
      expect(panel.top).toBeGreaterThanOrEqual(16);
      expect(panel.left + 280).toBeLessThanOrEqual(viewport.width - 16);
      expect(panel.top + 420).toBeLessThanOrEqual(viewport.height - 16);
    });
  }
});
