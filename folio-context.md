# Folio — Function Index & Context

## File Layout

| Zone | Lines | Contents |
|------|-------|----------|
| CSS | 16–542 | All styles |
| HTML | 544–933 | 4 screens + 5 modals |
| JS | 935–3961 | All logic |

### HTML Structure

| Element | Purpose |
|---------|---------|
| `#toastContainer` | Toast mount point |
| `#installBanner` | PWA install prompt |
| `#pwaFirstRun` | First-run folder picker screen |
| `#pwaRegrant` | Re-grant permissions screen |
| `#library` | Library screen: header + `#libGrid` card grid |
| `#player` | Player screen (audio, top bar, options, transcript banner, reader body, bottom controls) |
| `#bottomControls` | Bottom controls bar: seek strip + play/skip/vol/speed ctrl-row (hidden when ebook-only and TTS off) |
| `#modal` | Add Book modal (Audio, Ebook, Transcript, Cover pills) |
| `#txModal` | Transcript modal (add/replace transcript) |
| `#linkAudioModal` | Link Audio modal (add audio to ebook-only book) |
| `#bookInfoModal` | Book Info modal (view/reassign files); amber dot indicator when audio needs relink |
| `#relinkOverlay` | Relink audio overlay (expired audio URL); auto-shown on book open when audio needs relink |

---

## Function Index

| Function | Line | Area | Notes |
|----------|------|------|-------|
| `showSyncHintOnce` | 989 | Toast | One-time hint after first transcript sync |
| `showToast` | 995 | Toast | |
| `acquireWakeLock` | 1012 | Wake Lock | |
| `setupMediaSession` | 1068 | Media Session | |
| `saveBookProgressDebounced` | 1096 | Save | |
| `updatePageTitle` | 1104 | Page Title | |
| `cycleSleepTimer` | 1120 | Sleep Timer | |
| `_openModalEl` / `_closeModalRestore` | 1160 | Modal Helpers | |
| `cacheDOM` | 1276 | DOM Cache | |
| `setPlayBtnIcon` | 1290 | DOM Cache | |
| `idbOpen` / `idbSet` / `idbGet` | 1302 | IndexedDB | |
| `saveLibrary` | 1342 | Library Persistence | |
| `loadLibrary` | 1387 | Library Persistence | |
| `saveBookProgress` | 1423 | Library Persistence | ⚠️ Call this not saveLibrary() from playback code |
| `flushPositionSync` | 1437 | Library Persistence | |
| `saveDisplayPrefs` | 1479 | Display Prefs | |
| `loadDisplayPrefs` | 1494 | Display Prefs | |
| `renderLib` | 1543 | Library UI | Shows onboarding card when library is empty (browser mode) |
| `unhideBook` | 1645 | Library UI | |
| `renameBook` | 1658 | Library UI | ⚠️ Remove blur listener before Enter/Escape to prevent double-fire |
| `deleteBook` | 1692 | Library UI | |
| `configurePlayerForMode` | 1740 | Player Config | ⚠️ Owns _audio.src — do not assign src before calling this. Also sets `needsRelink` indicator and defaults highlighting (off for TTS, word for audio) |
| `toggleTtsMode` | 1769 | Player Config | Toggles TTS on/off for ebook-only books; auto-enables sentence HL on, disables HL on off |
| `openBook` | 1784 | Open/Close | ⚠️ Auto-shows relink overlay if `audioName` set but `audioUrl` lost |
| `pulseResumeSent` | 1801 | Open/Close | |
| `goLib` | 1810 | Open/Close | ⚠️ Must clear sentences[], tocEntries[], sentenceTimings[] — already does |
| `seekAudioToSentence` | 1835 | Media Controls | ⚠️ Sparse sentenceTimings — linear scan only, not binary search |
| `setMediaState` | 1842 | Media Controls | |
| `togglePlay` | 1845 | Media Controls | ⚠️ Shows toast if no audio and TTS off |
| `mediaPlay` / `mediaPause` / `mediaStop` | 1850 | Media Controls | |
| `skip` | 1885 | Media Controls | |
| `changeSpeed` | 1890 | Media Controls | |
| `cycleSpeed` | 1896 | Media Controls | Tap-to-cycle through RATE_STEPS; reads from `rateCustom` in TTS mode |
| `setRate` | 1902 | Media Controls | |
| `setVol` / `setVolBoth` / `toggleMute` | 1939 | Media Controls | |
| `toggleVolPop` | 1955 | Media Controls | Opens/closes volume popover; closes on outside tap |
| `onSeekInput` | 1968 | Media Controls | |
| `onSeekChange` | 1969 | Media Controls | ⚠️ Sparse sentenceTimings — linear scan only, not binary search |
| `_wordTick` | 1991 | Audio Events | ⚠️ curWord=-1 sentinel prevents word-0 flash — do not change to 0 |
| `startWordTicker` / `stopWordTicker` | 2015 | Audio Events | |
| `wireAudioEvents` | 2019 | Audio Events | ⚠️ timeupdate self-heal for Samsung audio-focus steal — do not remove |
| `startScrollEngine` | 2082 | Scroll Engine | ⚠️ scrollTimer separate from _scrollPauseTimer — do not merge |
| `stopScrollEngine` | 2087 | Scroll Engine | |
| `advanceSent` | 2090 | Scroll Engine | |
| `nudge` | 2104 | Scroll Engine | |
| `resync` | 2111 | Scroll Engine | |
| `adjustOffset` / `updateOffsetUI` | 2121 | Sync Offset | |
| `getTtsVoices` | 2135 | TTS | |
| `setTtsVoice` / `setTtsRate` | 2150 | TTS | |
| `ttsPlay` | 2160 | TTS | ⚠️ ttsSpeaking owned here — stopScrollEngine must never set it. Reads rate from `rateCustom` input |
| `ttsPause` / `ttsStop` | 2210 | TTS | |
| `scrubToPosition` | 2221 | TTS | |
| `updateHL` | 2242 | Highlighting | ⚠️ sentences[] holds live DOM refs — stale after any #eContent innerHTML wipe |
| `updateProg` | 2254 | Highlighting | Guards null `_readProg` (progress bar removed from DOM) |
| `_cacheScrollMetrics` | 2266 | Highlighting | |
| `scrollToSent` | 2273 | Highlighting | |
| `toggleAS` | 2286 | Highlighting | |
| `toggleWordHl` / `toggleSentHl` | 2290 | Highlighting | |
| `_resyncAndHL` | 2309 | Highlighting | ⚠️ Sparse sentenceTimings — linear scan only, not binary search |
| `_syncHlPills` | 2324 | Highlighting | |
| `setHighlightMode` | 2330 | Highlighting | ⚠️ Updates notx banner reactively — shows/hides based on sentHlOn + ttsMode + transcript state |
| `toggleToc` | 2360 | TOC | |
| `buildToc` | 2365 | TOC | |
| `updateTocActive` | 2414 | TOC | |
| `toggleOpts` / `switchOptTab` | 2426 | Options | |
| `setTheme` | 2435 | Options | ⚠️ Wipes body.className — loses is-pwa class until reload (known issue #22) |
| `updateThemeColor` | 2442 | Options | |
| `setFont` | 2446 | Options | |
| `setFS` / `setLH` / `setMW` | 2463 | Options | |
| `setAlign` | 2466 | Options | |
| `setSentPause` / `toggleOpInfo` | 2478 | Options | |
| `loadTranscriptData` | 2511 | Transcript | ⚠️ Shows notx banner if no transcript + audio + sentHlOn + !ttsMode |
| `setBannerState` | 2565 | Transcript | ⚠️ notx state has separate HTML elements (txBannerTop/txBannerActions) from other states |
| `_timingWorkerFn` | 2607 | Transcript | ⚠️ Two copies of splitSentences + matching logic — worker copy must stay in sync (~2607) |
| `getTimingWorker` | 2785 | Transcript | |
| `buildSentenceTimings` | 2823 | Transcript | ⚠️ Sparse sentenceTimings — linear scan only, not binary search |
| `buildTimingsFromPlainText` | 2857 | Transcript | |
| `_buildSentenceTimingsSync` | 2890 | Transcript | |
| `_buildTimingsFromPlainTextSync` | 3016 | Transcript | |
| `similarity` / `updateTranscriptUI` | 3044 | Transcript | |
| `yieldToMain` | 3059 | Ebook | |
| `loadEbook` | 3065 | Ebook | ⚠️ No cancellation guard — race possible on rapid book switch (see folio-fragile.md #4) |
| `splitSentences` | 3168 | Ebook | ⚠️ Two copies must stay in sync — worker copy inside _timingWorkerFn (~2607) |
| `parseTxt` / `parseMd` / `parseHtml` | 3187 | Ebook | |
| `extractFromDom` | 3209 | Ebook | ⚠️ Skips bare text nodes in divs — text with no block children silently dropped |
| `parseEpub` | 3231 | Ebook | |
| `arrayBufferToBase64` | 3269 | Ebook | |
| `openModal` / `closeModal` | 3283 | Add Book Modal | |
| `resetModal` | 3286 | Add Book Modal | |
| `folderChosen` | 3317 | Add Book Modal | |
| `folderAssign` | 3379 | Add Book Modal | |
| `addBook` | 3388 | Add Book Modal | |
| `openTranscriptModal` | 3435 | Transcript Modal | |
| `saveTranscript` / `removeTranscript` | 3464 | Transcript Modal | |
| `openLinkAudioModal` | 3487 | Link Audio Modal | |
| `saveLinkAudio` | 3508 | Link Audio Modal | ⚠️ Shows notx banner if no transcript after linking audio. Clears needs-relink indicator |
| `openBookInfoModal` / `closeBookInfoModal` | 3529 | Book Info Modal | |
| `biReassign` | 3562 | Book Info Modal | ⚠️ Do not pre-set _audio.src before configurePlayerForMode. Clears needs-relink indicator |
| `showRelink` / `closeRelink` / `rlLoad` | 3619 | Relink | ⚠️ `closeRelink` no longer resets `curBookIdx` — book stays open underneath |
| `pwaFolderChangeTap` | 3646 | PWA | ⚠️ Pre-pick warning only — pwaPickFolder commits immediately (see fragile #18) |
| `pwaPickFolder` | 3662 | PWA | |
| `pwaRegrantAccess` | 3671 | PWA | |
| `pwaScanAndRender` | 3684 | PWA | |
| `pwaScanBookFolder` | 3746 | PWA | |
| `getPwaProgress` / `savePwaProgress` | 3800 | PWA | |
| `pwaOpenBook` | 3810 | PWA | |
| `showScreen` | 3867 | Screen Router | |
| `pwaCheckOnLaunch` | 3876 | Screen Router | |
| `__testBridge` | 3916 | Test Bridge | |
| `init` | 3933 | Init | |

---

## Data Structures

```
library[i] = {
  id, title,
  audioUrl, audioName, audioExt,
  ebookData, ebookName, ebookType,
  transcriptData, transcriptName, transcriptType,  // 'whisper'|'txt'|null
  coverUrl, coverName,
  curSent, curWord, audioTime,
  wpm, sentPauseMs, playbackRate,
  syncOffset, totalSents,
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

---

## Storage Modes

- **Browser mode** (`!IS_PWA`): metadata in localStorage (`folio_library_v2`), blobs in IndexedDB
- **PWA mode** (`IS_PWA && CAN_FS`): files from disk via File System Access handles, progress in localStorage (`folio_pwa_progress_v1`)
- `saveBookProgress()` routes correctly for both — always use it, not `saveLibrary()` directly
- **Display prefs**: `folio_display_prefs_v1` (both modes)

---

## Playback State Rules

- **Audio mode** (`ttsMode===false`): `<audio>` element drives playback, `sentenceTimings[]` drives highlighting, `_wordTick()` at rAF for word highlights
- **TTS mode** (`ttsMode===true`): `speechSynthesis` speaks sentences sequentially, no audio element involved
- TTS mode is toggled by the user via `toggleTtsMode()` (top bar mic button) — only available for ebook-only books (no audio linked)
- `ttsMode` defaults to `false` on book open; user must opt in
- When TTS is toggled on, sentence highlighting auto-enables; when toggled off, highlighting turns off
- When audiobook is linked, highlighting defaults to Sentence + Word mode

---

## UI Architecture

### Top Bar Icons (SVG)
- Back chevron, TOC (hamburger), TTS toggle (mic, ebook-only), divider, Book files (folder, amber dot if needs relink), Settings (gear), Sleep timer (moon, badge overlay)

### Bottom Controls
- Volume popover (tap icon to open vertical slider, tap outside to close)
- Skip back/forward, Play/pause, Speed pill (tap to cycle RATE_STEPS)
- Bottom bar hidden for ebook-only books until TTS is toggled on
- Seek strip shown only in audio mode

### Needs-Relink Detection
- `audioName && !audioUrl && !audioHandle` = book had audio but blob URL lost on refresh
- Amber dot on `#bookInfoBtn` via `.needs-relink` CSS class
- Relink overlay auto-shown on `openBook()` when detected
- Indicator cleared in `saveLinkAudio`, `rlLoad`, `biReassign`
