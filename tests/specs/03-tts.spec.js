import { test, expect } from '@playwright/test';
import { clearStorage, gotoVerte, injectFixtureBook, openBook, getAppState, nudge } from '../helpers/verte.js';

test.beforeEach(async ({ page }) => {
  await gotoVerte(page);
  await clearStorage(page);
  await page.reload();
  await page.waitForSelector('#library', { state: 'visible' });
  await injectFixtureBook(page, { sentenceCount: 15, title: 'TTS Test' });
  await openBook(page, 0);
});

test('TTS bar is visible, seek strip is hidden', async ({ page }) => {
  await expect(page.locator('#ttsBar')).toBeVisible();
  await expect(page.locator('#seekStrip')).toBeHidden();
});

test('nudge forward advances curSent', async ({ page }) => {
  const before = await getAppState(page);
  await nudge(page, 1);
  const after = await getAppState(page);
  expect(after.curSent).toBe(before.curSent + 1);
});

test('nudge backward decrements curSent', async ({ page }) => {
  await nudge(page, 3);
  const before = await getAppState(page);
  await nudge(page, -1);
  const after = await getAppState(page);
  expect(after.curSent).toBe(before.curSent - 1);
});

test('nudge does not go below 0', async ({ page }) => {
  await nudge(page, -99);
  const state = await getAppState(page);
  expect(state.curSent).toBe(0);
});

test('nudge does not exceed sentence count', async ({ page }) => {
  await nudge(page, 999);
  const state = await getAppState(page);
  expect(state.curSent).toBe(state.sentenceCount - 1);
});

test('highlight moves to new sentence after nudge', async ({ page }) => {
  await nudge(page, 5);
  const state = await getAppState(page);
  const highlighted = page.locator('#eContent .sent.sent-active');
  await expect(highlighted).toHaveCount(1);
  const si = await highlighted.getAttribute('data-si');
  expect(Number(si)).toBe(state.curSent);
});
