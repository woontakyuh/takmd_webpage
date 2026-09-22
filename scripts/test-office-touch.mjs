import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { chromium } from 'playwright-core';
import { startPublicPreview } from './preview-public-build.mjs';
const evidence = resolve(process.env.OFFICE_TEST_EVIDENCE ?? '.omo/evidence/office-touch');
await mkdir(evidence,{recursive:true});
const preview = process.env.OFFICE_TEST_URL ? null : await startPublicPreview(resolve('dist'));
const browser = await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=metal','--ignore-gpu-blocklist']});
const records=[];
try {
  const context=await browser.newContext({viewport:{width:375,height:812},hasTouch:true,isMobile:true});
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

  const page=await context.newPage(), errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(process.env.OFFICE_TEST_URL ?? preview.origin,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.officeArrival && window.officeTestScene()?.controls,null,{timeout:120000});
  const close=page.getByRole('button',{name:'Close and return to office',exact:true});
  if(await close.isVisible()) await close.click();
  const cdp=await context.newCDPSession(page);
  async function point(name,local=[0,0,0]) {
    return page.evaluate(({name,local})=>{
      const s=window.officeTestScene(),o=s.scene.getObjectByName(name);
      if(!o) throw new Error(`Missing object: ${name}`);
      const p=o.position.clone().set(...local);o.localToWorld(p).project(s.camera);
      const r=s.gl.domElement.getBoundingClientRect();
      return {x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2};
    },{name,local});
  }
  await page.getByRole('button',{name:'Inspect Beosound 9000 CD system',exact:true}).focus();
  await page.getByRole('button',{name:'Inspect Beosound 9000 CD system',exact:true}).press('Enter');
  await page.getByRole('group',{name:'Beosound physical buttons'}).waitFor();
  await page.waitForTimeout(3000);
  // Touch the extra region outside the old 39mm-wide plane.
  const extra=await page.evaluate(()=>{
    const s=window.officeTestScene(),o=s.scene.getObjectByName('Beosound touch Play selected CD'),old=s.scene.getObjectByName('Beosound native Play selected CD');
    const p=o.position.clone().set(o.geometry.parameters.width*.44,0,0);o.localToWorld(p);
    const oldLocal=old.worldToLocal(p.clone());p.project(s.camera);
    const r=s.gl.domElement.getBoundingClientRect();
    return {outsideOld:Math.abs(oldLocal.x)>.0195,x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2};
  });
  assert(extra.outsideOld);
  await page.screenshot({path:join(evidence,'phone-cd-before.png')});
  await page.touchscreen.tap(extra.x,extra.y);
  await page.waitForFunction(()=>{const a=document.querySelector('audio[data-active="true"]');return a&&!a.paused&&a.currentTime>.2;},null,{timeout:60000});
  records.push({scenario:'expanded native play target',...extra,result:'playing'});
  await page.screenshot({path:join(evidence,'phone-cd-playing.png')});
  const pause=await point('Beosound native Pause CD');await page.touchscreen.tap(pause.x,pause.y);
  await page.waitForFunction(()=>document.querySelector('audio[data-active="true"]')?.paused);
  await page.screenshot({path:join(evidence,'phone-cd-paused.png')});
  await page.getByRole('button',{name:'Return from Beosound 9000',exact:true}).click();
  await page.getByRole('button',{name:'UBE & Teaching',exact:true}).click();
  await page.waitForTimeout(2800);
  const instrument=await point('Workshop /ube',[0,.035,0]);
  const touch=(x,y,id=1)=>({x,y,id,radiusX:3,radiusY:3,force:1});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch(instrument.x,instrument.y)]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[touch(instrument.x+25,instrument.y)]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[touch(instrument.x,instrument.y)]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.waitForTimeout(700);
  assert.equal(new URL(page.url()).searchParams.get('detail'),null);
  records.push({scenario:'drag out and return',result:'no object opened'});
  // Reset the camera through its real guided-view control before the pinch.
  await page.getByRole('button',{name:'UBE & Teaching',exact:true}).click();await page.waitForTimeout(2000);
  const pinch=await point('Workshop /ube',[0,.035,0]);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch(pinch.x,pinch.y)]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch(pinch.x,pinch.y),touch(pinch.x+50,pinch.y,2)]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(700);
  assert.equal(new URL(page.url()).searchParams.get('detail'),null);
  records.push({scenario:'second finger',result:'no object opened'});
  await page.getByRole('button',{name:'UBE & Teaching',exact:true}).click();await page.waitForTimeout(2000);
  await page.screenshot({path:join(evidence,'phone-workshop-before.png')});
  const target=await point('Workshop /ube',[0,.035,0]);await page.touchscreen.tap(target.x,target.y);
  await page.waitForURL(url=>url.searchParams.get('detail')==='/ube');
  await page.locator('.studio-dialog[open]').waitFor();
  await page.waitForTimeout(7000);
  await page.screenshot({path:join(evidence,'phone-workshop-reader.png')});
  await page.evaluate(()=>{
    const s=window.officeTestScene(),render=s.gl.render;
    window.readerFrames=0;
    s.gl.render=function(scene,camera){if(scene===s.scene)window.readerFrames++;return render.call(this,scene,camera);};
  });
  const body=page.locator('.studio-reader-body'); const bounds=await body.boundingBox();
  await page.mouse.move(220,Math.max(500,bounds.y+80));
  const start=Date.now();
  for(let i=0;i<24;i++){await page.mouse.wheel(0,i<12?20:-20);await page.waitForTimeout(125);}
  const frames=await page.evaluate(()=>window.readerFrames),fps=frames/((Date.now()-start)/1000);
  assert(fps<38,`Reader scrolling should retain the 30fps room cadence, got ${fps}`);
  records.push({scenario:'reading scroll',fps,frames,result:'room stays at resting cadence'});
  await page.screenshot({path:join(evidence,'phone-workshop-scrolled.png')});
  await page.getByRole('button',{name:'Close and return to office',exact:true}).click();
  await page.waitForTimeout(2200);
  const listenerResult=await cdp.send('Runtime.evaluate',{expression:'getEventListeners(window).pointermove?.length ?? 0',includeCommandLineAPI:true,returnByValue:true});
  assert(listenerResult.result.value<10);
  records.push({scenario:'idle listeners after interactions',count:listenerResult.result.value});
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify(records,null,2));
} finally {await writeFile(join(evidence,'touch-results.json'),JSON.stringify(records,null,2));await browser.close();await preview?.close();}
