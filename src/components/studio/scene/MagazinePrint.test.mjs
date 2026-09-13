import { describe, expect, test } from 'bun:test';
import { MAGAZINE_PRINT_PATCHES } from './MagazinePrint';
import { bookUvAt } from './BookSurface';

describe('reconstructed magazine print blocks', () => {
  for (const [page, patches] of Object.entries(MAGAZINE_PRINT_PATCHES)) {
    if (!patches.length) continue;
    test(`${page} remains within the photographed source without folding`, () => {
      for (const patch of patches) {
        const [x,y,width,height] = patch.box;
        expect(x).toBeGreaterThanOrEqual(0);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(x+width).toBeLessThanOrEqual(1);
        expect(y+height).toBeLessThanOrEqual(1);
        let orientation = 0;
        for (let row=0;row<=20;row++) for (let column=0;column<=20;column++) {
          const u=column/20,v=row/20;
          const map=(a,b)=>bookUvAt(patch.quad,a,b+(patch.topCurve??0)*Math.sin(Math.PI*a)*(1-b));
          const p=map(u,v),a=map(u+.0001,v),b=map(u,v+.0001);
          for (const value of p) { expect(value).toBeGreaterThanOrEqual(-.00001); expect(value).toBeLessThanOrEqual(1.00001); }
          const cross=(a[0]-p[0])*(b[1]-p[1])-(a[1]-p[1])*(b[0]-p[0]);
          expect(Math.abs(cross)).toBeGreaterThan(1e-12);
          orientation ||= Math.sign(cross);
          expect(Math.sign(cross)).toBe(orientation);
        }
      }
    });
  }
});
