import { FOCUS, MOBILE_FOCUS, focusFov } from './config';
import type { CameraPose } from './config';

export function surfboardReadingLayout(width: number, height: number) {
  const stacked = width < 760 || width < height;
  const copyWidth = Math.min(stacked ? 420 : 360, width - 32);
  const copyHeight = stacked ? Math.min(288, height * .43) : Math.min(420, height - 144);
  const gap = stacked ? 16 : 24;
  return {
    placement: stacked ? 'bottom' : 'right', copyWidth, copyHeight, gap,
    objectHeight: height - 144 - (stacked ? copyHeight + gap : 0),
    offsetX: stacked ? 0 : (copyWidth + gap) / 2,
    offsetY: stacked ? (copyHeight + gap) / 2 : 0,
  } as const;
}

export function surfboardReadingPose(width: number, height: number): CameraPose {
  const compact = width < 760;
  const source = (compact ? MOBILE_FOCUS : FOCUS).surfing;
  const layout = surfboardReadingLayout(width, height);
  const fov = focusFov('surfing', compact, width, height);
  const currentDistance = Math.hypot(...source.position.map((value, index) => value - source.target[index]));
  const boardAndCradleHeight = 3.1;
  const distance = Math.max(currentDistance, boardAndCradleHeight * height / (2 * Math.tan(fov * Math.PI / 360) * Math.max(96, layout.objectHeight)));
  const scale = distance / currentDistance;
  return {
    position: [
      source.target[0] + (source.position[0] - source.target[0]) * scale,
      source.target[1] + (source.position[1] - source.target[1]) * scale,
      source.target[2] + (source.position[2] - source.target[2]) * scale,
    ],
    target: source.target,
    zoom: source.zoom,
  };
}
