/**
 * Tests for: Instant scroll on large seek jumps
 * Changes under test:
 *   1. onSeekChange — removed mediaState!=='playing' guard; added instant scroll for >5 sentence jumps
 *   2. wireAudioEvents timeupdate — added instant scroll for >5 sentence jumps
 * Added: 2026-03-13
 */

import { test, expect } from '@playwright/test';
import { clearStorage, gotoFolio, injectFixtureBook, openBook, getAppState } from '../helpers/folio.js';

// ── Helpers ──────────────────────────────────────────────────

async function injectStateReader(page) {
  await page.evaluate(() => {
    if (window.__seekTestState) return;
    const s = document.createElement('script');
    s.textContent = `
      window.__seekTestState = function() {
        return {
          mediaState,
          curSent,
          curWord,
          autoScroll,
          scrollPaused,
          isSeeking,
          syncOffset,
        };
      };
      window.__seekSetMediaState = function(s) { mediaState = s; };
      window.__seekSetCurSent = function(i) { curSent = i; };
      window.__seekSetCurWord = function(i) { curWord = i; };
      window.__seekSetAutoScroll = function(v) { autoScroll = v; };
    `;
    document.head.appendChild(s);
  });
}

async function getInternalState(page) {
  return page.evaluate(() => window.__seekTestState());
}

// Seed dense timings: sentence i -> start i*2s, end (i+1)*2-0.1
async function seedDenseTimings(page) {
  await page.evaluate(() => {
    const sents = __testBridge('getSentences');
    const timings = sents.map((_, i) =>
      ({ start: i * 2, end: (i + 1) * 2 - 0.1 }));
    __testBridge('setSentenceTimings', timings);
    updateHL();
  });
}

// Seed sparse timings: only even-indexed sentences have entries
async function seedSparseTimings(page) {
  await page.evaluate(() => {
    const sents = __testBridge('getSentences');
    const timings = sents.map((_, i) =>
      i % 2 === 0 ? { start: i * 2, end: (i + 1) * 2 - 0.1 } : undefined);
    __testBridge('setSentenceTimings', timings);
    updateHL();
  });
}

// Mock audio element with configurable currentTime and duration
async function mockAudio(page, { currentTime, duration = 200, paused = true }) {
  await page.evaluate(({ ct, dur, p }) => {
    const audio = document.getElementById('audio');
    Object.defineProperty(audio, 'paused', { get: () => p, configurable: true });
    Object.defineProperty(audio, 'currentTime', { get: () => ct, configurable: true, set: () => {} });
    Object.defineProperty(audio, 'duration', { get: () => dur, configurable: true });
  }, { ct: currentTime, dur: duration, p: paused });
}

// ── Setup ────────────────────────────────────────────────────

test.beforeEach(async ({ page }) => {
  await gotoFolio(page);
  await clearStorage(page);
  await page.reload();
  await page.waitForSelector('#library', { state: 'visible', timeout: 8000 });
  await injectFixtureBook(page, { sentenceCount: 40 });
  await openBook(page);
  await injectStateReader(page);
});

// ═══════════════════════════════════════════════════════════
// 1. onSeekChange — runs sentence scan regardless of playback state
// ═══════════════════════════════════════════════════════════

test.describe('onSeekChange always runs sentence scan', () => {

  test('updates curSent when mediaState is playing', async ({ page }) => {
    await seedDenseTimings(page);
    await mockAudio(page, { currentTime: 20.5, paused: false });

    await page.evaluate(() => {
      window.__seekSetMediaState('playing');
      // onSeekChange takes a percentage; 20.5/200 * 100 = 10.25%
      window.onSeekChange(10.25);
    });

    const state = await getInternalState(page);
    // t=20.5 -> sentence 10 (start=20.0)
    expect(state.curSent).toBe(10);
  });

  test('updates curSent when mediaState is paused', async ({ page }) => {
    await seedDenseTimings(page);
    await mockAudio(page, { currentTime: 14.5, paused: true });

    await page.evaluate(() => {
      window.__seekSetMediaState('paused');
      window.onSeekChange(7.25); // 14.5/200 * 100
    });

    const state = await getInternalState(page);
    // t=14.5 -> sentence 7 (start=14.0)
    expect(state.curSent).toBe(7);
  });

  test('updates curSent when mediaState is stopped', async ({ page }) => {
    await seedDenseTimings(page);
    await mockAudio(page, { currentTime: 6.0, paused: true });

    await page.evaluate(() => {
      window.__seekSetMediaState('stopped');
      window.onSeekChange(3.0); // 6.0/200 * 100
    });

    const state = await getInternalState(page);
    // t=6.0 -> sentence 3 (start=6.0)
    expect(state.curSent).toBe(3);
  });

  test('resets curWord to 0 on seek', async ({ page }) => {
    await seedDenseTimings(page);
    // Set curWord to something non-zero
    await page.evaluate(() => window.__seekSetCurWord(5));
    await mockAudio(page, { currentTime: 10.0, paused: true });

    await page.evaluate(() => {
      window.__seekSetMediaState('paused');
      window.onSeekChange(5.0);
    });

    const state = await getInternalState(page);
    expect(state.curWord).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════
// 2. Instant scroll on large jumps (>5 sentences)
// ═══════════════════════════════════════════════════════════

test.describe('instant scroll threshold', () => {

  test('onSeekChange uses instant scroll for jump > 5 sentences', async ({ page }) => {
    await seedDenseTimings(page);
    await page.evaluate(() => window.__seekSetAutoScroll(true));

    // Start at sentence 0, seek to sentence 15
    await page.evaluate(() => window.__seekSetCurSent(0));
    await mockAudio(page, { currentTime: 30.5, paused: true });

    // Spy on scrollIntoView to capture the behavior argument
    const scrollBehavior = await page.evaluate(() => {
      let captured = null;
      const origScroll = Element.prototype.scrollIntoView;
      Element.prototype.scrollIntoView = function(opts) {
        captured = opts;
        origScroll.call(this, opts);
      };
      window.__seekSetMediaState('paused');
      window.onSeekChange(15.25); // -> t=30.5 -> sentence 15
      Element.prototype.scrollIntoView = origScroll;
      return captured;
    });

    expect(scrollBehavior).toBeTruthy();
    expect(scrollBehavior.behavior).toBe('instant');
  });

  test('onSeekChange uses smooth scroll for jump <= 5 sentences', async ({ page }) => {
    await seedDenseTimings(page);
    await page.evaluate(() => window.__seekSetAutoScroll(true));

    // Start at sentence 10, seek to sentence 13 (3-sentence jump)
    await page.evaluate(() => window.__seekSetCurSent(10));
    await mockAudio(page, { currentTime: 26.5, paused: true });

    const scrollBehavior = await page.evaluate(() => {
      let captured = null;
      const origScroll = Element.prototype.scrollIntoView;
      Element.prototype.scrollIntoView = function(opts) {
        captured = opts;
        origScroll.call(this, opts);
      };
      window.__seekSetMediaState('paused');
      window.onSeekChange(13.25); // -> t=26.5 -> sentence 13
      Element.prototype.scrollIntoView = origScroll;
      return captured;
    });

    expect(scrollBehavior).toBeTruthy();
    expect(scrollBehavior.behavior).toBe('smooth');
  });

  test('timeupdate uses instant scroll for jump > 5 sentences', async ({ page }) => {
    await seedDenseTimings(page);
    await page.evaluate(() => {
      window.__seekSetAutoScroll(true);
      window.__seekSetCurSent(0);
    });
    await mockAudio(page, { currentTime: 30.5, paused: false });

    const scrollBehavior = await page.evaluate(() => {
      let captured = null;
      const origScroll = Element.prototype.scrollIntoView;
      Element.prototype.scrollIntoView = function(opts) {
        captured = opts;
        origScroll.call(this, opts);
      };
      window.__seekSetMediaState('playing');
      document.getElementById('audio').dispatchEvent(new Event('timeupdate'));
      Element.prototype.scrollIntoView = origScroll;
      return captured;
    });

    expect(scrollBehavior).toBeTruthy();
    expect(scrollBehavior.behavior).toBe('instant');
  });

  test('timeupdate uses smooth scroll for 1-sentence advance', async ({ page }) => {
    await seedDenseTimings(page);
    await page.evaluate(() => {
      window.__seekSetAutoScroll(true);
      window.__seekSetCurSent(7);
    });
    await mockAudio(page, { currentTime: 16.5, paused: false });

    const scrollBehavior = await page.evaluate(() => {
      let captured = null;
      const origScroll = Element.prototype.scrollIntoView;
      Element.prototype.scrollIntoView = function(opts) {
        captured = opts;
        origScroll.call(this, opts);
      };
      window.__seekSetMediaState('playing');
      document.getElementById('audio').dispatchEvent(new Event('timeupdate'));
      Element.prototype.scrollIntoView = origScroll;
      return captured;
    });

    expect(scrollBehavior).toBeTruthy();
    expect(scrollBehavior.behavior).toBe('smooth');
  });

  test('exactly 5-sentence jump uses smooth (threshold is >5)', async ({ page }) => {
    await seedDenseTimings(page);
    await page.evaluate(() => {
      window.__seekSetAutoScroll(true);
      window.__seekSetCurSent(5);
    });
    await mockAudio(page, { currentTime: 20.5, paused: true });

    const scrollBehavior = await page.evaluate(() => {
      let captured = null;
      const origScroll = Element.prototype.scrollIntoView;
      Element.prototype.scrollIntoView = function(opts) {
        captured = opts;
        origScroll.call(this, opts);
      };
      window.__seekSetMediaState('paused');
      window.onSeekChange(10.25); // -> t=20.5 -> sentence 10 (jump=5, not >5)
      Element.prototype.scrollIntoView = origScroll;
      return captured;
    });

    expect(scrollBehavior).toBeTruthy();
    expect(scrollBehavior.behavior).toBe('smooth');
  });

  test('6-sentence jump uses instant (threshold is >5)', async ({ page }) => {
    await seedDenseTimings(page);
    await page.evaluate(() => {
      window.__seekSetAutoScroll(true);
      window.__seekSetCurSent(4);
    });
    await mockAudio(page, { currentTime: 20.5, paused: true });

    const scrollBehavior = await page.evaluate(() => {
      let captured = null;
      const origScroll = Element.prototype.scrollIntoView;
      Element.prototype.scrollIntoView = function(opts) {
        captured = opts;
        origScroll.call(this, opts);
      };
      window.__seekSetMediaState('paused');
      window.onSeekChange(10.25); // -> t=20.5 -> sentence 10 (jump=6, >5)
      Element.prototype.scrollIntoView = origScroll;
      return captured;
    });

    expect(scrollBehavior).toBeTruthy();
    expect(scrollBehavior.behavior).toBe('instant');
  });
});

// ═══════════════════════════════════════════════════════════
// 3. DOM state after seek
// ═══════════════════════════════════════════════════════════

test.describe('DOM state after seek', () => {

  test('sent-active class moves to correct sentence after onSeekChange', async ({ page }) => {
    await seedDenseTimings(page);
    await mockAudio(page, { currentTime: 24.5, paused: true });

    await page.evaluate(() => {
      window.__seekSetMediaState('paused');
      window.onSeekChange(12.25); // -> t=24.5 -> sentence 12
    });

    const hlSent = page.locator('#eContent .sent.sent-active');
    await expect(hlSent).toHaveCount(1);
    const dataIdx = await hlSent.getAttribute('data-si');
    expect(Number(dataIdx)).toBe(12);
  });

  test('sent-active class moves after timeupdate large jump', async ({ page }) => {
    await seedDenseTimings(page);
    await page.evaluate(() => window.__seekSetCurSent(2));
    await mockAudio(page, { currentTime: 30.5, paused: false });

    await page.evaluate(() => {
      window.__seekSetMediaState('playing');
      document.getElementById('audio').dispatchEvent(new Event('timeupdate'));
    });

    const hlSent = page.locator('#eContent .sent.sent-active');
    await expect(hlSent).toHaveCount(1);
    const dataIdx = await hlSent.getAttribute('data-si');
    expect(Number(dataIdx)).toBe(15);
  });

  test('only one sent-active exists after rapid consecutive seeks', async ({ page }) => {
    await seedDenseTimings(page);
    await mockAudio(page, { currentTime: 10.5, paused: true });

    await page.evaluate(() => {
      window.__seekSetMediaState('paused');
      window.onSeekChange(5.25); // -> sentence 5
    });

    await mockAudio(page, { currentTime: 30.5, paused: true });
    await page.evaluate(() => {
      window.onSeekChange(15.25); // -> sentence 15
    });

    const hlSents = page.locator('#eContent .sent.sent-active');
    await expect(hlSents).toHaveCount(1);
    const dataIdx = await hlSents.getAttribute('data-si');
    expect(Number(dataIdx)).toBe(15);
  });

  test('progress display updates after seek', async ({ page }) => {
    await seedDenseTimings(page);
    await mockAudio(page, { currentTime: 50.5, paused: true });

    // Read initial progress text
    const before = await page.locator('#pProg').textContent();

    await page.evaluate(() => {
      window.__seekSetMediaState('paused');
      window.onSeekChange(25.25); // -> sentence 25
    });

    const after = await page.locator('#pProg').textContent();
    // Progress should have changed (exact text depends on TOC, but it should differ)
    expect(after).not.toBe(before);
  });
});

// ═══════════════════════════════════════════════════════════
// 4. isSeeking flag management
// ═══════════════════════════════════════════════════════════

test.describe('isSeeking flag', () => {

  test('isSeeking is false after onSeekChange completes', async ({ page }) => {
    await seedDenseTimings(page);
    await mockAudio(page, { currentTime: 10.0, paused: true });

    await page.evaluate(() => {
      window.__seekSetMediaState('paused');
      window.onSeekChange(5.0);
    });

    const state = await getInternalState(page);
    expect(state.isSeeking).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════
// 5. Sparse timings with seek
// ═══════════════════════════════════════════════════════════

test.describe('sparse timings with seek', () => {

  test('onSeekChange finds correct sentence in sparse timings', async ({ page }) => {
    await seedSparseTimings(page);
    // Time 8.5s should match sentence 4 (even-indexed, start=8.0)
    await mockAudio(page, { currentTime: 8.5, paused: false });

    await page.evaluate(() => {
      window.__seekSetMediaState('playing');
      window.onSeekChange(4.25); // percentage for t=8.5 with dur=200
    });

    const state = await getInternalState(page);
    expect(state.curSent).toBe(4);
  });

  test('onSeekChange skips undefined holes in sparse timings', async ({ page }) => {
    await seedSparseTimings(page);
    // Time 7.0 — sentence 3 is undefined (odd), should match sentence 2 (start=4.0)
    await mockAudio(page, { currentTime: 7.0, paused: true });

    await page.evaluate(() => {
      window.__seekSetMediaState('paused');
      window.onSeekChange(3.5);
    });

    // Reverse scan: 3 is undefined, 2 has start=4.0, 7.0 >= 4.0 -> match
    const state = await getInternalState(page);
    expect(state.curSent).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════
// 6. Error resilience
// ═══════════════════════════════════════════════════════════

test.describe('error resilience', () => {

  test('onSeekChange with empty sentenceTimings does not crash', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));

    await page.evaluate(() => {
      __testBridge('setSentenceTimings', []);
    });
    await mockAudio(page, { currentTime: 10.0, paused: true });

    await page.evaluate(() => {
      window.__seekSetMediaState('paused');
      window.onSeekChange(5.0);
    });

    expect(errors).toHaveLength(0);
  });

  test('onSeekChange with NaN duration does not crash', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));

    await seedDenseTimings(page);
    await page.evaluate(() => {
      const audio = document.getElementById('audio');
      Object.defineProperty(audio, 'duration', { get: () => NaN, configurable: true });
      window.__seekSetMediaState('paused');
      window.onSeekChange(50);
    });

    expect(errors).toHaveLength(0);
  });

  test('no curSent change when seek lands on same sentence', async ({ page }) => {
    await seedDenseTimings(page);
    // Set curSent to 5, then seek to a time that still maps to sentence 5
    await page.evaluate(() => window.__seekSetCurSent(5));
    await mockAudio(page, { currentTime: 10.5, paused: true }); // -> sentence 5

    const scrollCalled = await page.evaluate(() => {
      let called = false;
      const origScroll = Element.prototype.scrollIntoView;
      Element.prototype.scrollIntoView = function(opts) {
        called = true;
        origScroll.call(this, opts);
      };
      window.__seekSetMediaState('paused');
      window.onSeekChange(5.25);
      Element.prototype.scrollIntoView = origScroll;
      return called;
    });

    // No scroll should fire — curSent didn't change
    expect(scrollCalled).toBe(false);
  });

  test('backward seek works (higher sentence to lower)', async ({ page }) => {
    await seedDenseTimings(page);
    await page.evaluate(() => window.__seekSetCurSent(20));
    await mockAudio(page, { currentTime: 4.5, paused: true });

    await page.evaluate(() => {
      window.__seekSetMediaState('paused');
      window.onSeekChange(2.25); // -> t=4.5 -> sentence 2
    });

    const state = await getInternalState(page);
    expect(state.curSent).toBe(2);
  });

  test('backward seek > 5 sentences uses instant scroll', async ({ page }) => {
    await seedDenseTimings(page);
    await page.evaluate(() => {
      window.__seekSetAutoScroll(true);
      window.__seekSetCurSent(30);
    });
    await mockAudio(page, { currentTime: 4.5, paused: true });

    const scrollBehavior = await page.evaluate(() => {
      let captured = null;
      const origScroll = Element.prototype.scrollIntoView;
      Element.prototype.scrollIntoView = function(opts) {
        captured = opts;
        origScroll.call(this, opts);
      };
      window.__seekSetMediaState('paused');
      window.onSeekChange(2.25); // -> sentence 2 (jump=28, >5)
      Element.prototype.scrollIntoView = origScroll;
      return captured;
    });

    expect(scrollBehavior).toBeTruthy();
    expect(scrollBehavior.behavior).toBe('instant');
  });
});

// ═══════════════════════════════════════════════════════════
// 7. autoScroll disabled — no scroll on seek
// ═══════════════════════════════════════════════════════════

test.describe('autoScroll disabled', () => {

  test('no scrollIntoView when autoScroll is off', async ({ page }) => {
    await seedDenseTimings(page);
    await page.evaluate(() => window.__seekSetAutoScroll(false));
    await mockAudio(page, { currentTime: 30.5, paused: true });

    const scrollCalled = await page.evaluate(() => {
      let called = false;
      const origScroll = Element.prototype.scrollIntoView;
      Element.prototype.scrollIntoView = function(opts) {
        called = true;
        origScroll.call(this, opts);
      };
      window.__seekSetMediaState('paused');
      window.onSeekChange(15.25);
      Element.prototype.scrollIntoView = origScroll;
      return called;
    });

    expect(scrollCalled).toBe(false);
    // But curSent should still be updated
    const state = await getInternalState(page);
    expect(state.curSent).toBe(15);
  });
});
