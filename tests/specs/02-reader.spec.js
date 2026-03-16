import { test, expect } from '@playwright/test';
import { clearStorage, gotoVerte, injectFixtureBook, openBook, getAppState } from '../helpers/verte.js';

test.beforeEach(async ({ page }) => {
  await gotoVerte(page);
  await clearStorage(page);
  await page.reload();
  await page.waitForSelector('#library', { state: 'visible' });
  await injectFixtureBook(page, { sentenceCount: 20 });
  await openBook(page, 0);
});

test('player screen is visible after opening a book', async ({ page }) => {
  await expect(page.locator('#player')).toBeVisible();
  await expect(page.locator('#library')).toBeHidden();
});

test('sentence count matches fixture', async ({ page }) => {
  const state = await getAppState(page);
  expect(state.sentenceCount).toBe(20);
});

test('TTS mode is active when no audio is provided', async ({ page }) => {
  const state = await getAppState(page);
  expect(state.ttsMode).toBe(true);
});

test('ebook content is rendered in the DOM', async ({ page }) => {
  const sentSpans = page.locator('#eContent .sent');
  await expect(sentSpans).toHaveCount(20);
});

test('first sentence span is highlighted after open', async ({ page }) => {
  // The active sentence should have the sent-active class
  const highlighted = page.locator('#eContent .sent.sent-active');
  await expect(highlighted).toHaveCount(1);
});

test('book title appears in player header', async ({ page }) => {
  await expect(page.locator('#pTitle')).toContainText('Fixture Book');
});

test('back to library button works', async ({ page }) => {
  await page.locator('.back-btn').click();
  await expect(page.locator('#library')).toBeVisible();
  await expect(page.locator('#player')).toBeHidden();
});
