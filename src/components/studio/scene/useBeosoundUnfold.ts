import { useLayoutEffect, useRef } from 'react';

type Props = {
  readonly expanded: boolean;
  readonly reducedMotion: boolean;
  readonly origin: () => { readonly x: number; readonly y: number };
  readonly onClosed: () => void;
};

export function useBeosoundUnfold({ expanded, reducedMotion, origin, onClosed }: Props) {
  const booklet = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const element = booklet.current;
    if (!element) return;
    if (reducedMotion) { if (!expanded) onClosed(); return; }
    const bounds = element.getBoundingClientRect();
    const rail = element.querySelector('.cd-case-rail');
    const anchorY = rail ? rail.getBoundingClientRect().top - bounds.top + rail.clientHeight / 2 : bounds.height / 2;
    const source = origin();
    const dx = source.x - bounds.left - bounds.width / 2;
    const dy = source.y - bounds.top - anchorY;
    element.style.transformOrigin = `50% ${anchorY}px`;
    const folded = { transform: `translate(calc(-50% + ${dx}px), ${dy}px) scale(.12) rotate(-8deg)`, opacity: 0 };
    const unfolded = { transform: 'translate(-50%, 0) scale(1) rotate(0deg)', opacity: 1 };
    const animation = element.animate(expanded ? [folded, unfolded] : [unfolded, folded], {
      duration: expanded ? 560 : 420, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both',
    });
    const covers = Array.from(element.querySelectorAll<HTMLElement>('.cd-case-rail button')).map(cover => {
      const resting = { transform: getComputedStyle(cover).transform };
      const stacked = { transform: 'translate3d(-50%, 0, 0) rotateY(82deg)' };
      return cover.animate(expanded ? [stacked, resting] : [resting, stacked], {
        duration: expanded ? 560 : 420, easing: 'cubic-bezier(.22,1,.36,1)',
      });
    });
    animation.onfinish = () => { if (expanded) animation.cancel(); else onClosed(); };
    return () => { animation.cancel(); covers.forEach(cover => cover.cancel()); };
  }, [expanded, reducedMotion, origin, onClosed]);
  return booklet;
}
