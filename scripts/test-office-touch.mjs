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
        if (!window.officeArrival && document.querySelector('.studio[data-room-ready="true"]')) window.officeArrival = performance.now();
      }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-room-ready'] });
    });

  const page=await context.newPage(), errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(process.env.OFFICE_TEST_URL ?? preview.origin,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.officeArrival && window.officeTestScene()?.controls,null,{timeout:120000});
  const close=page.getByRole('button',{name:'Close and return to office',exact:true});
  if(await close.isVisible()) await close.click();
  const cdp=await context.newCDPSession(page);
  await page.waitForTimeout(7000);
  await page.evaluate(()=>{
    const s=window.officeTestScene(),render=s.gl.render;
    window.idleFrames=0;
    s.gl.render=function(scene,camera){if(scene===s.scene)window.idleFrames++;return render.call(this,scene,camera);};
  });
  await page.waitForTimeout(2000);
  const idleFrames=await page.evaluate(()=>window.idleFrames);
  assert(idleFrames<=16,`An idle phone should draw about six room frames per second, got ${idleFrames/2}`);
  records.push({scenario:'idle phone',frames:idleFrames,seconds:2});
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
  assert(fps<8,`Reading should yield GPU time instead of redrawing behind the scroll, got ${fps}`);
  records.push({scenario:'reading scroll',fps,frames,result:'room yields during reading'});
  await page.getByRole('button',{name:'Expand reading view',exact:true}).click();
  await page.waitForTimeout(6000);
  await page.evaluate(()=>{window.readerFrames=0;});
  await page.waitForTimeout(1500);
  assert.equal(await page.evaluate(()=>window.readerFrames),0,'The covered room should stop rendering');
  await page.evaluate(()=>{
    document.querySelector('[data-reader-close]').addEventListener('click',()=>{
      const s=window.officeTestScene(),advance=s.advance,closedAt=performance.now();
      s.advance=(...args)=>{window.firstReturnFrame??=performance.now()-closedAt;return advance(...args);};
    },{once:true});
  });
  await page.screenshot({path:join(evidence,'phone-workshop-scrolled.png')});
  await page.getByRole('button',{name:'Close and return to office',exact:true}).click();
  await page.waitForTimeout(2200);
  const firstReturnFrame=await page.evaluate(()=>window.firstReturnFrame);
  assert(firstReturnFrame<300,`Closing the reader must immediately resume the room, got ${firstReturnFrame}ms`);
  records.push({scenario:'reader closes without a pause',firstReturnFrame});
  async function settledArrangementCamera() {
    await page.evaluate(()=>{window.arrangementCameraSample=null;window.arrangementStableFrames=0;});
    await page.waitForFunction(()=>{
      const s=window.officeTestScene(),now=[...s.camera.position.toArray(),...s.controls.target.toArray()],before=window.arrangementCameraSample;
      window.arrangementCameraSample=now;
      if(!before||Math.hypot(...now.map((value,index)=>value-before[index]))>.0001){window.arrangementStableFrames=0;return false;}
      return ++window.arrangementStableFrames>=6;
    },null,{timeout:15000});
  }
  await page.getByRole('button',{name:'Arrange furniture',exact:true}).click();
  await settledArrangementCamera();
  const clearTouch=await page.evaluate(()=>{
    const canvas=window.officeTestScene().gl.domElement;
    for(let y=280;y<500;y+=30) for(let x=70;x<220;x+=30) {
      if([[x,y],[x+60,y],[x-20,y],[x+90,y+25]].every(([px,py])=>document.elementFromPoint(px,py)===canvas)) return {x,y};
    }
    return null;
  });
  assert(clearTouch,'Arrangement must leave room space available for touch gestures');
  const cameraPose=()=>page.evaluate(()=>{
    const s=window.officeTestScene();return {position:s.camera.position.toArray(),target:s.controls.target.toArray()};
  });
  const difference=(a,b)=>Math.hypot(...a.map((value,index)=>value-b[index]));
  const beforeArrange=await cameraPose(), {x:ax,y:ay}=clearTouch;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch(ax,ay),touch(ax+60,ay,2)]});
  for(let step=1;step<=8;step++) await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[touch(ax-step*2,ay),touch(ax+60+step*2,ay,2)]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await settledArrangementCamera();const afterPinch=await cameraPose();
  assert(difference(beforeArrange.position,afterPinch.position)>.01,'Pinch zoom must remain active while arranging');
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch(ax,ay),touch(ax+60,ay,2)]});
  for(let step=1;step<=8;step++) await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[touch(ax+step*2,ay+step*2),touch(ax+60+step*2,ay+step*2,2)]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await settledArrangementCamera();const afterPan=await cameraPose();
  assert(difference(afterPinch.target,afterPan.target)>.01,'Two-finger pan must remain active while arranging');
  await page.screenshot({path:join(evidence,'phone-arrangement-gestures.png')});
  await page.getByRole('button',{name:'Done',exact:true}).click();
  records.push({scenario:'mobile arrangement gestures',beforeArrange,afterPinch,afterPan,result:'pinch and two-finger pan work'});
  const listenerResult=await cdp.send('Runtime.evaluate',{expression:'getEventListeners(window).pointermove?.length ?? 0',includeCommandLineAPI:true,returnByValue:true});
  assert(listenerResult.result.value<10);
  records.push({scenario:'idle listeners after interactions',count:listenerResult.result.value});
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify(records,null,2));
} finally {await writeFile(join(evidence,'touch-results.json'),JSON.stringify(records,null,2));await browser.close();await preview?.close();}
