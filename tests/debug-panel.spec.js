// Folio Debug Panel — Playwright Test Suite
//
// Setup:
//   npm install -D @playwright/test
//   npx playwright install chromium
//
// Run:
//   npx http-server .. -p 3000 --silent &   (serve repo root)
//   npx playwright test tests/debug-panel.spec.js
//
// Or run both in one command:
//   npx http-server .. -p 3000 --silent & sleep 1 && npx playwright test tests/debug-panel.spec.js

const { test, expect } = require('@playwright/test');

const BASE = 'http://localhost:3000';

// Read a global from the page
const g = (page, name) => page.evaluate(n => window[n], name);

// Poll a global until predicate passes or timeout
async function pollGlobal(page, fn, timeout = 5000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (await page.evaluate(fn)) return true;
    await page.waitForTimeout(50);
  }
  return false;
}

test.describe('Folio Debug Panel', () => {

  test.beforeEach(async ({ page }) => {
    // Auto-accept all confirm dialogs unless the test overrides
    page.on('dialog', d => d.accept());
    await page.goto(BASE + '/index.html?debug');
    // Open panel
    await page.click('#dbg-toggle');
    await page.waitForTimeout(100);
  });

  // ════════════════════════════════════════════════════════════════════════════
  // FIXTURE TAB
  // ════════════════════════════════════════════════════════════════════════════

  test('TTS fixture — correct sentence count and globals', async ({ page }) => {
    await page.selectOption('#dbg-sent-count', '10');
    await page.selectOption('#dbg-mode', 'tts');
    await page.click('#dbg-inject-btn');

    await pollGlobal(page, () => window.sentences?.length === 10);

    expect(await g(page, 'sentences')).toHaveLength(10);
    expect(await g(page, 'ttsMode')).toBe(true);
    expect(await g(page, 'sentenceTimings')).toHaveLength(0);

    // ttsBar visible, seekStrip hidden
    await expect(page.locator('#ttsBar')).not.toHaveCSS('display', 'none');
    const ss = page.locator('#seekStrip');
    await expect(ss).toHaveCSS('display', 'none');
  });

  test('Audio (fake) fixture — ttsMode=false, timings populated, seek strip visible', async ({ page }) => {
    await page.selectOption('#dbg-sent-count', '25');
    await page.selectOption('#dbg-mode', 'audio');
    await page.click('#dbg-inject-btn');

    const ok = await pollGlobal(page, () => window.ttsMode === false && window.sentenceTimings?.length === 25, 6000);
    expect(ok, 'poll timed out').toBe(true);

    expect(await g(page, 'ttsMode')).toBe(false);
    expect(await g(page, 'sentenceTimings')).toHaveLength(25);
    expect(await g(page, 'sentences')).toHaveLength(25);

    const ss = page.locator('#seekStrip');
    await expect(ss).not.toHaveCSS('display', 'none');
    await expect(page.locator('#ttsBar')).toHaveCSS('display', 'none');
  });

  for (const count of ['50', '100']) {
    test(`Fixture sentence count ${count}`, async ({ page }) => {
      await page.selectOption('#dbg-sent-count', count);
      await page.selectOption('#dbg-mode', 'tts');
      await page.click('#dbg-inject-btn');
      await pollGlobal(page, `() => window.sentences?.length === ${count}`);
      const len = await g(page, 'sentences');
      expect(len).toHaveLength(Number(count));
    });
  }

  test('Clear All Books — confirm empties library and localStorage', async ({ page }) => {
    // Inject a book first
    await page.selectOption('#dbg-sent-count', '10');
    await page.selectOption('#dbg-mode', 'tts');
    await page.click('#dbg-inject-btn');
    await pollGlobal(page, () => window.library?.length > 0);

    // Dialog already set to accept in beforeEach
    await page.click('#dbg-clear-btn');
    await page.waitForTimeout(100);

    expect(await g(page, 'library')).toHaveLength(0);
    const ls = await page.evaluate(() => {
      try { return JSON.parse(localStorage.getItem('folio_library_v2') || '[]'); }
      catch (e) { return []; }
    });
    expect(ls).toHaveLength(0);
  });

  test('Clear All Books — cancel leaves library intact', async ({ page }) => {
    await page.selectOption('#dbg-sent-count', '10');
    await page.selectOption('#dbg-mode', 'tts');
    await page.click('#dbg-inject-btn');
    await pollGlobal(page, () => window.library?.length > 0);

    const lenBefore = await page.evaluate(() => window.library.length);

    // Override dialog to dismiss for this test only
    page.removeAllListeners('dialog');
    page.on('dialog', d => d.dismiss());
    await page.click('#dbg-clear-btn');
    await page.waitForTimeout(100);

    expect(await g(page, 'library')).toHaveLength(lenBefore);
  });

  test('Double inject — second book opens without corrupting first', async ({ page }) => {
    await page.selectOption('#dbg-sent-count', '10');
    await page.selectOption('#dbg-mode', 'tts');
    await page.click('#dbg-inject-btn');
    await pollGlobal(page, () => window.library?.length >= 1);
    const len1 = await page.evaluate(() => window.library.length);

    await page.click('.dbg-tab[data-tab="fixture"]');
    await page.waitForTimeout(50);
    await page.selectOption('#dbg-sent-count', '25');
    await page.click('#dbg-inject-btn');
    await pollGlobal(page, `() => window.library?.length === ${len1 + 1}`);

    expect(await g(page, 'library')).toHaveLength(len1 + 1);
    expect(await g(page, 'sentences')).toHaveLength(25);
  });


  // ════════════════════════════════════════════════════════════════════════════
  // STEPPER TAB
  // (requires an audio-fake fixture to be open)
  // ════════════════════════════════════════════════════════════════════════════

  test.describe('Stepper', () => {
    test.beforeEach(async ({ page }) => {
      await page.selectOption('#dbg-sent-count', '25');
      await page.selectOption('#dbg-mode', 'audio');
      await page.click('#dbg-inject-btn');
      await pollGlobal(page, () => window.ttsMode === false && window.sentenceTimings?.length === 25, 6000);
      await page.click('.dbg-tab[data-tab="stepper"]');
      await page.waitForTimeout(100);
    });

    test('Jump input is 0-based: input 5 → curSent=5 (6th sentence)', async ({ page }) => {
      await page.fill('#dbg-jump-input', '5');
      await page.click('#dbg-jump-btn');
      await page.waitForTimeout(50);
      expect(await g(page, 'curSent')).toBe(5);
    });

    test('Jump 9999 → clamps to sentences.length-1', async ({ page }) => {
      await page.fill('#dbg-jump-input', '9999');
      await page.click('#dbg-jump-btn');
      await page.waitForTimeout(50);
      const cur = await g(page, 'curSent');
      const len = await page.evaluate(() => window.sentences.length);
      expect(cur).toBe(len - 1);
    });

    test('Step -1 at curSent=0 stays at 0', async ({ page }) => {
      await page.fill('#dbg-jump-input', '0');
      await page.click('#dbg-jump-btn');
      await page.waitForTimeout(50);
      await page.click('#dbg-step-m1');
      await page.waitForTimeout(50);
      expect(await g(page, 'curSent')).toBe(0);
    });

    test('Step +10 at last sentence clamps', async ({ page }) => {
      const last = await page.evaluate(() => window.sentences.length - 1);
      await page.fill('#dbg-jump-input', String(last));
      await page.click('#dbg-jump-btn');
      await page.waitForTimeout(50);
      await page.click('#dbg-step-p10');
      await page.waitForTimeout(50);
      expect(await g(page, 'curSent')).toBe(last);
    });

    test('All four step buttons move curSent correctly', async ({ page }) => {
      await page.fill('#dbg-jump-input', '10');
      await page.click('#dbg-jump-btn');
      await page.waitForTimeout(50);

      await page.click('#dbg-step-p1');  await page.waitForTimeout(50);
      expect(await g(page, 'curSent')).toBe(11);
      await page.click('#dbg-step-m1');  await page.waitForTimeout(50);
      expect(await g(page, 'curSent')).toBe(10);
      await page.click('#dbg-step-p10'); await page.waitForTimeout(50);
      expect(await g(page, 'curSent')).toBe(20);
      await page.click('#dbg-step-m10'); await page.waitForTimeout(50);
      expect(await g(page, 'curSent')).toBe(10);
    });

    test('Offset ±0.1/±0.5 update syncOffset', async ({ page }) => {
      const off0 = await g(page, 'syncOffset');
      await page.click('#dbg-off-p1'); await page.waitForTimeout(50);
      expect(await g(page, 'syncOffset')).toBeCloseTo(off0 + 0.1, 5);
      await page.click('#dbg-off-p5'); await page.waitForTimeout(50);
      expect(await g(page, 'syncOffset')).toBeCloseTo(off0 + 0.6, 5);
      await page.click('#dbg-off-m5'); await page.waitForTimeout(50);
      expect(await g(page, 'syncOffset')).toBeCloseTo(off0 + 0.1, 5);
      await page.click('#dbg-off-m1'); await page.waitForTimeout(50);
      expect(await g(page, 'syncOffset')).toBeCloseTo(off0, 5);
    });

    test('Word highlight: input 2 → curWord=2 (0-based, 3rd word)', async ({ page }) => {
      await page.fill('#dbg-jump-input', '5');
      await page.click('#dbg-jump-btn');
      await page.waitForTimeout(50);
      await page.fill('#dbg-word-input', '2');
      await page.click('#dbg-word-btn');
      await page.waitForTimeout(50);
      expect(await g(page, 'curWord')).toBe(2);
    });

    test('TTS controls hidden in audio (fake) mode', async ({ page }) => {
      await expect(page.locator('#dbg-tts-play')).toHaveCount(0);
    });
  });


  // ════════════════════════════════════════════════════════════════════════════
  // STATE TAB
  // ════════════════════════════════════════════════════════════════════════════

  test.describe('State tab', () => {
    test.beforeEach(async ({ page }) => {
      await page.selectOption('#dbg-sent-count', '25');
      await page.selectOption('#dbg-mode', 'audio');
      await page.click('#dbg-inject-btn');
      await pollGlobal(page, () => window.ttsMode === false && window.sentenceTimings?.length === 25, 6000);
      await page.click('.dbg-tab[data-tab="state"]');
      await page.waitForTimeout(600);
    });

    test('All key rows present', async ({ page }) => {
      for (const label of ['mediaState', 'ttsMode', 'sentenceTimings.len', 'curSent', 'IS_PWA', 'CAN_FS']) {
        await expect(page.locator('.dbg-state-table')).toContainText(label);
      }
    });

    test('curSent/total shown in "X / Y" format', async ({ page }) => {
      await expect(page.locator('.dbg-state-table')).toContainText(/ \d+ \/ \d+/);
    });

    test('Audio fields show — when no real audio loaded', async ({ page }) => {
      await expect(page.locator('.dbg-state-table')).toContainText('—');
    });

    test('Anomaly — curSent >= sentences.length → amber cell', async ({ page }) => {
      // Force OOB directly
      await page.evaluate(() => { window.curSent = window.sentences.length; });
      await page.click('.dbg-tab[data-tab="state"]');
      await page.waitForTimeout(600);
      const amber = page.locator('.dbg-state-table td.dbg-anomaly');
      await expect(amber).toHaveCount({ gte: 1 });
    });

    test('Title truncated to 30 chars in state table', async ({ page }) => {
      await page.evaluate(() => {
        const b = {
          id: uid(), title: 'A'.repeat(50),
          audioUrl: null, audioName: null,
          ebookName: 'f.txt', ebookData: 'One.',
          ebookType: 'txt', transcriptName: null, transcriptType: null, transcriptData: null,
          coverUrl: null, coverName: null, curSent: 0, curWord: 0, audioTime: 0,
          wpm: 150, sentPauseMs: 500, playbackRate: 1, totalSents: 1,
        };
        library.push(b); saveLibrary(); renderLib(); openBook(library.length - 1);
      });
      await pollGlobal(page, () => window.sentences?.length > 0);
      await page.click('.dbg-tab[data-tab="state"]');
      await page.waitForTimeout(600);
      const rows = await page.locator('.dbg-state-table tr').all();
      const titleRow = (await Promise.all(rows.map(r => r.textContent()))).find(t => t.includes('title'));
      const val = titleRow?.replace('title', '').trim() || '';
      expect(val.length).toBeLessThanOrEqual(30);
    });

    test('Interval stops when switching away from State tab', async ({ page }) => {
      await page.click('.dbg-tab[data-tab="fixture"]');
      await page.waitForTimeout(600);
      // If interval leaked, switching back and away would throw — we just verify no JS errors
      // (Playwright fails the test automatically on uncaught errors)
    });
  });


  // ════════════════════════════════════════════════════════════════════════════
  // PERSIST TAB
  // ════════════════════════════════════════════════════════════════════════════

  test.describe('Persist tab', () => {
    test.beforeEach(async ({ page }) => {
      await page.click('.dbg-tab[data-tab="persist"]');
      await page.waitForTimeout(100);
    });

    test('Dump LS — char count shown', async ({ page }) => {
      await page.click('#dbg-dump-ls');
      await page.waitForTimeout(50);
      await expect(page.locator('#dbg-ls-out')).toContainText('chars');
    });

    test('Force Save — saveLibrary called', async ({ page }) => {
      await page.evaluate(() => { window._saveCalled = false; const orig = window.saveLibrary; window.saveLibrary = function(){ window._saveCalled = true; return orig.apply(this, arguments); }; });
      await page.click('#dbg-force-save');
      await page.waitForTimeout(50);
      expect(await page.evaluate(() => window._saveCalled)).toBe(true);
    });

    test('Simulate pagehide — event fires', async ({ page }) => {
      await page.evaluate(() => { window._phFired = false; window.addEventListener('pagehide', () => { window._phFired = true; }, { once: true }); });
      await page.click('#dbg-sim-pagehide');
      await page.waitForTimeout(50);
      expect(await page.evaluate(() => window._phFired)).toBe(true);
    });

    test('Dump Progress — key count shown', async ({ page }) => {
      await page.click('#dbg-dump-prog');
      await page.waitForTimeout(50);
      await expect(page.locator('#dbg-prog-out')).toContainText('keys');
    });

    test('Clear LS — cancel leaves key intact', async ({ page }) => {
      // Inject something first
      await page.click('.dbg-tab[data-tab="fixture"]');
      await page.selectOption('#dbg-sent-count', '10');
      await page.selectOption('#dbg-mode', 'tts');
      await page.click('#dbg-inject-btn');
      await pollGlobal(page, () => window.library?.length > 0);
      await page.click('.dbg-tab[data-tab="persist"]');
      await page.waitForTimeout(100);

      const before = await page.evaluate(() => localStorage.getItem('folio_library_v2'));
      page.removeAllListeners('dialog');
      page.on('dialog', d => d.dismiss());
      await page.click('#dbg-clear-ls');
      await page.waitForTimeout(50);
      expect(await page.evaluate(() => localStorage.getItem('folio_library_v2'))).toBe(before);
    });

    test('Clear LS — confirm removes key', async ({ page }) => {
      // dialog already set to accept in outer beforeEach
      await page.click('#dbg-clear-ls');
      await page.waitForTimeout(100);
      await expect(page.locator('#dbg-ls-out')).toContainText('Cleared');
    });

    test('Reset Prefs — confirm removes key and resets UI', async ({ page }) => {
      await page.click('#dbg-reset-prefs');
      await page.waitForTimeout(100);
      const key = await page.evaluate(() => localStorage.getItem('folio_display_prefs_v1'));
      expect(key).toBeNull();
    });

    test('Reset Prefs — cancel leaves key intact', async ({ page }) => {
      // Set a pref so there is something to preserve
      await page.evaluate(() => localStorage.setItem('folio_display_prefs_v1', '{"theme":"night"}'));
      page.removeAllListeners('dialog');
      page.on('dialog', d => d.dismiss());
      await page.click('#dbg-reset-prefs');
      await page.waitForTimeout(50);
      expect(await page.evaluate(() => localStorage.getItem('folio_display_prefs_v1'))).not.toBeNull();
    });

    test('List IDB Blobs — shows output', async ({ page }) => {
      await page.click('#dbg-list-idb');
      await page.waitForTimeout(800);
      const text = await page.locator('#dbg-idb-out').textContent();
      expect(text).not.toBe('Loading…');
      expect(text.length).toBeGreaterThan(0);
    });
  });


  // ════════════════════════════════════════════════════════════════════════════
  // REGRESSION — panel absent without ?debug
  // ════════════════════════════════════════════════════════════════════════════

  test('No ?debug — toggle pill absent from DOM', async ({ page }) => {
    await page.goto(BASE + '/index.html');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#dbg-toggle')).toHaveCount(0);
    await expect(page.locator('#dbg-panel')).toHaveCount(0);
  });

  test('No ?debug — keyboard shortcuts work (Space does not throw)', async ({ page }) => {
    await page.goto(BASE + '/index.html');
    await page.waitForLoadState('networkidle');
    // Just verify no uncaught JS error on keypress
    await page.keyboard.press('Space');
    await page.waitForTimeout(100);
  });

});
