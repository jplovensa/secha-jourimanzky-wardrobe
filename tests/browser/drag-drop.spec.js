import {test,expect} from '@playwright/test';
async function openEditor(page){
 await page.goto('./');await page.waitForFunction(()=>window.showcase?.getState().frames>0);
 await page.getByRole('button',{name:'Edit furniture layout',exact:false}).click();
 await page.locator('#furniture-select').selectOption('shoe-rack');
 await page.getByRole('button',{name:'Minimise panel',exact:true}).click();
 await page.waitForTimeout(250);
}
const state=page=>page.evaluate(()=>window.showcase.getState());
const chest=s=>s.editor.furniture.find(f=>f.id==='chest');
test('dragging an unselected cabinet moves furniture, keeps the camera still, and supports undo',async({page})=>{
 await openEditor(page);
 const before=await state(page),point=await page.evaluate(()=>window.showcase.furnitureScreen('chest'));
 await page.mouse.move(point.x,point.y);await page.mouse.down();await page.mouse.move(point.x-70,point.y+20,{steps:12});await page.mouse.up();
 const after=await state(page);
 expect(Math.hypot(chest(after).position[0]-chest(before).position[0],chest(after).position[2]-chest(before).position[2])).toBeGreaterThan(25);
 expect(chest(after).position[1]).toBeCloseTo(chest(before).position[1],3);
 after.camera.forEach((v,i)=>expect(v).toBeCloseTo(before.camera[i],7));expect(after.editor.selected).toBe('chest');
 await page.getByRole('button',{name:'Show position fields',exact:true}).click();await page.getByRole('button',{name:'Undo',exact:true}).click();
 expect(chest(await state(page)).position).toEqual(chest(before).position);
 await page.getByRole('button',{name:'Redo',exact:true}).click();expect(chest(await state(page)).position).toEqual(chest(after).position);
});

test('Escape cancels a body drag and a later drop still works',async({page})=>{
 await openEditor(page);const before=await state(page);let point=await page.evaluate(()=>window.showcase.furnitureScreen('chest'));
 await page.mouse.move(point.x,point.y);await page.mouse.down();await page.mouse.move(point.x+65,point.y-10,{steps:8});
 expect(chest(await state(page)).position).not.toEqual(chest(before).position);
 await page.keyboard.press('Escape');await page.mouse.up();expect(chest(await state(page)).position).toEqual(chest(before).position);
 point=await page.evaluate(()=>window.showcase.furnitureScreen('chest'));await page.mouse.move(point.x,point.y);await page.mouse.down();await page.mouse.move(point.x-45,point.y,{steps:8});await page.mouse.up();
 expect(chest(await state(page)).position).not.toEqual(chest(before).position);
});

test('dropping outside the canvas completes one undoable drag and restores camera controls',async({page})=>{
 await openEditor(page);const before=await state(page),point=await page.evaluate(()=>window.showcase.furnitureScreen('chest'));
 const r=await page.locator('canvas').boundingBox();
 await page.mouse.move(point.x,point.y);await page.mouse.down();await page.mouse.move(r.x-35,Math.max(r.y+25,point.y-30),{steps:16});await page.mouse.up();
 const after=await state(page);expect(chest(after).position).not.toEqual(chest(before).position);after.camera.forEach((v,i)=>expect(v).toBeCloseTo(before.camera[i],7));
 // Right-button orbit pan should work after releasing an out-of-canvas drag.
 await page.mouse.move(r.x+r.width*.60,r.y+80);await page.mouse.down({button:'right'});await page.mouse.move(r.x+r.width*.60+40,r.y+90,{steps:6});await page.mouse.up({button:'right'});
 expect((await state(page)).camera).not.toEqual(after.camera);
 await page.getByRole('button',{name:'Show position fields',exact:true}).click();await page.getByRole('button',{name:'Undo',exact:true}).click();expect(chest(await state(page)).position).toEqual(chest(before).position);
});

test('a real touch gesture drags furniture on a mobile viewport',async({page,context})=>{
 await page.setViewportSize({width:390,height:844});const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true});
 await openEditor(page);const point=await page.evaluate(()=>window.showcase.furnitureScreen('chest')),before=await state(page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:point.x,y:point.y}]});
 for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:point.x+40*i/8,y:point.y+5*i/8}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 const after=await state(page);expect(chest(after).position).not.toEqual(chest(before).position);after.camera.forEach((v,i)=>expect(v).toBeCloseTo(before.camera[i],7));
 const cancelled=await page.evaluate(()=>window.showcase.furnitureScreen('chest'));
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cancelled.x,y:cancelled.y}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cancelled.x-40,y:cancelled.y+5}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});expect(chest(await state(page)).position).toEqual(chest(after).position);
 await cdp.detach();
});

test('a selection click does not move furniture or create an undo entry',async({page})=>{
 await openEditor(page);const before=await state(page),point=await page.evaluate(()=>window.showcase.furnitureScreen('chest'));
 await page.mouse.click(point.x,point.y);const after=await state(page);expect(after.editor.selected).toBe('chest');expect(chest(after).position).toEqual(chest(before).position);expect(after.editor.canUndo).toBe(false);
});

test('native height handles remain draggable without orbiting the camera',async({page})=>{
 await openEditor(page);const before=await state(page),point=await page.evaluate(()=>window.showcase.furnitureHandleScreen('Y'));expect(point).not.toBeNull();
 await page.mouse.move(point.x,point.y);await page.mouse.down();await page.mouse.move(point.x,point.y-55,{steps:10});await page.mouse.up();
 const after=await state(page),rack=s=>s.editor.furniture.find(f=>f.id==='shoe-rack');
 expect(rack(after).position[1]).toBeGreaterThan(rack(before).position[1]+25);expect(rack(after).position[0]).toBeCloseTo(rack(before).position[0],3);expect(rack(after).position[2]).toBeCloseTo(rack(before).position[2],3);
 after.camera.forEach((v,i)=>expect(v).toBeCloseTo(before.camera[i],7));
});
