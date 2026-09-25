import { FOCUS } from './config';

const PAIR = { width: 0.6, height: 0.32, maxWidth: 768, captionHeight: 96, gap: 16 } as const;

export function awardPairReadingLayout(width: number, height: number) {
  const pairWidth = Math.min(PAIR.maxWidth, Math.max(32, width - 48), Math.max(32, height - 192) * PAIR.width / PAIR.height);
  const pairHeight = pairWidth * PAIR.height / PAIR.width;
  const gap = PAIR.gap + pairWidth * 0.07;
  const offsetY = (PAIR.captionHeight + gap) / 2;
  return {
    pairWidth,
    offsetY,
    captionTop: (height - pairHeight - PAIR.captionHeight - gap) / 2 + pairHeight + gap,
  };
}

export function awardPairReadingFov(width: number, height: number): number {
  const pose = FOCUS['award-photo'];
  const distance = Math.hypot(...pose.position.map((value, index) => value - pose.target[index]));
  return 2 * Math.atan(PAIR.width * height / (2 * distance * awardPairReadingLayout(width, height).pairWidth)) * 180 / Math.PI;
}
