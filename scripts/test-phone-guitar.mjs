import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { chromium } from 'playwright-core';
import sharp from 'sharp';
import { startPublicPreview } from './preview-public-build.mjs';
const evidence=resolve(process.env.OFFICE_TEST_EVIDENCE??'.omo/evidence/phone-guitar');await mkdir(evidence,{recursive:true});
const preview=await startPublicPreview(resolve('dist'));
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=metal','--ignore-gpu-blocklist']});
const frames=[];
try {
  for(const variant of ['original-upload','phone-delivery']) {
    const context=await browser.newContext({viewport:{width:375,height:812},hasTouch:true,isMobile:true,reducedMotion:'reduce',timezoneId:'Asia/Seoul'});
    await context.addInitScript(()=>{
      const NativeDate=Date; const stamp=NativeDate.parse('2026-09-22T05:00:00Z');
      window.Date=class extends NativeDate { constructor(...args){super(...(args.length?args:[stamp]));} static now(){return stamp;} };
    });
    await context.addInitScript(() => {
      const roots = new Set(); let renderer = 0;
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { supportsFiber: true, inject: () => ++renderer, onCommitFiberRoot: (_id, root) => roots.add(root), onCommitFiberUnmount() {}, checkDCE() {} };
      window.officeTestScene = () => {
        let result; const seen = new Set();
        const visit = fiber => {
          if (!fiber || seen.has(fiber) || result) return;
          seen.add(fiber);
          const value = fiber.memoizedProps?.value, state = typeof value?.getState === 'function' ? value.getState() : null;
          if (state?.gl && state.scene && state.camera) { result = state; return; }
          visit(fiber.child); visit(fiber.sibling);
        };
        for (const root of roots) visit(root.current);
        return result;
      };
      window.officeArrival = null;
      new MutationObserver(() => {
        if (!window.officeArrival && document.querySelector('.office-poster[data-ready="true"]')) window.officeArrival = performance.now();
      }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-ready'] });
    });

    const page=await context.newPage();
    if(variant==='original-upload') await page.route('**/stratocaster-phone.glb*',async route=>route.fulfill({contentType:'model/gltf-binary',body:await readFile('public/models/fender/stratocaster-sunburst.glb')}));
    await page.goto(preview.origin,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.officeArrival && window.officeTestScene()?.controls,null,{timeout:120000});
    const close=page.getByRole('button',{name:'Close and return to office',exact:true});if(await close.isVisible())await close.click();
    const approach=page.getByRole('button',{name:'Approach Fender Stratocaster',exact:true});await approach.focus();await approach.press('Enter');
    await page.getByRole('button',{name:'Close music corner',exact:true}).waitFor();await page.waitForTimeout(4000);
    // Same camera, date and reduced-motion setting for an exact asset A/B.
    await page.evaluate(()=>{
      const s=window.officeTestScene(),guitar=s.scene.getObjectByName('Fender music corner');
      s.controls.enableDamping=false;
      s.camera.position.copy(guitar.localToWorld(s.camera.position.clone().set(.7,.76,1.6)));
      s.controls.target.copy(guitar.localToWorld(s.camera.position.clone().set(0,.56,0)));s.controls.update();
    });
    await page.waitForTimeout(1600);await page.locator('canvas').first().focus();
    const file=join(evidence,`${variant}.png`);await page.screenshot({path:file});frames.push(file);
    await context.close();
  }
  const [a,b]=await Promise.all(frames.map(file=>sharp(file).ensureAlpha().raw().toBuffer()));assert.equal(a.length,b.length);
  let max=0,sum=0,changed=0;for(let i=0;i<a.length;i++){const delta=Math.abs(a[i]-b[i]);max=Math.max(max,delta);sum+=delta;if(delta>2)changed++;}
  const result={maxChannelDelta:max,meanChannelDelta:sum/a.length,channelsOverTwo:changed,channelCount:a.length};
  await writeFile(join(evidence,'comparison.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
  assert(result.meanChannelDelta<.5,'The phone asset must preserve the current rendered appearance');
} finally {await browser.close();await preview.close();}
