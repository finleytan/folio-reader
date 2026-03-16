# Verte — Function Index & Context

## File Layout

| Zone | Lines | Contents |
|------|-------|----------|
| CSS | 16–556 | All styles |
| HTML | 558–989 | 4 screens + 4 modals |
| JS | 989–4299 | All logic |

### HTML Structure

| Element | Purpose |
|---------|---------|
| `#toastContainer` | Toast mount point |
| `#installBanner` | PWA install prompt |
| `#pwaFirstRun` | First-run folder picker screen |
| `#pwaRegrant` | Re-grant permissions screen |
| `#library` | Library screen: header (with settings gear) + `#libSettingsPanel` + `#libGrid` card grid |
| `#player` | Player screen (audio, top bar, options, transcript banner, reader body, bottom controls). Receives `bars-hidden` class for PWA auto-hide |
| `#bottomControls` | Bottom controls bar: seek strip + play/skip/vol/speed ctrl-row (hidden when ebook-only and TTS off) |
| `#modal` | Add Book modal (Audio, Ebook, Transcript, Cover pills — clickable to pick individual files; each pill shows accepted file types) |
| `#txModal` | Transcript modal (add/replace transcript) |
| `#linkAudioModal` | Link Audio modal (add audio to ebook-only book) |
| `#editBookModal` | Edit Book Details modal (title, author, file slots — opened from library pencil icon) |
| `#relinkOverlay` | Relink audio overlay (expired audio URL); auto-shown on book open unless dismissed |
| `#orientSec` | Orientation lock setting section in Display options (PWA only, hidden by default via `display:none`) |

---

## Function Index

| Function | Line | Area | Notes |
|----------|------|------|-------|
| `showSyncHintOnce` | 1037 | Toast | One-time hint after first transcript sync |
| `showToast` | 1043 | Toast | |
| `acquireWakeLock` | 1060 | Wake Lock | |
| `setupMediaSession` | 1116 | Media Session | |
| `saveBookProgressDebounced` | 1144 | Save | |
| `updatePageTitle` | 1152 | Page Title | |
| `cycleSleepTimer` | 1168 | Sleep Timer | |
| `_openModalEl` / `_closeModalRestore` | 1209 | Modal Helpers | |
| `cacheDOM` | 1326 | DOM Cache | |
| `setPlayBtnIcon` | 1340 | DOM Cache | |
| `xh` / `fmt` / `uid` | 1345 | Utility | `fmt` formats seconds as M:SS or H:MM:SS for durations ≥1 hour |
| `idbOpen` / `idbSet` / `idbGet` | 1352 | IndexedDB | |
| `saveLibrary` | 1392 | Library Persistence | |
| `loadLibrary` | 1437 | Library Persistence | |
| `saveBookProgress` | 1473 | Library Persistence | ⚠️ Call this not saveLibrary() from playback code |
| `flushPositionSync` | 1487 | Library Persistence | |
| `saveDisplayPrefs` | 1537 | Display Prefs | Saves orientation pref (auto/portrait/landscape) |
| `loadDisplayPrefs` | 1553 | Display Prefs | Shows `#orientSec` and applies `screen.orientation.lock()` in PWA mode |
| `toggleLibSettings` | 1609 | Library UI | Toggles `#libSettingsPanel` visibility |
| `renderLib` | 1613 | Library UI | Shows onboarding card when library is empty (browser mode); pencil icon opens Edit Book modal |
| `unhideBook` | 1716 | Library UI | |
| `renameBook` | 1729 | Library UI | ⚠️ Remove blur listener before Enter/Escape to prevent double-fire |
| `deleteBook` | 1763 | Library UI | |
| `configurePlayerForMode` | 1811 | Player Config | ⚠️ Owns _audio.src — do not assign src before calling this. Defaults highlighting (off for TTS, word for audio). Calls `_updateSkipBtns()`. `loadedmetadata` handler seeks to `b.audioTime` or falls back to `b.curSent` position |
| `toggleTtsMode` | 1842 | Player Config | Toggles TTS on/off for ebook-only books; auto-enables sentence HL on, disables HL on off. Calls `_updateSkipBtns()` |
| `openBook` | 1858 | Open/Close | ⚠️ Auto-shows relink overlay if `audioName` set but `audioUrl` lost (unless dismissed). Sets `#pAuthor` from `b.author` |
| `pulseResumeSent` | 1876 | Open/Close | |
| `goLib` | 1885 | Open/Close | ⚠️ Must clear sentences[], tocEntries[], sentenceTimings[] — already does. Calls `clearBarTimer()` |
| `seekAudioToSentence` | 1911 | Media Controls | ⚠️ Sparse sentenceTimings — linear scan only, not binary search. Defers seek via `loadedmetadata` listener if audio not ready (`readyState < 1`) |
| `setMediaState` | 1921 | Media Controls | |
| `togglePlay` | 1924 | Media Controls | ⚠️ Shows toast if no audio and TTS off |
| `mediaPlay` / `mediaPause` / `mediaStop` | 1930 | Media Controls | ⚠️ `mediaPlay` only acquires wake lock in `.then()` — all playback state (icon, mediaState, ticker) is set by the `play` event handler in `wireAudioEvents`, not here |
| `_updateSkipBtns` | 1961 | Media Controls | Swaps skip button icons/labels: circular-arrow+15 for audio, chevrons for TTS; also handles big-skip (1m / 5 sentences) |
| `skip` | 1976 | Media Controls | In TTS mode: ±1 sentence (15s) or ±5 sentences (60s). In audio mode: seeks by seconds |
| `changeSpeed` | 1982 | Media Controls | |
| `cycleSpeed` | 1988 | Media Controls | Tap-to-cycle through RATE_STEPS; reads from `rateCustom` in TTS mode |
| `setRate` | 1995 | Media Controls | |
| `setVol` / `setVolBoth` / `toggleMute` | 2032 | Media Controls | |
| `toggleVolPop` | 2050 | Media Controls | Opens/closes volume popover; closes on outside tap |
| `onSeekInput` | 2064 | Media Controls | |
| `onSeekChange` | 2065 | Media Controls | ⚠️ Sparse sentenceTimings — linear scan only, not binary search |
| `_wordTick` | 2088 | Audio Events | ⚠️ curWord=-1 sentinel prevents word-0 flash — do not change to 0 |
| `startWordTicker` / `stopWordTicker` | 2112 | Audio Events | |
| `wireAudioEvents` | 2116 | Audio Events | ⚠️ timeupdate self-heal for Samsung audio-focus steal — do not remove. `play` event is the single source of truth for playback state (icon, mediaState, ticker, wake lock). `play` handler calls `resetBarTimer()` **after** the state quad; `pause`/`ended` handlers call `clearBarTimer()` |
| `startScrollEngine` | 2182 | Scroll Engine | ⚠️ scrollTimer separate from _scrollPauseTimer — do not merge |
| `stopScrollEngine` | 2187 | Scroll Engine | |
| `advanceSent` | 2190 | Scroll Engine | |
| `nudge` | 2204 | Scroll Engine | In TTS mode while playing: calls `ttsStop(); ttsPlay()` to restart from new sentence |
| `resync` | 2211 | Scroll Engine | |
| `adjustOffset` / `updateOffsetUI` | 2221 | Sync Offset | |
| `getTtsVoices` | 2235 | TTS | |
| `setTtsVoice` / `setTtsRate` | 2250 | TTS | |
| `ttsPlay` | 2260 | TTS | ⚠️ ttsSpeaking owned here — stopScrollEngine must never set it. Reads rate from `rateCustom` input. Calls `resetBarTimer()` **after** the state quad (see fragile #41) |
| `ttsPause` / `ttsStop` | 2312 | TTS | Call `clearBarTimer()` |
| `scrubToPosition` | 2325 | TTS | |
| `updateHL` | 2346 | Highlighting | ⚠️ sentences[] holds live DOM refs — stale after any #eContent innerHTML wipe |
| `updateProg` | 2358 | Highlighting | Guards null `_readProg` (progress bar removed from DOM) |
| `_cacheScrollMetrics` | 2370 | Highlighting | |
| `scrollToSent` | 2377 | Highlighting | |
| `toggleAS` | 2390 | Highlighting | |
| `toggleWordHl` / `toggleSentHl` | 2394 | Highlighting | |
| `_resyncAndHL` | 2413 | Highlighting | ⚠️ Sparse sentenceTimings — linear scan only, not binary search |
| `_syncHlPills` | 2428 | Highlighting | |
| `setHighlightMode` | 2434 | Highlighting | ⚠️ Updates notx banner reactively — shows/hides based on sentHlOn + ttsMode + transcript state |
| `toggleToc` | 2464 | TOC | |
| `buildToc` | 2470 | TOC | |
| `updateTocActive` | 2519 | TOC | |
| `toggleOpts` / `switchOptTab` | 2531 | Options | |
| `setTheme` | 2541 | Options | ⚠️ Wipes body.className — loses is-pwa class until reload (known issue #22). Does NOT affect `bars-hidden` (on `#player`, not body) |
| `updateThemeColor` | 2548 | Options | |
| `setFont` | 2552 | Options | |
| `setFS` / `setLH` / `setMW` | 2569 | Options | |
| `setAlign` | 2573 | Options | |
| `setOrientation` | 2579 | Options | PWA only — locks screen via `screen.orientation.lock()` (auto/portrait/landscape). Persisted in display prefs. `.catch()` silences errors on unsupported platforms (iOS) |
| `setSentPause` / `toggleOpInfo` | 2594 | Options | |
| `_shouldAutoHide` | 2616 | Auto-Hide Bars | PWA only — returns true when bars can auto-hide (playing, no panels/modals open, on player screen) |
| `showBars` / `hideBars` | 2626 | Auto-Hide Bars | PWA only — add/remove `bars-hidden` class on `#player`. Bars collapse (height:0) so reading area expands |
| `resetBarTimer` | 2637 | Auto-Hide Bars | ⚠️ PWA only — show bars + restart 6-second idle timer. Must be called **after** `setMediaState('playing')` in playback start paths (see fragile #41) |
| `clearBarTimer` | 2643 | Auto-Hide Bars | PWA only — cancel timer + show bars. Called on pause/stop/ended/goLib |
| `loadTranscriptData` | 2670 | Transcript | ⚠️ Shows notx banner if no transcript + audio + sentHlOn + !ttsMode |
| `setBannerState` | 2724 | Transcript | ⚠️ notx state has separate HTML elements (txBannerTop/txBannerActions) from other states. Supports `warn` state (amber, 20s auto-hide) for low match % |
| `_timingWorkerFn` | 2766 | Transcript | ⚠️ Two copies of splitSentences + matching logic — worker copy must stay in sync (~2766) |
| `getTimingWorker` | 2944 | Transcript | ⚠️ Worker `onmessage` calls `seekAudioToSentence()` (if audio at 0 + curSent > 0) or `_resyncAndHL()` after timings built |
| `buildSentenceTimings` | 2986 | Transcript | ⚠️ Sparse sentenceTimings — linear scan only, not binary search. Posts to worker and returns before timings exist — resync happens in worker onmessage |
| `buildTimingsFromPlainText` | 3020 | Transcript | |
| `_buildSentenceTimingsSync` | 3053 | Transcript | Calls `seekAudioToSentence()` or `_resyncAndHL()` after timings built |
| `_buildTimingsFromPlainTextSync` | 3183 | Transcript | Calls `seekAudioToSentence()` or `_resyncAndHL()` after timings built |
| `similarity` / `updateTranscriptUI` | 3215 | Transcript | |
| `yieldToMain` | 3230 | Ebook | |
| `loadEbook` | 3236 | Ebook | ⚠️ No cancellation guard — race possible on rapid book switch (see verte-fragile.md #4). Sets `totalSents` on book object after DOM build |
| `splitSentences` | 3340 | Ebook | ⚠️ Two copies must stay in sync — worker copy inside _timingWorkerFn (~2766) |
| `parseTxt` / `parseMd` / `parseHtml` | 3359 | Ebook | |
| `extractFromDom` | 3381 | Ebook | ⚠️ Skips bare text nodes in divs — text with no block children silently dropped |
| `parseEpub` | 3403 | Ebook | |
| `extractEpubMeta` | 3440 | Ebook | Extracts `dc:title` and `dc:creator` from EPUB OPF metadata via regex. Loads JSZip if needed. Returns `{title, author}` or nulls on failure |
| `arrayBufferToBase64` | 3463 | Ebook | |
| `openModal` / `closeModal` | 3477 | Add Book Modal | |
| `resetModal` | 3480 | Add Book Modal | |
| `pillClick` | 3487 | Add Book Modal | Opens file picker for the clicked pill; skips if clear button was clicked |
| `folderChosen` | 3512 | Add Book Modal | |
| `folderAssign` | 3574 | Add Book Modal | |
| `addBook` | 3583 | Add Book Modal | ⚠️ Async — extracts EPUB metadata after reading ebook data. Uses extracted title only if current title matches auto-generated filename/folder name. Stores extracted author on book object |
| `openTranscriptModal` | 3645 | Transcript Modal | |
| `saveTranscript` / `removeTranscript` | 3674 | Transcript Modal | |
| `openLinkAudioModal` | 3697 | Link Audio Modal | |
| `saveLinkAudio` | 3718 | Link Audio Modal | ⚠️ Shows notx banner if no transcript after linking audio |
| `openEditBookModal` | 3739 | Edit Book Modal | Opens from library pencil icon; populates title, author, and file slots |
| `_renderEditBookSlots` | 3752 | Edit Book Modal | Builds binfo-slot rows; shows amber "needs relink" badge on audio slot when URL lost |
| `closeEditBookModal` | 3781 | Edit Book Modal | |
| `saveEditBook` | 3786 | Edit Book Modal | Saves title and author; persists to localStorage (browser) or PWA_PROG_KEY (PWA) |
| `editBookReassign` | 3809 | Edit Book Modal | Handles file replacement for audio/ebook/transcript/cover from library |
| `showRelink` / `closeRelink` | 3861 | Relink | ⚠️ `showRelink` checks dismiss flags before showing. `closeRelink` no longer resets `curBookIdx` |
| `rlDontRemind` / `rlDismissBook` / `rlDismissAll` / `rlDismissCancel` | 3872 | Relink | "Don't remind me" flow: per-book (`relinkDismissed`) or global (`verte_relink_dismissed_all` localStorage) |
| `rlLoad` | 3895 | Relink | |
| `pwaFolderChangeTap` | 3909 | PWA | ⚠️ Pre-pick warning only — pwaPickFolder commits immediately (see fragile #18) |
| `pwaPickFolder` | 3925 | PWA | |
| `pwaRegrantAccess` | 3934 | PWA | |
| `pwaScanAndRender` | 3947 | PWA | |
| `pwaScanBookFolder` | 4009 | PWA | |
| `getPwaProgress` / `savePwaProgress` | 4063 | PWA | |
| `pwaOpenBook` | 4073 | PWA | Sets `#pAuthor` from `b.author`. Extracts EPUB metadata on first open if `b.author` is null — updates title/author and persists to PWA progress |
| `showScreen` | 4143 | Screen Router | |
| `pwaCheckOnLaunch` | 4152 | Screen Router | |
| `__testBridge` | 4193 | Test Bridge | |
| `migrateFromFolio` | 4212 | Migration | ⚠️ Migrates localStorage keys (`folio_*` → `verte_*`) and IndexedDB (`folio_pwa` → `verte_pwa`). Must run before any storage reads. Uses `indexedDB.databases()` (not available in Safari — OK, targets web + Android only). Idempotent |
| `init` | 4270 | Init | Calls `await migrateFromFolio()` before `cacheDOM()` |

---

## IIFEs & Standalone Event Listeners

| Location | Line | Purpose |
|----------|------|---------|
| Scroll-pause detection | 2598 | Passive scroll listener on `#eScroll`, throttled via rAF. Sets `scrollPaused=true` for 2s |
| Auto-hide tap | 2648 | PWA only — `click` on `#eScroll` shows bars when hidden (single tap to reveal) |
| Close opts panel | 2658 | Click outside `#optPanel` closes it |
| SW registration + auto-reload | 4185 | Registers `sw.js`; `controllerchange` listener reloads page when new SW activates |
| Swipe gestures | 4172 | Touch-swipe left/right on `#eScroll` for skip |

---

## Data Structures

```
library[i] = {
  id, title, author,                     // author auto-populated from EPUB metadata if available
  audioUrl, audioName, audioExt,
  ebookData, ebookName, ebookType,
  transcriptData, transcriptName, transcriptType,  // 'whisper'|'txt'|null
  coverUrl, coverName,
  curSent, curWord, audioTime,
  wpm, sentPauseMs, playbackRate,
  syncOffset, totalSents,
  relinkDismissed,                        // true = don't show relink prompt for this book
  // PWA-only:
  audioHandle, ebookHandle, transcriptHandle, coverHandle,
  _unresolvedJsonCandidates,  // transient, never persisted
  hidden                      // PWA-only, stored in PWA_PROG_KEY
}

sentences[i] = {
  el: HTMLSpanElement,        // live DOM ref — STALE after innerHTML wipe
  words: [{el, text}, ...],
  text: string
}

sentenceTimings[i] = { start: number, end: number }  // sparse array (undefined for unmatched)
wordTimings[i] = { starts: Float64Array, count: number }  // sparse array
transcriptWords[i] = { word: string, start: number, end: number }
```

### Auto-Hide State (PWA only)

| Variable | Type | Purpose |
|----------|------|---------|
| `_barsVisible` | `boolean` | Whether top bar and bottom controls are currently visible (default `true`) |
| `_barIdleTimer` | `number\|null` | setTimeout ID for the 6-second auto-hide countdown; `null` when inactive |

---

## Storage Modes

- **Browser mode** (`!IS_PWA`): metadata in localStorage (`verte_library_v2`), blobs in IndexedDB
- **PWA mode** (`IS_PWA && CAN_FS`): files from disk via File System Access handles, progress in localStorage (`verte_pwa_progress_v1`)
- `saveBookProgress()` routes correctly for both — always use it, not `saveLibrary()` directly
- **Display prefs**: `verte_display_prefs_v1` (both modes) — includes `orientation` field (auto/portrait/landscape)
- **Relink dismiss (all books)**: `verte_relink_dismissed_all` in localStorage
- **Migration**: `migrateFromFolio()` runs once on first load after rebrand — copies all `folio_*` localStorage keys to `verte_*` and clones `folio_pwa` IndexedDB to `verte_pwa`, then deletes old entries

---

## Playback State Rules

- **Audio mode** (`ttsMode===false`): `<audio>` element drives playback, `sentenceTimings[]` drives highlighting, `_wordTick()` at rAF for word highlights
- **TTS mode** (`ttsMode===true`): `speechSynthesis` speaks sentences sequentially, no audio element involved
- TTS mode is toggled by the user via `toggleTtsMode()` (top bar mic button) — only available for ebook-only books (no audio linked)
- `ttsMode` defaults to `false` on book open; user must opt in
- When TTS is toggled on, sentence highlighting auto-enables; when toggled off, highlighting turns off
- When audiobook is linked, highlighting defaults to Sentence + Word mode
- **Playback start**: `mediaPlay()` calls `_audio.play()` but only acquires wake lock in `.then()`. All other state (icon, mediaState, ticker, media session) is set exclusively by the `play` event handler in `wireAudioEvents` — this ensures highlighting only starts when audio actually begins playing
- **Auto-hide bars (PWA only)**: On playback start (`play` event / `ttsPlay`), `resetBarTimer()` starts a 6-second countdown. On pause/stop/ended, `clearBarTimer()` cancels the countdown and shows bars. Control interactions (skip, seek, volume, speed, options, TOC, keyboard) call `resetBarTimer()` to reset the countdown. Single tap on `#eScroll` shows bars when hidden. Bars fully collapse (height:0) so the reading area expands

---

## UI Architecture

### Top Bar Layout (flat flex, space-between)
- Back chevron, TOC (hamburger), Title/Author/Progress (flex:1, centered), Sleep timer (moon, badge overlay), TTS toggle (mic, ebook-only, hidden by default), Settings (gear)
- Title/author/progress use `clamp()` for responsive font sizing
- **PWA auto-hide**: Collapses via `height:0 + opacity:0 + pointer-events:none` when `#player` has `bars-hidden` class. Reading area expands to fill freed space

### Bottom Controls
- Volume popover (tap icon to open vertical slider, tap outside to close)
- 4 skip buttons: big-skip-back (1m/5 sentences), skip-back (15s/1 sentence), skip-forward, big-skip-forward
- Play/pause button centered between skip buttons
- Speed pill (tap to cycle RATE_STEPS)
- Skip button icons swap dynamically via `_updateSkipBtns()` — circular-arrow+15 for audio, chevrons for TTS
- Bottom bar hidden for ebook-only books until TTS is toggled on
- Seek strip shown only in audio mode
- Time display uses H:MM:SS format for audiobooks ≥1 hour
- **PWA auto-hide**: Same `bars-hidden` collapse mechanism as top bar

### Display Options
- Theme, Font, Reading (font size, line height, width, alignment) sections
- **Orientation lock** (`#orientSec`): Auto / Portrait / Landscape pills — PWA only, hidden in browser mode. Uses `screen.orientation.lock()`; silently fails on iOS. Persisted in display prefs

### Library Settings
- Gear icon in top-right of library header toggles `#libSettingsPanel`
- Placeholder panel — content TBD

### Add Book Modal
- File pills show accepted file types below filename (`.fp-types` hint line)
- Audio: mp3, m4a, m4b, ogg, wav, aac, flac, opus
- Ebook: epub, txt, html, htm, md, xhtml
- Transcript: json, txt
- Cover: jpg, jpeg, png, webp, gif, avif

### Edit Book Details
- Opened from library card pencil icon (replaces old inline rename)
- Title input, author input (optional), file slots (binfo-slot style)
- File slots clickable in browser mode, read-only in PWA mode
- Audio slot shows amber "needs relink" badge when blob URL lost

### Relink Dismiss
- "Don't remind me" button on relink overlay → choice of "This book" / "All books" / Cancel
- Per-book: `b.relinkDismissed = true` (persisted in library)
- Global: `verte_relink_dismissed_all` localStorage flag
- `showRelink()` checks both flags before displaying
