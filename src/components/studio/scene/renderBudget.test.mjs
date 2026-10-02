import { expect, test } from 'bun:test';
import { RenderBudget, roomPixelRatio, needsWholePixelRatio } from './renderBudget';

test('Retina and large displays cannot multiply the room pixel budget', () => {
  for (const [w,h,d] of [[1440,900,2],[390,844,3],[3840,2160,2],[768,1024,2]]) {
    const ratio=roomPixelRatio(w,h,d);
    expect(ratio).toBeLessThanOrEqual(.85);
    expect(w*h*ratio*ratio).toBeLessThanOrEqual(1_000_001);
  }
  expect(roomPixelRatio(390,844,.75)).toBe(.75);
});
test('sustained expensive frames reduce resolution, isolated uploads do not', () => {
  const budget=new RenderBudget(); let ratio=.85;
  for(let i=0;i<60;i++) ratio=budget.sample(i===0?400:8,3000+i*17,ratio,.85);
  expect(ratio).toBe(.85);
  for(let i=0;i<30;i++) ratio=budget.sample(32,6000+i*32,ratio,.85);
  expect(ratio).toBe(.75);
  for(let i=0;i<500;i++) ratio=budget.sample(32,10000+i*32,ratio,.85);
  expect(ratio).toBeCloseTo(.85*.65,8);
  for(let i=0;i<300;i++) ratio=budget.sample(3,30000+i*17,ratio,.85);
  expect(ratio).toBeCloseTo(.85*.65,8);
});

test('WebKit keeps a whole-pixel buffer, including iOS alternative browsers', () => {
  for (const agent of [
    'Mozilla/5.0 (Macintosh) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15',
    'Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 Version/18.0 Mobile Safari/604.1',
    'Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 CriOS/130.0 Mobile Safari/604.1',
    'Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 FxiOS/130.0 Mobile Safari/604.1',
  ]) {
    expect(needsWholePixelRatio(agent)).toBe(true);
    expect(roomPixelRatio(1440,900,2,needsWholePixelRatio(agent))).toBe(1);
  }
  for (const agent of [
    'Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/130.0 Safari/537.36',
    'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36',
    'Mozilla/5.0 (Macintosh) Gecko/20100101 Firefox/130.0',
  ]) expect(needsWholePixelRatio(agent)).toBe(false);
});
