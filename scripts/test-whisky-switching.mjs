import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium, webkit } from 'playwright-core';

const url = process.env.OFFICE_TEST_URL ?? 'http://127.0.0.1:58798/';
const evidence = process.env.OFFICE_TEST_EVIDENCE ?? '.omo/evidence/whisky-recovery-20261003';
await mkdir(evidence, { recursive: true });
const results = [];
const engines = process.env.WHISKY_ENGINE === 'webkit' ? ['webkit'] : ['chrome'];
const viewports = process.env.WHISKY_VIEWPORT === 'desktop' ? [{width:1440,height:900}] : process.env.WHISKY_VIEWPORT === 'mobile' ? [{width:390,height:844}] : [{ width: 390, height: 844 }, { width: 1440, height: 900 }];

async function exposedBottles(page) {
  return page.evaluate(() => {
    const s = window.officeScene(); s.scene.updateMatrixWorld(true);
    const bottles = s.scene.getObjectByName('favorite-whisky-collection').children;
    return bottles.map(bottle => {
      let point = null;
      bottle.traverse(mesh => {
        if (point || !mesh.isMesh || !mesh.geometry) return;
        mesh.geometry.computeBoundingBox(); const box = mesh.geometry.boundingBox;
        for (const fx of [.5, .25, .75]) for (const fy of [.5, .25, .75]) for (const fz of [.5, .25, .75]) {
          if (point) break;
          const p = mesh.position.clone().set(box.min.x + (box.max.x - box.min.x) * fx,
            box.min.y + (box.max.y - box.min.y) * fy, box.min.z + (box.max.z - box.min.z) * fz);
          mesh.localToWorld(p).project(s.camera);
          const x = (p.x + 1) * innerWidth / 2, y = (1 - p.y) * innerHeight / 2;
          if (x < 8 || y < 8 || x >= innerWidth - 8 || y >= innerHeight - 8 || p.z > 1 || document.elementFromPoint(x, y) !== s.gl.domElement) continue;
          s.raycaster.setFromCamera(s.pointer.clone().set(p.x, p.y), s.camera);
          const hit = s.raycaster.intersectObjects(s.internal.interaction, true)[0];
          for (let o = hit?.object; o; o = o.parent) if (o === bottle) { point = { x, y }; break; }
        }
      });
      return { name: bottle.name, id: bottle.userData.whiskyBottle, selected: bottle.userData.selected, point };
    });
  });
}
async function settle(page) {
  await page.evaluate(() => { window.lastCamera = null; window.stableCamera = 0; });
  await page.waitForFunction(() => {
    const position = window.officeScene().camera.position.toArray(), previous = window.lastCamera;
    window.lastCamera = position;
    if (!previous || Math.hypot(...position.map((v, i) => v - previous[i])) > .0005) { window.stableCamera = 0; return false; }
    return ++window.stableCamera >= 5;
  });
}

for (const engine of engines) for (const viewport of viewports) {
  const browser = await (engine === 'webkit' ? webkit : chromium).launch({ headless: true,
    ...(engine === 'webkit' ? { executablePath: process.env.WEBKIT_EXECUTABLE_PATH } : { channel: 'chrome', args: ['--use-angle=metal', '--ignore-gpu-blocklist'] }) });
  const result = { engine, viewport, errors: [] }; results.push(result);
  try {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile: viewport.width < 760, hasTouch: viewport.width < 760 });
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
    const page = await context.newPage(); page.on('pageerror', e => result.errors.push(e.message));
    page.on('console', message => {
      if (message.type() === 'error' && /WebGL|INVALID_OPERATION|Cabinet shader preparation failed/i.test(message.text())) result.errors.push(message.text());
    });
    const selectAt = point => viewport.width < 760 ? page.touchscreen.tap(point.x, point.y) : page.mouse.click(point.x, point.y);
    const start = Date.now(); await page.goto(url, { waitUntil: 'domcontentloaded' });
    if (process.env.WHISKY_DEBUG) { await page.waitForTimeout(8000); console.log(await page.locator('.studio').evaluate(e => ({data:e.dataset,buttons:[...e.querySelectorAll('button')].map(b=>b.textContent)}))); }
    await page.locator('.studio[data-room-ready=true]').waitFor({timeout:120000});
    const exploreOffice = page.getByRole('button', { name: 'Explore the office', exact: true });
    await page.locator('.studio[data-entry=complete]').or(exploreOffice).first().waitFor({timeout:120000});
    if (await exploreOffice.isVisible()) await exploreOffice.click();
    await page.locator('.studio[data-room-ready=true][data-entry=complete]').waitFor({ timeout: 120000 });
    result.roomMs = Date.now() - start;
    if (viewport.width >= 760) { await page.locator('.office-guided button').filter({ hasText: /(?:Liquor|Whisky) & Music/ }).click(); await settle(page); }
    result.approach = await page.evaluate(() => ({text:document.body.innerText, cabinet:window.officeScene().scene.getObjectByName('Poltrona Frau Isidoro drinks cabinet')?.userData}));
    await page.screenshot({path:`${evidence}/${engine}-${viewport.width}-approach.png`});
    if (viewport.width < 760) await page.getByRole('button', { name: /^(View|Open) Isidoro drinks cabinet$/ }).press('Enter');
    else {
      const point = await page.evaluate(() => { const s=window.officeScene(),g=s.scene.getObjectByName('Poltrona Frau Isidoro drinks cabinet'); const p=g.position.clone().set(-.27,.85,-.26); g.localToWorld(p).project(s.camera); return {x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2}; });
      await page.mouse.click(point.x,point.y);
    }
    await settle(page);
    await page.waitForFunction(() => window.officeScene().scene.getObjectByName('favorite-whisky-collection')?.children.length === 7);
    if (process.env.WARM_TEXTURES === '1') result.textureWarm = await page.evaluate(() => {
      const s = window.officeScene(), g = s.scene.getObjectByName('Poltrona Frau Isidoro drinks cabinet'), textures = new Set();
      g.traverse(o => { for (const m of Array.isArray(o.material) ? o.material : o.material ? [o.material] : []) for (const v of Object.values(m)) if (v?.isTexture) textures.add(v); });
      const at = performance.now(); for (const t of textures) s.gl.initTexture(t);
      return { count: textures.size, duration: performance.now() - at };
    });
    if (process.env.WHISKY_PROFILE === '1') await page.evaluate(() => {
      window.glCosts=[]; const s=window.officeScene(), g=s.gl.getContext();
      const geometries=new Set();s.scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry)});
      for(const [o,key] of [[s.gl,'render'],...[ 'getProgramInfoLog','getActiveUniform','getUniformLocation','getProgramParameter','bufferData','texImage2D','drawElements','drawArrays' ].map(key=>[g,key]),...[...geometries].flatMap(o=>[[o,'computeBoundingSphere'],[o,'computeBoundingBox']])]) {
        const fn=o[key]; o[key]=function(...args){const at=performance.now();try{return fn.apply(this,args);}finally{const ms=performance.now()-at;if(ms>.5){const program=key==='getProgramInfoLog'?s.gl.info.programs.find(p=>p.program===args[0]):null;window.glCosts.push({key,ms,...(program?{name:program.name,type:program.type,cacheKey:program.cacheKey}: {})});}}};
      }
    });
    let profiler;
    if(process.env.WHISKY_PROFILE==='1' && engine==='chrome'){profiler=await context.newCDPSession(page);await profiler.send('Profiler.enable');await profiler.send('Profiler.start');}
    await page.evaluate(() => { window.openAt = performance.now(); });
    const openButton = page.getByRole('button', { name: 'Open Isidoro drinks cabinet', exact: true });
    if (await openButton.count()) await openButton.press('Enter');
    await page.waitForFunction(() => window.officeScene().scene.getObjectByName('fold-down Canaletto walnut worktop')?.rotation.x === 0);
    result.opening = await page.evaluate(() => ({ ms: performance.now() - window.openAt, maxFrameGap: Math.max(...window.frames.filter(f => f.t >= window.openAt).map(f => f.gap)) }));
    if(process.env.WHISKY_PROFILE==='1') result.glCosts=await page.evaluate(()=>window.glCosts.sort((a,b)=>b.ms-a.ms).slice(0,18));
    if(profiler){const {profile}=await profiler.send('Profiler.stop');await writeFile(`${evidence}/opening.cpuprofile`,JSON.stringify(profile));const count=new Map();for(const id of profile.samples??[]){const name=profile.nodes.find(n=>n.id===id)?.callFrame.functionName;count.set(name,(count.get(name)??0)+1);}result.cpuSamples=[...count].sort((a,b)=>b[1]-a[1]).slice(0,15);}
    await settle(page); await page.screenshot({ path: `${evidence}/${engine}-${viewport.width}-open.png` });
    result.initialBottles = await exposedBottles(page);
    const first = result.initialBottles.find(b => b.point && b.name.startsWith('Bowmore')) ?? result.initialBottles.find(b => b.point); assert(first, 'Open cabinet has a directly clickable bottle');
    await page.evaluate(() => {
      window.bottleEvents = [];
      window.sceneBottleEvents = [];
      for (const o of window.officeScene().internal.interaction) for (const key of ['onPointerDown', 'onPointerUp']) {
        const fn = o.__r3f?.handlers?.[key];
        if (fn) o.__r3f.handlers[key] = e => { window.sceneBottleEvents.push({ key, target:o.name, hit:e.object.name, distance:e.distance, pointer:e.pointer.toArray() }); return fn(e); };
      }
      for (const type of ['pointerdown', 'pointerup', 'click', 'pointercancel']) document.querySelector('canvas').addEventListener(type,
        e => window.bottleEvents.push({type:e.type, primary:e.isPrimary, button:e.button, pointer:e.pointerType, x:e.clientX,y:e.clientY}), true);
    });
    await selectAt(first.point);
    try { await page.locator('.whisky-inspector').waitFor({timeout:10000}); }
    catch (error) {
      result.tapDiagnostic = await page.evaluate(() => ({events:window.bottleEvents, sceneEvents:window.sceneBottleEvents, rect:window.officeScene().gl.domElement.getBoundingClientRect().toJSON(), cabinet:window.officeScene().scene.getObjectByName('Poltrona Frau Isidoro drinks cabinet').userData}));
      throw error;
    }
    await page.waitForFunction(id => { const s = window.officeScene(); let g; s.scene.traverse(o => { if (o.userData.whiskyBottle === id) g = o; }); return g?.userData.presentationProgress === 1; }, first.id);
    await settle(page); await page.screenshot({ path: `${evidence}/${engine}-${viewport.width}-bottle.png` });
    result.presentation = await page.evaluate(() => {
      const s = window.officeScene(); let bottle;
      s.scene.traverse(o => { if (o.userData.whiskyBottle && o.userData.selected) bottle = o; });
      const position = bottle.getWorldPosition(s.camera.position.clone());
      const toward = s.camera.position.clone().sub(position); toward.y = 0; toward.normalize();
      const facing = bottle.getWorldDirection(position.clone());
      const upright = position.clone().set(0, 1, 0).transformDirection(bottle.matrixWorld);
      const paper = s.scene.getObjectByName('Layered lecture paper edges');
      return { frontAlignment: facing.dot(toward), upright: upright.y,
        paperInstances: paper?.count, paperInstanced: paper?.isInstancedMesh };
    });
    assert(result.presentation.frontAlignment > .995, 'Selected label faces the camera');
    assert(result.presentation.upright > .999, 'Selected bottle stays upright');
    assert(result.presentation.paperInstanced && result.presentation.paperInstances === 28, 'All 28 static paper layers share one instanced draw');
    result.inspectedBottles = await exposedBottles(page);
    const available = result.inspectedBottles.filter(b => !b.selected && b.point);
    result.remainingClickable = available.length;
    assert.equal(available.length, 6, 'Every remaining bottle stays visible and reachable while reading bottle information');
    const next = available.at(-1);
    await selectAt(next.point);
    await page.waitForFunction(id => window.officeScene().scene.getObjectByName('Poltrona Frau Isidoro drinks cabinet').userData.selectedBottle === id, next.id);
    await page.waitForFunction(id => { let g; window.officeScene().scene.traverse(o => { if (o.userData.whiskyBottle === id) g = o; }); return g?.userData.presentationProgress === 1; }, next.id);
    await settle(page); await page.screenshot({ path: `${evidence}/${engine}-${viewport.width}-switched.png` });
    await page.getByRole('button', { name: 'Return bottle to cabinet', exact: true }).click();
    await page.waitForFunction(() => window.officeScene().scene.getObjectByName('Poltrona Frau Isidoro drinks cabinet').userData.selectedBottle === null);
    assert.deepEqual(result.errors, []); result.passed = true;
  } catch (error) { result.failure = error.message; throw error; }
  finally { await browser.close(); await writeFile(`${evidence}/${engine}-results.json`, JSON.stringify(results, null, 2)); }
}
console.log(JSON.stringify(results.map(({ initialBottles, inspectedBottles, ...r }) => r), null, 2));
