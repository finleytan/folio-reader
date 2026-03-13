import { test, expect } from '@playwright/test';
import { clearStorage, gotoFolio, injectFixtureBook, openBook } from '../helpers/folio.js';

test.beforeEach(async ({ page }) => {
  await gotoFolio(page);
  await clearStorage(page);
  await page.reload();
  await page.waitForSelector('#library', { state: 'visible' });
  await injectFixtureBook(page);
  await openBook(page, 0);
});

test('options panel opens and closes', async ({ page }) => {
  await page.locator('#optBtn').click();
  await expect(page.locator('#optPanel')).toBeVisible();
  await page.locator('#optBtn').click();
  await expect(page.locator('#optPanel')).toBeHidden();
});

test('TOC sidebar opens and closes', async ({ page }) => {
  // toggleToc() is wired via onclick on the ☰ button
  await page.evaluate(() => toggleToc());
  await expect(page.locator('#tocSidebar')).not.toHaveClass(/collapsed/);
  await page.evaluate(() => toggleToc());
  await expect(page.locator('#tocSidebar')).toHaveClass(/collapsed/);
});

test('add book modal opens and closes', async ({ page }) => {
  // Go back to library first
  await page.locator('.back-btn').click();
  await page.waitForSelector('#library', { state: 'visible' });
  // Click the "Add Book" card
  await page.locator('.add-card').click();
  await expect(page.locator('#modal')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#modal')).toBeHidden();
});

test('theme can be switched without error', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  // Open options panel and switch to Display tab where theme pills live
  await page.locator('#optBtn').click();
  await page.locator('.op-tab', { hasText: 'Display' }).click();
  await page.locator('#themePill-light').click();
  await expect(page.locator('body')).toHaveClass('theme-light');
  await page.locator('#themePill-night').click();
  await expect(page.locator('body')).toHaveClass('theme-night');
  await page.locator('#themePill-dark').click();
  // Dark theme = no class on body
  await expect(page.locator('body')).toHaveClass('');
  expect(errors).toHaveLength(0);
});

test('sleep timer cycles without error', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.evaluate(() => { cycleSleepTimer(); cycleSleepTimer(); clearSleepTimer(); });
  expect(errors).toHaveLength(0);
});
