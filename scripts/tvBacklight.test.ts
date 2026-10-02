import assert from 'node:assert/strict';
import { test } from 'node:test';
import { sampleTvEdgePixels, tvBacklightMix } from '../src/components/studio/scene/tvBacklightColor';
import { readWallTvBacklight, setWallTvContentEdges, setWallTvHovered, setWallTvInspectionEdges } from '../src/components/studio/scene/hoverReactions';

type Rgb = readonly [number, number, number];
const solid = (rgb: Rgb) => {
  const pixels = new Uint8ClampedArray(48 * 32 * 4);
  for (let index = 0; index < pixels.length; index += 4) pixels.set([...rgb, 255], index);
  return pixels;
};

test('Given black and white screens, when sampled, then black is off and white is a restrained warm wash', () => {
  const dark = sampleTvEdgePixels(solid([0, 0, 0]), 48, 32);
  const white = sampleTvEdgePixels(solid([255, 255, 255]), 48, 32);
  for (const edge of Object.values(dark)) assert.equal(edge.intensity, 0);
  for (const edge of Object.values(white)) {
    assert.equal(edge.color, '#FFF5E6');
    assert(edge.intensity > 0 && edge.intensity <= 0.2);
  }
});

test('Given differently colored edges, when sampled, then each physical strip receives its matching edge', () => {
  const pixels = solid([0, 0, 0]);
  for (let y = 0; y < 32; y += 1) for (let x = 0; x < 48; x += 1) {
    const rgb: Rgb = x < 10 ? [255, 0, 0] : x >= 38 ? [0, 0, 255]
      : y < 7 ? [0, 255, 0] : y >= 25 ? [255, 255, 0] : [0, 0, 0];
    pixels.set([...rgb, 255], (y * 48 + x) * 4);
  }
  const edges = sampleTvEdgePixels(pixels, 48, 32);
  assert.equal(edges.left.color, '#ff0000');
  assert.equal(edges.right.color, '#0000ff');
  assert.equal(edges.top.color, '#00ff00');
  assert.equal(edges.bottom.color, '#ffff00');
  assert(edges.left.intensity > 0.2 && edges.right.intensity > 0.2);
});

test('Given a focused photograph, when the underlying page changes, then its override remains until returning to the gallery', () => {
  const red = sampleTvEdgePixels(solid([255, 0, 0]), 48, 32);
  const blue = sampleTvEdgePixels(solid([0, 0, 255]), 48, 32);
  const dark = sampleTvEdgePixels(solid([0, 0, 0]), 48, 32);
  setWallTvHovered(true);
  setWallTvContentEdges(red);
  assert.deepEqual(readWallTvBacklight().edges, red);
  setWallTvInspectionEdges(blue);
  setWallTvContentEdges(dark);
  assert.deepEqual(readWallTvBacklight().edges, blue);
  setWallTvInspectionEdges(null);
  assert.deepEqual(readWallTvBacklight().edges, dark);
  assert.equal(readWallTvBacklight().hovered, true);
  setWallTvHovered(false);
});

test('Given different frame rates, when damping for 300ms, then the transition settles consistently and reduced motion is static', () => {
  const progress = (fps: number) => {
    let value = 0;
    for (let frame = 0; frame < fps * 0.3; frame += 1) value += (1 - value) * tvBacklightMix(1 / fps, false);
    return value;
  };
  assert(progress(60) > 0.94 && progress(60) < 0.97);
  assert(Math.abs(progress(30) - progress(60)) < 0.001);
  assert.equal(tvBacklightMix(1 / 60, true), 1);
});
