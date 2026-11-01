import { test, expect } from '@playwright/test';
test('production deployment loads styles, bundles and interactive 3D under a project path', async ({ page, baseURL }) => {
  const failures = [];
  page.on('pageerror', error => failures.push(error.message));
  page.on('requestfailed', request => failures.push(request.url()));
  page.on('response', response => { if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`); });
  await page.goto(baseURL);
  const html = await page.content();
  expect(html).not.toContain('/src/');
  expect(html).toContain('./site-assets/');
  await page.waitForFunction(() => window.showcase);
  await expect(page.locator('#loading')).toBeHidden();
  expect(await page.locator('main').evaluate(el => getComputedStyle(el).display)).toBe('grid');
  expect(await page.evaluate(() => window.showcase.getState().renderCalls)).toBeGreaterThan(100);
  await page.getByRole('button', { name: 'Natural oak', exact: true }).click();
  await expect(page.locator('#finish-name')).toContainText('Natural oak');
  await page.evaluate(() => window.showcase.selectDrawer());
  await page.getByRole('button', { name: 'Open drawer', exact: true }).click();
  expect(await page.evaluate(() => window.showcase.getState().openDrawers)).toBe(1);
  await page.getByRole('button', { name: 'Step inside', exact: false }).click();
  await expect(page.locator('#view-label')).toHaveText('INTERIOR');
  expect(failures).toEqual([]);
  await page.screenshot({ path: '/tmp/wardrobe-production-fixed.png' });
});

test('failed bundle loading offers retry instead of an indefinite spinner', async ({ page, baseURL }) => {
  await page.route('**/site-assets/main-*.js', route => route.abort());
  await page.goto(baseURL);
  await expect(page.locator('#loading')).toContainText('3D files could not load');
  await expect(page.getByRole('button', { name: 'Retry showcase' })).toBeVisible();
  expect(await page.locator('main').evaluate(el => getComputedStyle(el).display)).toBe('grid');
});

test('WebGL failure is visible and recoverable', async ({ page, baseURL }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      return type === 'webgl2' ? null : original.call(this, type, ...args);
    };
  });
  await page.goto(baseURL);
  await expect(page.locator('#loading')).toContainText('renderer could not start');
  await expect(page.getByRole('button', { name: 'Retry showcase' })).toBeVisible();
});

test('context loss has a recovery action and idle scenes stop redrawing', async ({ page, baseURL }) => {
  await page.goto(baseURL);
  await page.waitForFunction(() => window.showcase?.getState().frames > 0);
  await page.waitForTimeout(1200);
  const before = await page.evaluate(() => window.showcase.getState().frames);
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => window.showcase.getState().frames)).toBe(before);
  await page.getByRole('button', { name: 'Evening', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.showcase.getState().frames)).toBeGreaterThan(before);
  await page.locator('canvas').dispatchEvent('webglcontextlost');
  await expect(page.locator('#loading')).toContainText('graphics connection was lost');
  await expect(page.getByRole('button', { name: 'Retry showcase' })).toBeVisible();
});

test('floorplan places D at the entrance return and restores the right-hand L layout', async ({page,baseURL}) => {
  await page.goto(baseURL);
  await page.waitForFunction(()=>window.showcase?.getState().frames>0);
  const layout=await page.evaluate(()=>window.showcase.getState().layout);
  expect(layout.hangingX).toBeCloseTo(1.722,3);
  expect(layout.chestX).toBeCloseTo(.472,3);
  expect(layout.mirrorX).toBeCloseTo(.006,3);
  const rack=layout.shoeRackBounds;
  expect(rack.min[0]).toBeCloseTo(.806,3);expect(rack.max[0]).toBeCloseTo(2.022,3);
  expect(rack.min[2]).toBeCloseTo(1.807,3);expect(rack.max[2]).toBeCloseTo(2.157,3);
  expect(rack.min[1]).toBeCloseTo(0,3);expect(rack.max[1]).toBeCloseTo(1.5,3);
  expect(rack.levels).toBe(5);expect(rack.min[2]-1.75).toBeCloseTo(.057,3);
  await page.screenshot({path:'/tmp/wardrobe-layout-new.png'});
  await page.getByRole('button',{name:'Step inside',exact:false}).click();
  await page.waitForTimeout(2200);
  await page.screenshot({path:'/tmp/wardrobe-entrance-new.png'});
});

test('supplied film plays, seeks and pauses when closed', async ({page,baseURL}) => {
  await page.goto(baseURL);
  const video=page.locator('#closet-film');
  await video.evaluate(v=>v.muted=true);
  await page.getByRole('button',{name:'Reference film',exact:false}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect.poll(()=>video.evaluate(v=>v.currentTime)).toBeGreaterThan(.1);
  expect(await video.evaluate(v=>v.duration)).toBeGreaterThan(9);
  await video.evaluate(v=>{v.currentTime=5;});
  await expect.poll(()=>video.evaluate(v=>v.currentTime)).toBeGreaterThan(5);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect.poll(()=>video.evaluate(v=>v.paused)).toBe(true);
  await expect(page.locator('#watch-film')).toBeFocused();
});

test('measured room and click-only discovery missions',async({page,baseURL})=>{
 await page.goto(baseURL);await page.waitForFunction(()=>window.showcase?.getState().frames>0);
 const state=await page.evaluate(()=>window.showcase.getState());
 expect(state.roomSize.width).toBeCloseTo(2.022,4);expect(state.roomSize.depth).toBeCloseTo(2.157,4);expect(state.roomSize.height).toBeCloseTo(2.610,4);
 await page.getByRole('button',{name:'Start discovery',exact:false}).click();
 await expect(page.locator('#view-label')).toHaveText('CLICK TO EXPLORE');
 expect(await page.locator('#walk-play').count()).toBe(0);expect(await page.locator('#walk-progress').count()).toBe(0);
 const before=await page.evaluate(()=>window.showcase.getState().camera);await page.waitForTimeout(500);
 const after=await page.evaluate(()=>window.showcase.getState().camera);after.forEach((v,i)=>expect(v).toBeCloseTo(before[i],8));
 await page.getByRole('button',{name:'Mirror on the right',exact:true}).click();await expect(page.locator('#walk-score')).toContainText('0 XP');
 await page.getByRole('button',{name:'Mirror on the left',exact:true}).click();await expect(page.locator('#walk-score')).toContainText('20 XP');
 await page.getByRole('button',{name:'Visit A+B · Hanging',exact:true}).click();
 let point=await page.evaluate(()=>window.showcase.objectScreen('garment'));await page.mouse.click(point.x,point.y);
 await expect(page.locator('#walk-score')).toContainText('40 XP');
 await page.getByRole('button',{name:'Visit C · Drawers',exact:true}).click();
 point=await page.evaluate(()=>window.showcase.drawerScreen());await page.mouse.click(point.x,point.y);
 await expect(page.locator('#walk-score')).toContainText('60 XP');expect((await page.evaluate(()=>window.showcase.getState())).openDrawers).toBe(1);
 await page.getByRole('button',{name:'Visit M · Mirror',exact:true}).click();
 point=await page.evaluate(()=>window.showcase.objectScreen('mirror'));await page.mouse.click(point.x,point.y);
 await expect(page.locator('#walk-score')).toContainText('80 XP');
 await page.getByRole('button',{name:'Visit D · Shoes',exact:true}).click();
 point=await page.evaluate(()=>window.showcase.objectScreen('shoe'));await page.mouse.click(point.x,point.y);
 await page.getByRole('button',{name:'Move right',exact:true}).click();await expect(page.locator('#walk-score')).toContainText('100 XP');
 await expect(page.locator('#walk-reward')).toBeVisible();await expect(page.locator('#progress-count')).toHaveText('5 / 5');
 await page.screenshot({path:'/tmp/discovery-realistic.png'});
 await page.getByRole('button',{name:'Restart discovery',exact:true}).click();await expect(page.locator('#walk-score')).toContainText('0 XP');
 await page.getByRole('button',{name:'Exit discovery',exact:true}).click();expect((await page.evaluate(()=>window.showcase.getState())).walkthrough.active).toBe(false);
});

test('furniture revisions support millimetres, rotation, undo, export and import',async({page,baseURL})=>{
 await page.goto(baseURL);await page.waitForFunction(()=>window.showcase?.getState().frames>0);
 await page.getByRole('button',{name:'Edit furniture layout',exact:false}).click();
 await page.locator('#furniture-select').selectOption('shoe-rack');await expect(page.locator('#layout-x')).toHaveValue('806');
 await page.locator('#layout-x').fill('706');await page.locator('#layout-x').press('Tab');
 expect((await page.evaluate(()=>window.showcase.getState())).layout.shoeRackBounds.min[0]).toBeCloseTo(.706,3);
 await page.getByRole('button',{name:'Undo',exact:true}).click();await expect(page.locator('#layout-x')).toHaveValue('806');
 await page.getByRole('button',{name:'Redo',exact:true}).click();await expect(page.locator('#layout-x')).toHaveValue('706');
 await page.locator('#layout-rotation').fill('15');await page.locator('#layout-rotation').press('Tab');await expect(page.locator('#layout-rotation')).toHaveValue('15');
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Export revision',exact:true}).click();expect((await download).suggestedFilename()).toBe('jourimanzky-layout-revision.json');
 const furniture=(await page.evaluate(()=>window.showcase.getState())).editor.furniture.map(({id,position,rotation})=>({id,position,rotation}));
 await page.getByRole('button',{name:'Reset to floorplan',exact:true}).click();await expect(page.locator('#layout-x')).toHaveValue('806');
 await page.locator('#revision-file').setInputFiles({name:'revision.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({version:1,units:'mm',roomMM:[2022,2157,2610],furniture}))});
 await expect(page.locator('#revision-status')).toContainText('Revision imported');await expect(page.locator('#layout-rotation')).toHaveValue('15');
 await page.getByRole('button',{name:'Minimise panel',exact:true}).click();await expect(page.locator('#layout-editor')).toHaveClass(/minimized/);await page.screenshot({path:'/tmp/furniture-revision.png'});await page.getByRole('button',{name:'Show position fields',exact:true}).click();
 await page.getByRole('button',{name:'Reset to floorplan',exact:true}).click();await page.getByRole('button',{name:'Done editing',exact:true}).click();
 expect((await page.evaluate(()=>window.showcase.getState())).editor.active).toBe(false);
});
