import {test,expect} from '@playwright/test';
for(const action of ['shoes','clothes','sit'])test(`human can ${action} through real skeletal motion`,async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('./');
 await page.waitForFunction(()=>window.showcase?.getState().person.motion?.boneCount>100);
 const before=await page.evaluate(()=>window.showcase.getState());
 await page.locator(`[data-person-action="${action}"]`).click();
 await page.waitForFunction(()=>['interacting','sitting'].includes(window.showcase.getState().person.motion.phase));
 if(action==='sit'){
  await page.waitForFunction(()=>window.showcase.getState().person.motion.phase==='seated');
  const state=await page.evaluate(()=>window.showcase.getState());expect(state.person.motion.seatVisible).toBe(true);expect(state.person.position[1]).toBeLessThan(-.3);expect(state.person.fit.heightMM).toBeLessThan(1500);
  await page.screenshot({path:'/tmp/wardrobe-human-seated.png'});
 }else{
  await page.waitForFunction(()=>window.showcase.getState().person.motion.carrying);
  const carrying=await page.evaluate(()=>window.showcase.getState().person.motion);expect(carrying.hand.length).toBe(3);expect(Math.hypot(...carrying.hand.map((v,i)=>v-carrying.assetPosition[i]))).toBeLessThan(.15);
  await page.screenshot({path:`/tmp/wardrobe-human-${action}.png`});
  await page.waitForFunction(()=>window.showcase.getState().person.motion.lastAction!==null);
  const after=await page.evaluate(()=>window.showcase.getState());expect(after.person.motion.lastAction).toBe(action);expect(after.assetPositions.some((a,i)=>a.position.some((v,j)=>Math.abs(v-before.assetPositions[i].position[j])>.02))).toBe(true);
 }
 await page.locator('[data-person-action="stand"]').click();await page.waitForFunction(()=>window.showcase.getState().person.motion.phase==='idle');expect((await page.evaluate(()=>window.showcase.getState())).person.fit.heightMM).toBe(1700);expect(errors).toEqual([]);
});
test('phone room leads with Inter, consistent icons and accessible tool sheets',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('./');await page.waitForFunction(()=>window.showcase?.getState().person.ready);
 await page.evaluate(()=>document.fonts.ready);
 expect(await page.locator('h1').evaluate(el=>getComputedStyle(el).fontFamily)).toContain('Inter');
 expect(await page.locator('#viewer').evaluate(el=>el.getBoundingClientRect().top)).toBeLessThan(100);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390);
 await page.screenshot({path:'/tmp/wardrobe-mobile-overview-inter.png'});
 await expect(page.locator('#mobile-dock button')).toHaveCount(4);await expect(page.locator('#mobile-dock button svg')).toHaveCount(4);
 await page.locator('[data-mobile-tool="human"]').click();await expect(page.locator('.inspector')).toHaveClass(/mobile-human-open/);
 await page.locator('#person-x').fill('800');await page.locator('#person-x').press('Tab');expect((await page.evaluate(()=>window.showcase.getState())).person.position[0]).toBeCloseTo(.8,3);
 await page.getByRole('button',{name:'Close human controls',exact:true}).click();
 await page.locator('[data-mobile-tool="materials"]').click();await page.getByRole('button',{name:'Natural oak',exact:true}).click();await expect(page.locator('#finish-name')).toContainText('Natural oak');
 await page.getByRole('button',{name:'Close room controls',exact:true}).click();await page.locator('#expand-view').click();
 await expect(page.locator('body')).toHaveClass(/immersive/);expect(await page.locator('#viewer').evaluate(el=>Math.round(el.getBoundingClientRect().height))).toBe(844);
 await page.keyboard.press('Escape');await page.locator('[data-mobile-tool="views"]').click();await page.locator('.view-buttons [data-view="plan"]').click();await expect(page.locator('#plan-overlay')).toBeVisible();await expect(page.locator('#mobile-scrim')).toBeHidden();
 await page.locator('[data-mobile-tool="edit"]').click();await expect(page.locator('#layout-editor')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390);
 await page.screenshot({path:'/tmp/wardrobe-mobile-inter.png',fullPage:true});
 await page.getByRole('button',{name:'Done editing',exact:true}).click();await page.setViewportSize({width:320,height:568});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(320);await expect(page.locator('#mobile-dock')).toBeVisible();
});
test('touch walking reaches the tapped floor point and cancelling a routine restores its prop',async({page,context})=>{
 await page.setViewportSize({width:390,height:844});const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true});
 async function tap(point){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
 async function tapControl(selector){const b=await page.locator(selector).boundingBox();await tap({x:b.x+b.width/2,y:b.y+b.height/2});}
 await page.goto('./');await page.waitForFunction(()=>window.showcase?.getState().person.motion?.boneCount>100);
 await tapControl('[data-person-action="walk"]');const point=await page.evaluate(()=>window.showcase.floorScreen(.45,1.40));await tap(point);
 await page.waitForFunction(()=>window.showcase.getState().person.motion.lastAction==='walk');
 let state=await page.evaluate(()=>window.showcase.getState());expect(state.person.position[0]).toBeCloseTo(.45,2);expect(state.person.position[2]).toBeCloseTo(1.4,2);
 const before=state.assetPositions;await tapControl('[data-person-action="clothes"]');await page.waitForFunction(()=>window.showcase.getState().person.motion.carrying);
 await tapControl('[data-person-action="stand"]');state=await page.evaluate(()=>window.showcase.getState());expect(state.person.motion.phase).toBe('idle');expect(state.person.motion.carrying).toBe(false);expect(state.assetPositions).toEqual(before);expect(state.person.fit.heightMM).toBe(1700);
 await cdp.detach();
});
