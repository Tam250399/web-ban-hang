import { test, expect, Browser, BrowserContext, Page, chromium } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('https://playwright.dev/');

  await expect(page).toHaveTitle(/Playwright/);
});

test('get started link', async ({ page }) => {
  await page.goto('https://playwright.dev/');

  await page.getByRole('link', { name: 'Get started' }).click();

  await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
});

test('Test browser', async ({ }) => {
 const browser:Browser = await chromium.launch();
 const context:BrowserContext = await browser.newContext();
 const page:Page= await context.newPage();
 await page.goto('https://playwright.dev/');
  await expect(page).toHaveTitle(/Playwright/);
  await browser.close();
});