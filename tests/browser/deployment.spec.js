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
