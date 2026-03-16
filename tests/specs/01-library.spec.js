import { test, expect } from '@playwright/test';
import { clearStorage, gotoVerte, injectFixtureBook } from '../helpers/verte.js';

test.beforeEach(async ({ page }) => {
  await gotoVerte(page);
  await clearStorage(page);
  await page.reload();
  await page.waitForSelector('#library', { state: 'visible' });
});

test('library screen is shown on load with empty state', async ({ page }) => {
  // The library div should be visible and the player hidden
  await expect(page.locator('#library')).toBeVisible();
  await expect(page.locator('#player')).toBeHidden();
});

test('injected fixture book appears as a library card', async ({ page }) => {
  await injectFixtureBook(page, { title: 'My Test Book' });
  await expect(page.locator('#library')).toContainText('My Test Book');
});

test('injected book count is correct', async ({ page }) => {
  // injectFixtureBook reloads the page each time, so inject both via localStorage at once
  await page.evaluate(() => {
    const books = [
      { id: 'a1', title: 'Book A', audioUrl: null, audioName: null, ebookName: 'a.txt', ebookData: 'Hello.', ebookType: 'txt', transcriptName: null, transcriptType: null, transcriptData: null, coverUrl: null, coverName: null, curSent: 0, curWord: 0, audioTime: 0, wpm: 150, sentPauseMs: 300, playbackRate: 1, totalSents: 1 },
      { id: 'b2', title: 'Book B', audioUrl: null, audioName: null, ebookName: 'b.txt', ebookData: 'World.', ebookType: 'txt', transcriptName: null, transcriptType: null, transcriptData: null, coverUrl: null, coverName: null, curSent: 0, curWord: 0, audioTime: 0, wpm: 150, sentPauseMs: 300, playbackRate: 1, totalSents: 1 },
    ];
    localStorage.setItem('verte_library_v2', JSON.stringify(books));
  });
  await page.reload();
  await page.waitForSelector('#library', { state: 'visible' });
  // Verify both cards are rendered
  const cards = page.locator('#libGrid .book-card');
  await expect(cards).toHaveCount(2);
});

test('library state persists after reload', async ({ page }) => {
  await injectFixtureBook(page, { title: 'Persist Me' });
  await page.reload();
  await page.waitForSelector('#library', { state: 'visible' });
  await expect(page.locator('#library')).toContainText('Persist Me');
});
