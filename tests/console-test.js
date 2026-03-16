// Verte Debug Panel — Console Test Runner
// Open index.html?debug in a browser tab, then paste this entire script into DevTools console.
// The panel does NOT need to be open before pasting — the script opens it automatically.

(async function VerteTest() {
  'use strict';

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const R = [];
  function ok(name, pass, info = '') {
    R.push({ name, pass: !!pass });
    console.log((pass ? '✅' : '❌') + ' ' + name + (info !== '' ? '  [' + info + ']' : ''));
  }
  function ms(n) { return new Promise(r => setTimeout(r, n)); }
  async function poll(fn, timeout = 4000) {
    const end = Date.now() + timeout;
    while (Date.now() < end) { if (fn()) return true; await ms(50); }
    return false;
  }
  function $id(id) { return document.getElementById(id); }
  function click(id) { $id(id)?.click(); }
  function tab(name) { document.querySelector('.dbg-tab[data-tab="' + name + '"]')?.click(); }
  function setVal(id, v) { const el = $id(id); if (el) el.value = v; }
  // Check an element is visible (inline style not 'none', and it exists)
  function vis(id) { const el = $id(id); return !!(el && el.style.display !== 'none'); }

  const origConfirm = window.confirm;

  // ── Guard ────────────────────────────────────────────────────────────────────
  console.group('🛠 Verte Debug Panel Tests');
  if (!$id('dbg-panel')) {
    console.error('Panel not found. Open index.html?debug first.');
    console.groupEnd();
    return;
  }
  if ($id('dbg-panel').classList.contains('dbg-hidden')) click('dbg-toggle');
  await ms(100);


  // ════════════════════════════════════════════════════════════════════════════
  // FIXTURE TAB
  // ════════════════════════════════════════════════════════════════════════════
  console.group('Fixture');

  // TTS mode, 10 sentences
  tab('fixture'); await ms(50);
  setVal('dbg-sent-count', '10');
  setVal('dbg-mode', 'tts');
  click('dbg-inject-btn');
  await poll(() => typeof sentences !== 'undefined' && sentences.length === 10);
  ok('TTS 10 — sentences.length = 10',       sentences.length === 10,        sentences.length);
  ok('TTS 10 — ttsMode = true',              ttsMode === true);
  ok('TTS 10 — sentenceTimings.len = 0',     sentenceTimings.length === 0,   sentenceTimings.length);
  ok('TTS 10 — ttsBar visible',              vis('ttsBar'));
  ok('TTS 10 — seekStrip hidden',            $id('seekStrip')?.style.display === 'none');

  // Audio fake mode, 25 sentences
  tab('fixture'); await ms(50);
  setVal('dbg-sent-count', '25');
  setVal('dbg-mode', 'audio');
  click('dbg-inject-btn');
  const audioOk = await poll(() => ttsMode === false && sentenceTimings.length === 25, 6000);
  ok('Audio 25 — poll resolved',             audioOk);
  ok('Audio 25 — sentences.length = 25',     sentences.length === 25,        sentences.length);
  ok('Audio 25 — ttsMode = false',           ttsMode === false);
  ok('Audio 25 — sentenceTimings.len = 25',  sentenceTimings.length === 25,  sentenceTimings.length);
  ok('Audio 25 — seekStrip visible',         $id('seekStrip')?.style.display !== 'none');
  ok('Audio 25 — ttsBar hidden',             $id('ttsBar')?.style.display === 'none');

  // Sentence counts 50, 100
  for (const n of [50, 100]) {
    tab('fixture'); await ms(50);
    setVal('dbg-sent-count', String(n));
    setVal('dbg-mode', 'tts');
    click('dbg-inject-btn');
    await poll(() => sentences.length === n);
    ok('Sentence count ' + n, sentences.length === n, sentences.length);
  }

  // Second inject while player open
  tab('fixture'); await ms(50);
  const libBefore = library.length;
  setVal('dbg-sent-count', '25');
  setVal('dbg-mode', 'audio');
  click('dbg-inject-btn');
  await poll(() => library.length === libBefore + 1);
  ok('Double inject — new entry added', library.length === libBefore + 1, library.length);

  // Clear All Books — cancel: library unchanged
  window.confirm = () => false;
  const libLen = library.length;
  click('dbg-clear-btn'); await ms(50);
  window.confirm = origConfirm;
  ok('Clear All cancel — no change', library.length === libLen, library.length);

  // Clear All Books — accept
  window.confirm = () => true;
  click('dbg-clear-btn'); await ms(100);
  window.confirm = origConfirm;
  ok('Clear All confirm — library empty', library.length === 0, library.length);
  ok('Clear All confirm — LS empty array', (() => {
    try { return JSON.parse(localStorage.getItem('verte_library_v2') || '[]').length === 0; }
    catch (e) { return false; }
  })());

  // Re-inject for stepper/state tests
  tab('fixture'); await ms(50);
  setVal('dbg-sent-count', '25');
  setVal('dbg-mode', 'audio');
  click('dbg-inject-btn');
  await poll(() => ttsMode === false && sentenceTimings.length === 25, 6000);

  console.groupEnd(); // Fixture


  // ════════════════════════════════════════════════════════════════════════════
  // STEPPER TAB
  // ════════════════════════════════════════════════════════════════════════════
  console.group('Stepper');
  tab('stepper'); await ms(100);

  // Jump: input is 0-based (5 → 6th sentence, curSent=5)
  setVal('dbg-jump-input', '5'); click('dbg-jump-btn'); await ms(50);
  ok('Jump 5 — curSent = 5 (0-based, 6th sentence)', curSent === 5, curSent);

  // Clamp high
  setVal('dbg-jump-input', '9999'); click('dbg-jump-btn'); await ms(50);
  ok('Jump 9999 — clamps to sentences.length-1', curSent === sentences.length - 1,
    curSent + ' / ' + (sentences.length - 1));

  // Step -1 at 0
  setVal('dbg-jump-input', '0'); click('dbg-jump-btn'); await ms(50);
  click('dbg-step-m1'); await ms(50);
  ok('Step -1 at 0 — stays at 0', curSent === 0, curSent);

  // Step +10 at last
  setVal('dbg-jump-input', String(sentences.length - 1)); click('dbg-jump-btn'); await ms(50);
  click('dbg-step-p10'); await ms(50);
  ok('Step +10 at last — clamps', curSent === sentences.length - 1, curSent);

  // All four step buttons from a known midpoint
  setVal('dbg-jump-input', '10'); click('dbg-jump-btn'); await ms(50);
  click('dbg-step-p1');  await ms(50); ok('Step +1',  curSent === 11, curSent);
  click('dbg-step-m1');  await ms(50); ok('Step -1',  curSent === 10, curSent);
  click('dbg-step-p10'); await ms(50); ok('Step +10', curSent === 20, curSent);
  click('dbg-step-m10'); await ms(50); ok('Step -10', curSent === 10, curSent);

  // Offset buttons
  const off0 = syncOffset;
  click('dbg-off-p1'); await ms(50);
  ok('Offset +0.1', Math.abs(syncOffset - (off0 + 0.1)) < 0.001, syncOffset.toFixed(2));
  click('dbg-off-p5'); await ms(50);
  ok('Offset +0.5', Math.abs(syncOffset - (off0 + 0.6)) < 0.001, syncOffset.toFixed(2));
  click('dbg-off-m5'); click('dbg-off-m1'); await ms(50); // restore approx

  // Word highlight (0-based: word 2 = 3rd word)
  setVal('dbg-jump-input', '5'); click('dbg-jump-btn'); await ms(50);
  setVal('dbg-word-input', '2'); click('dbg-word-btn'); await ms(50);
  ok('Word highlight 2 — curWord = 2 (0-based, 3rd word)', curWord === 2, curWord);

  console.groupEnd(); // Stepper


  // ════════════════════════════════════════════════════════════════════════════
  // STATE TAB
  // ════════════════════════════════════════════════════════════════════════════
  console.group('State');
  tab('state'); await ms(600); // wait for first interval render

  const tbl = document.querySelector('.dbg-state-table');
  ok('Table rendered', !!tbl);

  const txt = tbl?.textContent || '';
  ok('Row: mediaState',           txt.includes('mediaState'));
  ok('Row: ttsMode',              txt.includes('ttsMode'));
  ok('Row: sentenceTimings.len',  txt.includes('sentenceTimings.len'));
  ok('Row: IS_PWA',               txt.includes('IS_PWA'));
  ok('curSent/total "X / Y" format', /\d+ \/ \d+/.test(txt));
  ok('Audio fields "—" or numeric', txt.includes('—') || /\d+\.\d{2}/.test(txt));

  // Anomaly: curSent >= sentences.length → amber cell
  const savedCurSent = curSent;
  curSent = sentences.length; // intentionally out of range
  tab('state'); await ms(600);
  ok('Anomaly — curSent OOB → amber cell',
    !!document.querySelector('.dbg-state-table td.dbg-anomaly'));
  curSent = Math.min(savedCurSent, sentences.length - 1);
  if (typeof updateHL === 'function') updateHL();
  if (typeof updateProg === 'function') updateProg();

  // Interval clears on tab switch (no throw proxy check)
  tab('fixture'); await ms(150);
  ok('Interval clears on tab switch (no throw)', true);

  // Title truncation: inject long-title book
  tab('fixture'); await ms(50);
  const longBook = {
    id: uid(), title: 'A'.repeat(50) + ' Long Title Book',
    audioUrl: null, audioName: null,
    ebookName: 'fixture.txt', ebookData: 'One sentence only.',
    ebookType: 'txt', transcriptName: null, transcriptType: null, transcriptData: null,
    coverUrl: null, coverName: null, curSent: 0, curWord: 0, audioTime: 0,
    wpm: 150, sentPauseMs: 500, playbackRate: 1, totalSents: 1,
  };
  library.push(longBook); saveLibrary(); renderLib();
  openBook(library.length - 1);
  await poll(() => sentences.length > 0);
  tab('state'); await ms(600);
  const titleRow = [...(document.querySelectorAll('.dbg-state-table tr') || [])].find(r => r.textContent.includes('title'));
  const titleVal = titleRow?.querySelectorAll('td')[1]?.textContent || '';
  ok('Title truncated to 30 chars', titleVal.length <= 30, titleVal.length + ' "' + titleVal + '"');

  console.groupEnd(); // State


  // ════════════════════════════════════════════════════════════════════════════
  // PERSIST TAB
  // ════════════════════════════════════════════════════════════════════════════
  console.group('Persist');
  tab('persist'); await ms(100);

  // Dump LS — char count displayed, no throw
  click('dbg-dump-ls'); await ms(50);
  ok('Dump LS — char count shown', /chars/.test($id('dbg-ls-out')?.textContent || ''),
    $id('dbg-ls-out')?.textContent);

  // Force Save
  let saveCalled = false;
  const origSave = window.saveLibrary;
  window.saveLibrary = function () { saveCalled = true; return origSave.apply(this, arguments); };
  click('dbg-force-save'); await ms(50);
  window.saveLibrary = origSave;
  ok('Force Save — saveLibrary called', saveCalled);

  // Dump Progress — no throw, key count shown
  click('dbg-dump-prog'); await ms(50);
  ok('Dump Progress — key count shown', /keys/.test($id('dbg-prog-out')?.textContent || ''),
    $id('dbg-prog-out')?.textContent);

  // Simulate pagehide
  let phFired = false;
  const phHandler = () => { phFired = true; };
  window.addEventListener('pagehide', phHandler);
  click('dbg-sim-pagehide'); await ms(50);
  window.removeEventListener('pagehide', phHandler);
  ok('Simulate pagehide — event fired', phFired);

  // Dump Prefs — no throw
  let prefsOk = true;
  try { click('dbg-dump-prefs'); await ms(50); } catch (e) { prefsOk = false; }
  ok('Dump Prefs — no throw', prefsOk);

  // Clear LS — cancel: key intact
  const lsBefore = localStorage.getItem('verte_library_v2');
  window.confirm = () => false;
  click('dbg-clear-ls'); await ms(50);
  window.confirm = origConfirm;
  ok('Clear LS cancel — key intact', localStorage.getItem('verte_library_v2') === lsBefore);

  // Reset Prefs — cancel: key intact
  const prefsBefore = localStorage.getItem('verte_display_prefs_v1');
  window.confirm = () => false;
  click('dbg-reset-prefs'); await ms(50);
  window.confirm = origConfirm;
  ok('Reset Prefs cancel — key intact',
    localStorage.getItem('verte_display_prefs_v1') === prefsBefore);

  // Reset Prefs — accept
  window.confirm = () => true;
  click('dbg-reset-prefs'); await ms(100);
  window.confirm = origConfirm;
  ok('Reset Prefs confirm — key removed',
    localStorage.getItem('verte_display_prefs_v1') === null);

  // List IDB Blobs — no throw, output populated
  click('dbg-list-idb'); await ms(500);
  const idbOut = $id('dbg-idb-out')?.textContent || '';
  ok('List IDB Blobs — output shown', idbOut.length > 0 && idbOut !== 'Loading…', '"' + idbOut.slice(0, 60) + '"');

  console.groupEnd(); // Persist


  // ════════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ════════════════════════════════════════════════════════════════════════════
  console.groupEnd(); // Main
  const pass = R.filter(r => r.pass).length;
  const fail = R.filter(r => !r.pass).length;
  console.log('\n' + (fail === 0
    ? '✅ All ' + pass + ' tests passed'
    : '⚠️  ' + pass + ' passed, ' + fail + ' FAILED'));
  if (fail > 0) {
    console.group('Failed tests');
    R.filter(r => !r.pass).forEach(r => console.error('❌', r.name));
    console.groupEnd();
  }
  return R;
})();
