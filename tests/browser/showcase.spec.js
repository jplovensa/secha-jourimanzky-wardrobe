import {test,expect} from '@playwright/test';
test('realistic scene retains material, lighting, props and image export controls',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await page.waitForFunction(()=>window.showcase?.getState().frames>0);
 await page.getByRole('button',{name:'Natural oak',exact:true}).click();await expect(page.locator('#finish-name')).toContainText('Natural oak');
 const drawer=await page.evaluate(()=>window.showcase.drawerScreen());await page.mouse.click(drawer.x,drawer.y);await expect(page.locator('#selection-name')).toContainText('Drawer');
 expect((await page.evaluate(()=>window.showcase.getState())).openDrawers).toBe(1);
 await page.getByRole('button',{name:'Close drawer',exact:true}).click();
 await page.evaluate(()=>window.showcase.selectAsset());await page.getByRole('button',{name:'Move right',exact:true}).click();
 await page.getByRole('button',{name:'Evening',exact:true}).click();await page.locator('#led').uncheck();
 await page.getByRole('button',{name:'Show dimensions',exact:false}).click();await expect(page.locator('#dimensions-label')).toBeVisible();
 await page.getByRole('button',{name:'Reset space',exact:false}).click();
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Save view',exact:false}).click();expect((await download).suggestedFilename()).toBe('jourimanzky-design.png');expect(errors).toEqual([]);
});
test('mobile floorplan and furniture editor fit the viewport',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');await page.waitForFunction(()=>window.showcase?.getState().frames>0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390);
 await page.locator('[data-mobile-tool="views"]').click();await page.getByRole('button',{name:'Floor plan',exact:false}).click();await expect(page.locator('#view-label')).toHaveText('FLOOR PLAN');
 await page.locator('[data-mobile-tool="edit"]').click();await expect(page.locator('#layout-editor')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390);await page.screenshot({path:'/tmp/wardrobe-mobile.png',fullPage:true});
});
