import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';
const evidence=process.env.OFFICE_TEST_EVIDENCE ?? '.omo/evidence/arrangement-camera'; await mkdir(evidence,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=metal','--ignore-gpu-blocklist']});
const context=await browser.newContext({viewport:{width:1440,height:900}});
    await context.addInitScript(() => {
      const roots = new Set(); let renderer = 0;
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { supportsFiber: true, inject: () => ++renderer,
        onCommitFiberRoot: (_, root) => roots.add(root), onCommitFiberUnmount() {}, checkDCE() {} };
      window.officeScene = () => {
        let result; const seen = new Set();
        function visit(f) { if (!f || seen.has(f) || result) return; seen.add(f);
          const v = f.memoizedProps?.value, s = typeof v?.getState === 'function' ? v.getState() : null;
          if (s?.gl && s.scene && s.camera) { result = s; return; } visit(f.child); visit(f.sibling); }
        for (const root of roots) visit(root.current); return result;
      };
      window.frames = []; let last = performance.now();
      function frame(t) { window.frames.push({ t, gap: t - last }); last = t; requestAnimationFrame(frame); } requestAnimationFrame(frame);
    });

const page=await context.newPage(); const results={};
try {
await page.goto(process.env.OFFICE_TEST_URL ?? 'http://127.0.0.1:58798/', {waitUntil:'domcontentloaded'});
await page.locator('.studio[data-room-ready=true]').waitFor({timeout:120000});
    const exploreOffice = page.getByRole('button', { name: 'Explore the office', exact: true });
    await page.locator('.studio[data-entry=complete]').or(exploreOffice).first().waitFor({timeout:120000});
    if (await exploreOffice.isVisible()) await exploreOffice.click();
    await page.locator('.studio[data-room-ready=true][data-entry=complete]').waitFor({timeout:60000});
await page.getByRole('button',{name:'Arrange furniture',exact:true}).click();
await page.waitForTimeout(1000);
const pose=()=>page.evaluate(()=>{const s=window.officeScene();return {position:s.camera.position.toArray(),target:s.controls.target.toArray(),enabled:s.controls.enabled};});
const change=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
results.before=await pose();
await page.mouse.move(700,350);await page.mouse.wheel(0,-200);await page.waitForTimeout(400);results.zoom=await pose();
await page.mouse.move(700,350);await page.mouse.down();await page.mouse.move(760,380,{steps:8});await page.mouse.up();await page.waitForTimeout(500);results.orbit=await pose();
await page.mouse.move(700,350);await page.mouse.down({button:'right'});await page.mouse.move(740,360,{steps:8});await page.mouse.up({button:'right'});await page.waitForTimeout(500);results.pan=await pose();
results.zoomChanged=change(results.before.position,results.zoom.position)>.01;
results.orbitChanged=change(results.zoom.position,results.orbit.position)>.01;
results.panChanged=change(results.orbit.target,results.pan.target)>.01;
const handles=await page.locator('.office-move-handle').all();
for(const h of handles){const box=await h.boundingBox();if(!box||box.x<350||box.x>1300||box.y<100||box.y>730)continue;
results.handle=await h.getAttribute('aria-label');await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();results.duringDrag=await pose();await page.mouse.move(box.x+box.width/2+30,box.y+box.height/2+10,{steps:5});await page.mouse.up();results.afterDrag=await pose();break;}
await page.screenshot({path:evidence+'/arrange.png'});
await page.getByRole('button',{name:'Done',exact:true}).click();results.done=await page.locator('.studio').getAttribute('data-arranging');
if(!process.env.BASELINE){assert(results.zoomChanged,'wheel zoom must work during arrangement');assert(results.orbitChanged,'orbit must work during arrangement');assert(results.panChanged,'pan must work during arrangement');assert.equal(results.duringDrag.enabled,false);assert.equal(results.afterDrag.enabled,true);assert.equal(results.done,'false');}
}finally{await writeFile(evidence+'/arrange-results.json',JSON.stringify(results,null,2));await browser.close();}
console.log(JSON.stringify(results,null,2));
