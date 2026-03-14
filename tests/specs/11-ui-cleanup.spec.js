/**
 * Tests for: UI cleanup batch — prompts #39 #11 #12 #13 #14 #16 #19
 * Functions under test: renameBook, adjustOffset, pwaPickFolder, _confirmFolder,
 *   renderLib, setBannerState
 * Added: 2026-03-14
 */

import { test, expect } from '@playwright/test';
import { clearStorage, gotoFolio, injectFixtureBook, openBook, getAppState } from '../helpers/folio.js';

// ── #39: Transcript pill removed from add-book modal ──────

test.describe('#39 — Transcript pill removed', () => {
  test.beforeEach(async ({ page }) => {
    await gotoFolio(page);
    await clearStorage(page);
    await page.reload();
    await page.waitForSelector('#library', { state: 'visible', timeout: 8000 });
  });

  test('add-book modal has no transcript pill', async ({ page }) => {
    // Open add-book modal (only visible in browser mode, not PWA)
    await page.evaluate(() => openModal());
    await page.waitForSelector('#modal', { state: 'visible', timeout: 3000 });
    // Audio, Ebook, Cover pills should exist
    await expect(page.locator('#audioPill')).toBeVisible();
    await expect(page.locator('#ebookPill')).toBeVisible();
    await expect(page.locator('#coverPill')).toBeVisible();
    // Transcript pill should NOT exist
    await expect(page.locator('#transcriptPill')).toHaveCount(0);
  });

  test('WPM slider is not in playback tab', async ({ page }) => {
    await injectFixtureBook(page);
    await openBook(page, 0);
    // Open options panel
    await page.evaluate(() => toggleOpts());
    await page.waitForSelector('#optPanel.open', { state: 'visible', timeout: 3000 });
    // Ensure we are on the playback tab
    await page.evaluate(() => switchOptTab('playback', document.querySelector('.op-tab')));
    // WPM elements should not exist
    await expect(page.locator('#defWpmSlider')).toHaveCount(0);
    await expect(page.locator('#defWpmInput')).toHaveCount(0);
    await expect(page.locator('#wpmSpeedLbl')).toHaveCount(0);
  });
});

// ── #11: Toast container safe-area ─────────────────────────

test.describe('#11 — Toast container safe-area', () => {
  test('toast container uses env safe-area-inset-bottom', async ({ page }) => {
    await gotoFolio(page);
    const bottom = await page.evaluate(() => {
      const el = document.getElementById('toastContainer');
      return getComputedStyle(el).bottom;
    });
    // In a non-notched environment env() returns 0, so bottom should be at least 24px
    expect(parseInt(bottom)).toBeGreaterThanOrEqual(24);
  });
});

// ── #13: Sync offset toast feedback ────────────────────────

test.describe('#13 — Sync offset toast', () => {
  test.beforeEach(async ({ page }) => {
    await gotoFolio(page);
    await clearStorage(page);
    await page.reload();
    await page.waitForSelector('#library', { state: 'visible', timeout: 8000 });
    await injectFixtureBook(page);
    await openBook(page, 0);
  });

  test('adjustOffset shows toast with current value', async ({ page }) => {
    // Need to have a transcript loaded to show the offset row, but
    // adjustOffset works regardless — call it directly
    await page.evaluate(() => adjustOffset(0.5));
    // Check toast appeared
    const toast = page.locator('.toast').last();
    await expect(toast).toContainText('Sync offset: +0.5s');
  });

  test('adjustOffset negative shows minus sign', async ({ page }) => {
    await page.evaluate(() => adjustOffset(-0.5));
    const toast = page.locator('.toast').last();
    await expect(toast).toContainText('Sync offset: -0.5s');
  });

  test('multiple adjustments show updated value', async ({ page }) => {
    await page.evaluate(() => { adjustOffset(0.5); adjustOffset(0.5); });
    const toast = page.locator('.toast').last();
    await expect(toast).toContainText('Sync offset: +1.0s');
  });

  test('syncOffset persists after adjustment', async ({ page }) => {
    await page.evaluate(() => adjustOffset(1.0));
    const offset = await page.evaluate(() => __testBridge('getSyncOffset'));
    expect(offset).toBe(1.0);
  });
});

// ── #14: UI element drift ──────────────────────────────────

test.describe('#14 — Icon drift fix', () => {
  test.beforeEach(async ({ page }) => {
    await gotoFolio(page);
    await clearStorage(page);
    await page.reload();
    await page.waitForSelector('#library', { state: 'visible', timeout: 8000 });
  });

  test('top bar icons have stable position across books', async ({ page }) => {
    // Inject two books with very different title lengths
    await injectFixtureBook(page, { title: 'A' });
    await injectFixtureBook(page, { title: 'A Very Long Book Title That Should Not Shift Icons At All' });

    // Open first book, record optBtn position
    await openBook(page, 0);
    const pos1 = await page.evaluate(() => {
      const btn = document.getElementById('optBtn');
      const r = btn.getBoundingClientRect();
      return { right: Math.round(r.right), width: Math.round(r.width) };
    });

    // Go back and open second book
    await page.evaluate(() => goLib());
    await page.waitForSelector('#library', { state: 'visible', timeout: 8000 });
    await openBook(page, 1);
    const pos2 = await page.evaluate(() => {
      const btn = document.getElementById('optBtn');
      const r = btn.getBoundingClientRect();
      return { right: Math.round(r.right), width: Math.round(r.width) };
    });

    // Width should be identical, right position should be the same
    expect(pos1.width).toBe(pos2.width);
    expect(pos1.right).toBe(pos2.right);
  });
});

// ── #16: Inline rename ─────────────────────────────────────

test.describe('#16 — Inline rename', () => {
  test.beforeEach(async ({ page }) => {
    await gotoFolio(page);
    await clearStorage(page);
    await page.reload();
    await page.waitForSelector('#library', { state: 'visible', timeout: 8000 });
    await injectFixtureBook(page, { title: 'Original Title' });
  });

  test('rename button creates inline input', async ({ page }) => {
    // Click the rename button on the first card
    await page.locator('.card-action-btn[title="Rename"]').first().click();
    const input = page.locator('.book-title-input');
    await expect(input).toBeVisible();
    await expect(input).toHaveValue('Original Title');
  });

  test('Enter saves the new title', async ({ page }) => {
    await page.locator('.card-action-btn[title="Rename"]').first().click();
    const input = page.locator('.book-title-input');
    await input.fill('New Title');
    await input.press('Enter');
    // After Enter, renderLib rebuilds the grid — input should be gone
    await expect(page.locator('.book-title-input')).toHaveCount(0);
    // Card should show new title
    await expect(page.locator('.book-title').first()).toContainText('New Title');
  });

  test('Escape cancels without saving', async ({ page }) => {
    await page.locator('.card-action-btn[title="Rename"]').first().click();
    const input = page.locator('.book-title-input');
    await input.fill('Should Not Save');
    await input.press('Escape');
    // Title should remain original
    await expect(page.locator('.book-title').first()).toContainText('Original Title');
  });

  test('renamed title persists after reload', async ({ page }) => {
    await page.locator('.card-action-btn[title="Rename"]').first().click();
    const input = page.locator('.book-title-input');
    await input.fill('Persisted Title');
    await input.press('Enter');
    // Reload
    await page.reload();
    await page.waitForSelector('#library', { state: 'visible', timeout: 8000 });
    await expect(page.locator('.book-title').first()).toContainText('Persisted Title');
  });

  test('no window.prompt is called', async ({ page }) => {
    let promptCalled = false;
    await page.exposeFunction('__promptSpy', () => { promptCalled = true; });
    await page.evaluate(() => {
      window.prompt = (...args) => { window.__promptSpy(); return null; };
    });
    await page.locator('.card-action-btn[title="Rename"]').first().click();
    expect(promptCalled).toBe(false);
  });
});

// ── #12: PWA body class ────────────────────────────────────

test.describe('#12 — is-pwa body class', () => {
  test('IS_PWA detection does not add is-pwa in browser mode', async ({ page }) => {
    await gotoFolio(page);
    const hasPwaClass = await page.evaluate(() => document.body.classList.contains('is-pwa'));
    // In normal browser mode (not standalone), is-pwa should NOT be present
    expect(hasPwaClass).toBe(false);
  });
});

// ── Error resilience ───────────────────────────────────────

test.describe('Error resilience', () => {
  test('no JS errors during rename flow', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await gotoFolio(page);
    await clearStorage(page);
    await page.reload();
    await page.waitForSelector('#library', { state: 'visible', timeout: 8000 });
    await injectFixtureBook(page);
    await page.locator('.card-action-btn[title="Rename"]').first().click();
    const input = page.locator('.book-title-input');
    await input.fill('Error Test');
    await input.press('Enter');
    expect(errors).toHaveLength(0);
  });

  test('no JS errors during offset adjustment', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await gotoFolio(page);
    await clearStorage(page);
    await page.reload();
    await page.waitForSelector('#library', { state: 'visible', timeout: 8000 });
    await injectFixtureBook(page);
    await openBook(page, 0);
    await page.evaluate(() => { adjustOffset(0.5); adjustOffset(-1.0); adjustOffset(0.5); });
    expect(errors).toHaveLength(0);
  });
});
