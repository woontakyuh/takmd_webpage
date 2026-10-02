import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { chromium } from 'playwright-core';
import { startPublicPreview } from './preview-public-build.mjs';
const evidence=resolve(process.env.OFFICE_TEST_EVIDENCE ?? '.omo/evidence/room-budget');
await mkdir(evidence,{recursive:true});
const preview=process.env.OFFICE_TEST_URL ? null : await startPublicPreview(resolve('dist'));
const browser=await chromium.launch({channel:'chrome',headless:true});
const results=[];
try {
for(const phone of [false,true]) {
const context=await browser.newContext({viewport:phone?{width:390,height:844}:{width:1440,height:900},deviceScaleFactor:phone?3:2,isMobile:phone,hasTouch:phone});
  await context.addInitScript(() => {
    performance.setResourceTimingBufferSize(2000);
    const roots = new Set(), renderers = new Map();
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      renderers, supportsFiber: true,
      inject(renderer) { const id = renderers.size + 1; renderers.set(id, renderer); return id; },
      onCommitFiberRoot(_id, root) { roots.add(root); }, onCommitFiberUnmount() {}, checkDCE() {},
    };
    window.officeScene = () => {
      const visited = new Set();
      const visit = fiber => {
        if (!fiber || visited.has(fiber)) return null;
        visited.add(fiber);
        const value = fiber.memoizedProps?.value;
        const state = typeof value?.getState === 'function' ? value.getState() : null;
        return state?.gl && state.scene && state.camera ? state : visit(fiber.child) ?? visit(fiber.sibling);
      };
      for (const root of roots) { const state = visit(root.current); if (state) return state; }
      return null;
    };
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.OFFICE_TEST_URL ?? preview.origin,{waitUntil:'domcontentloaded'});
  await page.locator('.studio[data-room-ready="true"]').waitFor({timeout:120000});
  await page.waitForFunction(()=>['complete','reading'].includes(document.querySelector('.studio')?.dataset.entry),null,{timeout:60000});
  await page.waitForTimeout(6000);
  const state=await page.evaluate(()=>{
    const s=window.officeScene(), textures=new Map();
    s.scene.traverse(o=>{for(const m of(Array.isArray(o.material)?o.material:[o.material])) if(m) for(const v of Object.values(m)) if(v?.isTexture&&v.image?.width) textures.set(v.uuid,{width:v.image.width,height:v.image.height});});
    return {dpr:s.gl.getPixelRatio(),width:s.gl.domElement.width,height:s.gl.domElement.height,texturePixels:[...textures.values()].reduce((n,t)=>n+t.width*t.height,0),resources:performance.getEntriesByType('resource').map(r=>({path:new URL(r.name).pathname,bytes:r.encodedBodySize}))};
  });
  results.push({phone,...state,errors});
  assert(state.dpr<=.851, `Room DPR must remain lightweight after clock updates: ${state.dpr}`);
  assert(state.width*state.height<=1_000_001,'Drawing buffer exceeds one million pixels');
  assert(state.texturePixels<100_000_000, `Room loaded excessive texture pixels: ${state.texturePixels}`);
  assert(state.resources.some(r=>r.path.endsWith('/stratocaster-lite.glb')),'Lightweight guitar was not loaded');
  assert(!state.resources.some(r=>/stratocaster-sunburst|physician-coat-2k|surfboard-packed/.test(r.path)),'Original large room models still downloaded');
  assert.deepEqual(errors,[]);
  await page.screenshot({path:join(evidence,phone?'mobile.png':'desktop.png')});
  if(!phone){
    await page.setViewportSize({width:2560,height:1440});
    await page.waitForTimeout(6500);
    await page.getByRole('button', {name:'Liquor & Music',exact:true}).click();
    await page.waitForTimeout(1500);
    const resized=await page.evaluate(()=>{const s=window.officeScene();return s.gl.domElement.width*s.gl.domElement.height});
    assert(resized<=1_000_001,`Large monitor exceeds pixel budget: ${resized}`);
  }
  await context.close();
}
} finally {
 await writeFile(join(evidence,'results.json'),JSON.stringify(results,null,2));
 await browser.close(); await preview?.close();
}
console.log('Desktop and mobile room budgets passed.');
