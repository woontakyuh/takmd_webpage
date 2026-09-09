import type { TalkSlide } from './types';

const HD_PRIVACY_LIMITED_SLIDES = new Set([
  '/studio/talks/full/33a908af25b980849210fec32e7391fd/1b419e9869a0/page-0012.webp',
  '/studio/talks/full/18f908af25b980fdbc6dfa5830dc13bc/c87886495e28/page-0014.webp',
  '/studio/talks/full/1ec908af25b98051904fe502642a6389/4bf88662fdae/page-0011.webp',
  '/studio/talks/full/255908af25b9803990dac9fda2be6d71/73a8e9157c27/page-0021.webp',
]);

export const publicHighResolutionSlide = (slide: TalkSlide) => HD_PRIVACY_LIMITED_SLIDES.has(slide.src)
  ? undefined : slide.src.replace(/(\.[^./]+)$/, '.hd$1');
