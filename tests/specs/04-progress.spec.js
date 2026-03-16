import { test, expect } from '@playwright/test';
import { clearStorage, gotoVerte, injectFixtureBook, openBook, nudge, getAppState } from '../helpers/verte.js';

test.beforeEach(async ({ page }) => {
  await gotoVerte(page);
  await clearStorage(page);
  await page.reload();
  await page.waitForSelector('#library', { state: 'visible' });
});

test('progress is saved and restored after reload', async ({ page }) => {
  await injectFixtureBook(page, { sentenceCount: 20 });
  await openBook(page, 0);
  await nudge(page, 7);
  // Force save (saveBookProgress is a function declaration → on window)
  await page.evaluate(() => saveBookProgress());
  // Reload and reopen
  await page.reload();
  await page.waitForSelector('#library', { state: 'visible' });
  await openBook(page, 0);
  const state = await getAppState(page);
  expect(state.curSent).toBe(7);
});

test('display prefs persist after reload', async ({ page }) => {
  await injectFixtureBook(page);
  await openBook(page, 0);
  // Set font size to 22 (setFS and saveDisplayPrefs are function declarations → on window)
  await page.evaluate(() => { setFS(22); saveDisplayPrefs(); });
  await page.reload();
  await page.waitForSelector('#library', { state: 'visible' });
  const fontSize = await page.evaluate(() => {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--font-size');
    return v.trim();
  });
  expect(fontSize).toBe('22px');
});

test('pagehide event triggers flushPositionSync without error', async ({ page }) => {
  await injectFixtureBook(page, { sentenceCount: 10 });
  await openBook(page, 0);
  await nudge(page, 4);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  await page.waitForTimeout(200);
  expect(errors).toHaveLength(0);
});
