import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  CAPTURE_VARIANTS,
  captureVariantForViewport,
  datedVisualState,
  displayedPosterGeometry,
  projectMonitorGeometry,
} from './office-poster-pipeline';

describe('office poster projection', () => {
  test('Given the seated opening camera, the complete monitor leaves room for the desk and background TV', () => {
    const geometry = projectMonitorGeometry({
      ...CAPTURE_VARIANTS.desktopLandscape,
      width: 1440,
      height: 900,
    });

    assert.ok(geometry.x > 32 && geometry.x + geometry.across[0] < 1408);
    assert.ok(geometry.y > 180 && geometry.y + geometry.down[1] < 720);
    assert.ok(geometry.across[0] > 1440 * 0.25 && geometry.across[0] < 1440 * 0.55);
    assert.ok(CAPTURE_VARIANTS.desktopLandscape.camera.position[1] >= 1.2
      && CAPTURE_VARIANTS.desktopLandscape.camera.position[1] <= 1.4);
  });

  test('Given common responsive viewports, when each wide poster is cropped, then its monitor projection matches a direct render', () => {
    const cases = [
      [CAPTURE_VARIANTS.mobilePortrait, { width: 390, height: 844 }],
      [CAPTURE_VARIANTS.mobileLandscape, { width: 667, height: 375 }],
      [CAPTURE_VARIANTS.desktopPortrait, { width: 768, height: 1024 }],
      [CAPTURE_VARIANTS.desktopLandscape, { width: 1440, height: 900 }],
    ] as const;
    for (const [source, target] of cases) {
      const cropped = displayedPosterGeometry(projectMonitorGeometry(source), source, target);
      const direct = projectMonitorGeometry({ ...source, ...target });

      assert.ok(Math.abs(cropped.x - direct.x) < 0.00001);
      assert.ok(Math.abs(cropped.y - direct.y) < 0.00001);
      assert.ok(Math.abs(cropped.across[0] - direct.across[0]) < 0.00001);
      assert.ok(Math.abs(cropped.across[1] - direct.across[1]) < 0.00001);
      assert.ok(Math.abs(cropped.down[0] - direct.down[0]) < 0.00001);
      assert.ok(Math.abs(cropped.down[1] - direct.down[1]) < 0.00001);
    }
  });

  test('Given portrait breakpoints, when selecting capture masters, then mobile and desktop cameras stay distinct', () => {
    const mobile = projectMonitorGeometry(CAPTURE_VARIANTS.mobilePortrait);
    const desktop = projectMonitorGeometry(CAPTURE_VARIANTS.desktopPortrait);

    assert.equal(CAPTURE_VARIANTS.mobilePortrait.compact, true);
    assert.equal(CAPTURE_VARIANTS.desktopPortrait.compact, false);
    assert.ok(Math.abs(mobile.x - desktop.x) > 0.1);
  });

  test('Given square breakpoint edges, when selecting a poster, then its FOV matches the camera width-height predicate', () => {
    const cases = [
      [{ width: 759, height: 760 }, 'mobile-portrait', 60],
      [{ width: 759, height: 759 }, 'mobile-landscape', 42],
      [{ width: 760, height: 761 }, 'desktop-portrait', 60],
      [{ width: 760, height: 760 }, 'desktop-landscape', 42],
      [{ width: 1024, height: 1024 }, 'desktop-landscape', 42],
    ] as const;

    for (const [viewport, id, fov] of cases) {
      const source = captureVariantForViewport(viewport.width, viewport.height);
      const cropped = displayedPosterGeometry(projectMonitorGeometry(source), source, viewport);
      const direct = projectMonitorGeometry({ ...source, ...viewport });

      assert.equal(source.id, id);
      assert.equal(source.fov, fov);
      assert.ok(Math.abs(cropped.x - direct.x) < 0.00001);
      assert.ok(Math.abs(cropped.y - direct.y) < 0.00001);
    }
  });

  test('Given dated talks, when the visible defaults change, then the poster fingerprint input changes only at that boundary', () => {
    const september10 = datedVisualState(new Date('2026-09-10T03:00:00Z'));
    const september11 = datedVisualState(new Date('2026-09-11T03:00:00Z'));
    const october16 = datedVisualState(new Date('2026-10-16T03:00:00Z'));

    assert.equal(september10, september11);
    assert.notEqual(september11, october16);
    assert.match(september11, /22d908af25b980db8fcbfc369cfd8fdb/);
  });
});
