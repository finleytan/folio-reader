# Folio — Function Index & Context

## File Layout

| Zone | Lines | Contents |
|------|-------|----------|
| CSS | 16–553 | All styles |
| HTML | 555–978 | 4 screens + 4 modals |
| JS | 978–4142 | All logic |

### HTML Structure

| Element | Purpose |
|---------|---------|
| `#toastContainer` | Toast mount point |
| `#installBanner` | PWA install prompt |
| `#pwaFirstRun` | First-run folder picker screen |
| `#pwaRegrant` | Re-grant permissions screen |
| `#library` | Library screen: header (with settings gear) + `#libSettingsPanel` + `#libGrid` card grid |
| `#player` | Player screen (audio, top bar, options, transcript banner, reader body, bottom controls) |
| `#bottomControls` | Bottom controls bar: seek strip + play/skip/vol/speed ctrl-row (hidden when ebook-only and TTS off) |
| `#modal` | Add Book modal (Audio, Ebook, Transcript, Cover pills — clickable to pick individual files; each pill shows accepted file types) |
| `#txModal` | Transcript modal (add/replace transcript) |
| `#linkAudioModal` | Link Audio modal (add audio to ebook-only book) |
| `#editBookModal` | Edit Book Details modal (title, author, file slots — opened from library pencil icon) |
| `#relinkOverlay` | Relink audio overlay (expired audio URL); auto-shown on book open unless dismissed |

---

## Function Index

| Function | Line | Area | Notes |
|----------|------|------|-------|
| `showSyncHintOnce` | 1032 | Toast | One-time hint after first transcript sync |
| `showToast` | 1038 | Toast | |
| `acquireWakeLock` | 1055 | Wake Lock | |
| `setupMediaSession` | 1111 | Media Session | |
| `saveBookProgressDebounced` | 1139 | Save | |
| `updatePageTitle` | 1147 | Page Title | |
| `cycleSleepTimer` | 1163 | Sleep Timer | |
| `_openModalEl` / `_closeModalRestore` | 1203 | Modal Helpers | |
| `cacheDOM` | 1319 | DOM Cache | |
| `setPlayBtnIcon` | 1333 | DOM Cache | |
| `xh` / `fmt` / `uid` | 1337 | Utility | `fmt` formats seconds as M:SS or H:MM:SS for durations ≥1 hour |
| `idbOpen` / `idbSet` / `idbGet` | 1345 | IndexedDB | |
| `saveLibrary` | 1385 | Library Persistence | |
| `loadLibrary` | 1430 | Library Persistence | |
| `saveBookProgress` | 1466 | Library Persistence | ⚠️ Call this not saveLibrary() from playback code |
| `flushPositionSync` | 1480 | Library Persistence | |
| `saveDisplayPrefs` | 1522 | Display Prefs | |
| `loadDisplayPrefs` | 1537 | Display Prefs | |
| `toggleLibSettings` | 1586 | Library UI | Toggles `#libSettingsPanel` visibility |
| `renderLib` | 1590 | Library UI | Shows onboarding card when library is empty (browser mode); pencil icon opens Edit Book modal |
| `unhideBook` | 1693 | Library UI | |
| `renameBook` | 1706 | Library UI | ⚠️ Remove blur listener before Enter/Escape to prevent double-fire |
| `deleteBook` | 1740 | Library UI | |
| `configurePlayerForMode` | 1788 | Player Config | ⚠️ Owns _audio.src — do not assign src before calling this. Defaults highlighting (off for TTS, word for audio). Calls `_updateSkipBtns()`. `loadedmetadata` handler seeks to `b.audioTime` or falls back to `b.curSent` position |
| `toggleTtsMode` | 1819 | Player Config | Toggles TTS on/off for ebook-only books; auto-enables sentence HL on, disables HL on off. Calls `_updateSkipBtns()` |
| `openBook` | 1835 | Open/Close | ⚠️ Auto-shows relink overlay if `audioName` set but `audioUrl` lost (unless dismissed). Sets `#pAuthor` from `b.author` |
| `pulseResumeSent` | 1853 | Open/Close | |
| `goLib` | 1862 | Open/Close | ⚠️ Must clear sentences[], tocEntries[], sentenceTimings[] — already does |
| `seekAudioToSentence` | 1887 | Media Controls | ⚠️ Sparse sentenceTimings — linear scan only, not binary search. Defers seek via `loadedmetadata` listener if audio not ready (`readyState < 1`) |
| `setMediaState` | 1897 | Media Controls | |
| `togglePlay` | 1900 | Media Controls | ⚠️ Shows toast if no audio and TTS off |
| `mediaPlay` / `mediaPause` / `mediaStop` | 1905 | Media Controls | ⚠️ `mediaPlay` only acquires wake lock in `.then()` — all playback state (icon, mediaState, ticker) is set by the `play` event handler in `wireAudioEvents`, not here |
| `_updateSkipBtns` | 1936 | Media Controls | Swaps skip button icons/labels: circular-arrow+15 for audio, chevrons for TTS; also handles big-skip (1m / 5 sentences) |
| `skip` | 1951 | Media Controls | In TTS mode: ±1 sentence (15s) or ±5 sentences (60s). In audio mode: seeks by seconds |
| `changeSpeed` | 1956 | Media Controls | |
| `cycleSpeed` | 1962 | Media Controls | Tap-to-cycle through RATE_STEPS; reads from `rateCustom` in TTS mode |
| `setRate` | 1968 | Media Controls | |
| `setVol` / `setVolBoth` / `toggleMute` | 2005 | Media Controls | |
| `toggleVolPop` | 2021 | Media Controls | Opens/closes volume popover; closes on outside tap |
| `onSeekInput` | 2034 | Media Controls | |
| `onSeekChange` | 2035 | Media Controls | ⚠️ Sparse sentenceTimings — linear scan only, not binary search |
| `_wordTick` | 2057 | Audio Events | ⚠️ curWord=-1 sentinel prevents word-0 flash — do not change to 0 |
| `startWordTicker` / `stopWordTicker` | 2081 | Audio Events | |
| `wireAudioEvents` | 2085 | Audio Events | ⚠️ timeupdate self-heal for Samsung audio-focus steal — do not remove. `play` event is the single source of truth for playback state (icon, mediaState, ticker, wake lock) |
| `startScrollEngine` | 2148 | Scroll Engine | ⚠️ scrollTimer separate from _scrollPauseTimer — do not merge |
| `stopScrollEngine` | 2153 | Scroll Engine | |
| `advanceSent` | 2156 | Scroll Engine | |
| `nudge` | 2170 | Scroll Engine | In TTS mode while playing: calls `ttsStop(); ttsPlay()` to restart from new sentence |
| `resync` | 2177 | Scroll Engine | |
| `adjustOffset` / `updateOffsetUI` | 2187 | Sync Offset | |
| `getTtsVoices` | 2201 | TTS | |
| `setTtsVoice` / `setTtsRate` | 2216 | TTS | |
| `ttsPlay` | 2226 | TTS | ⚠️ ttsSpeaking owned here — stopScrollEngine must never set it. Reads rate from `rateCustom` input |
| `ttsPause` / `ttsStop` | 2276 | TTS | |
| `scrubToPosition` | 2287 | TTS | |
| `updateHL` | 2308 | Highlighting | ⚠️ sentences[] holds live DOM refs — stale after any #eContent innerHTML wipe |
| `updateProg` | 2320 | Highlighting | Guards null `_readProg` (progress bar removed from DOM) |
| `_cacheScrollMetrics` | 2332 | Highlighting | |
| `scrollToSent` | 2339 | Highlighting | |
| `toggleAS` | 2352 | Highlighting | |
| `toggleWordHl` / `toggleSentHl` | 2356 | Highlighting | |
| `_resyncAndHL` | 2375 | Highlighting | ⚠️ Sparse sentenceTimings — linear scan only, not binary search |
| `_syncHlPills` | 2390 | Highlighting | |
| `setHighlightMode` | 2396 | Highlighting | ⚠️ Updates notx banner reactively — shows/hides based on sentHlOn + ttsMode + transcript state |
| `toggleToc` | 2426 | TOC | |
| `buildToc` | 2431 | TOC | |
| `updateTocActive` | 2480 | TOC | |
| `toggleOpts` / `switchOptTab` | 2492 | Options | |
| `setTheme` | 2501 | Options | ⚠️ Wipes body.className — loses is-pwa class until reload (known issue #22) |
| `updateThemeColor` | 2508 | Options | |
| `setFont` | 2512 | Options | |
| `setFS` / `setLH` / `setMW` | 2529 | Options | |
| `setAlign` | 2532 | Options | |
| `setSentPause` / `toggleOpInfo` | 2544 | Options | |
| `loadTranscriptData` | 2577 | Transcript | ⚠️ Shows notx banner if no transcript + audio + sentHlOn + !ttsMode |
| `setBannerState` | 2631 | Transcript | ⚠️ notx state has separate HTML elements (txBannerTop/txBannerActions) from other states. Supports `warn` state (amber, 20s auto-hide) for low match % |
| `_timingWorkerFn` | 2673 | Transcript | ⚠️ Two copies of splitSentences + matching logic — worker copy must stay in sync (~2673) |
| `getTimingWorker` | 2851 | Transcript | ⚠️ Worker `onmessage` calls `seekAudioToSentence()` (if audio at 0 + curSent > 0) or `_resyncAndHL()` after timings built |
| `buildSentenceTimings` | 2893 | Transcript | ⚠️ Sparse sentenceTimings — linear scan only, not binary search. Posts to worker and returns before timings exist — resync happens in worker onmessage |
| `buildTimingsFromPlainText` | 2927 | Transcript | |
| `_buildSentenceTimingsSync` | 2960 | Transcript | Calls `seekAudioToSentence()` or `_resyncAndHL()` after timings built |
| `_buildTimingsFromPlainTextSync` | 3090 | Transcript | Calls `seekAudioToSentence()` or `_resyncAndHL()` after timings built |
| `similarity` / `updateTranscriptUI` | 3122 | Transcript | |
| `yieldToMain` | 3137 | Ebook | |
| `loadEbook` | 3143 | Ebook | ⚠️ No cancellation guard — race possible on rapid book switch (see folio-fragile.md #4). Sets `totalSents` on book object after DOM build |
| `splitSentences` | 3247 | Ebook | ⚠️ Two copies must stay in sync — worker copy inside _timingWorkerFn (~2673) |
| `parseTxt` / `parseMd` / `parseHtml` | 3266 | Ebook | |
| `extractFromDom` | 3288 | Ebook | ⚠️ Skips bare text nodes in divs — text with no block children silently dropped |
| `parseEpub` | 3310 | Ebook | |
| `extractEpubMeta` | 3347 | Ebook | Extracts `dc:title` and `dc:creator` from EPUB OPF metadata via regex. Loads JSZip if needed. Returns `{title, author}` or nulls on failure |
| `arrayBufferToBase64` | 3370 | Ebook | |
| `openModal` / `closeModal` | 3384 | Add Book Modal | |
| `resetModal` | 3387 | Add Book Modal | |
| `pillClick` | 3394 | Add Book Modal | Opens file picker for the clicked pill; skips if clear button was clicked |
| `folderChosen` | 3419 | Add Book Modal | |
| `folderAssign` | 3481 | Add Book Modal | |
| `addBook` | 3490 | Add Book Modal | ⚠️ Async — extracts EPUB metadata after reading ebook data. Uses extracted title only if current title matches auto-generated filename/folder name. Stores extracted author on book object |
| `openTranscriptModal` | 3552 | Transcript Modal | |
| `saveTranscript` / `removeTranscript` | 3581 | Transcript Modal | |
| `openLinkAudioModal` | 3604 | Link Audio Modal | |
| `saveLinkAudio` | 3625 | Link Audio Modal | ⚠️ Shows notx banner if no transcript after linking audio |
| `openEditBookModal` | 3646 | Edit Book Modal | Opens from library pencil icon; populates title, author, and file slots |
| `_renderEditBookSlots` | 3659 | Edit Book Modal | Builds binfo-slot rows; shows amber "needs relink" badge on audio slot when URL lost |
| `closeEditBookModal` | 3688 | Edit Book Modal | |
| `saveEditBook` | 3693 | Edit Book Modal | Saves title and author; persists to localStorage (browser) or PWA_PROG_KEY (PWA) |
| `editBookReassign` | 3716 | Edit Book Modal | Handles file replacement for audio/ebook/transcript/cover from library |
| `showRelink` / `closeRelink` | 3768 | Relink | ⚠️ `showRelink` checks dismiss flags before showing. `closeRelink` no longer resets `curBookIdx` |
| `rlDontRemind` / `rlDismissBook` / `rlDismissAll` / `rlDismissCancel` | 3779 | Relink | "Don't remind me" flow: per-book (`relinkDismissed`) or global (`folio_relink_dismissed_all` localStorage) |
| `rlLoad` | 3802 | Relink | |
| `pwaFolderChangeTap` | 3816 | PWA | ⚠️ Pre-pick warning only — pwaPickFolder commits immediately (see fragile #18) |
| `pwaPickFolder` | 3832 | PWA | |
| `pwaRegrantAccess` | 3841 | PWA | |
| `pwaScanAndRender` | 3854 | PWA | |
| `pwaScanBookFolder` | 3916 | PWA | |
| `getPwaProgress` / `savePwaProgress` | 3970 | PWA | |
| `pwaOpenBook` | 3980 | PWA | Sets `#pAuthor` from `b.author`. Extracts EPUB metadata on first open if `b.author` is null — updates title/author and persists to PWA progress |
| `showScreen` | 4050 | Screen Router | |
| `pwaCheckOnLaunch` | 4059 | Screen Router | |
| `__testBridge` | 4099 | Test Bridge | |
| `init` | 4116 | Init | |

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

---

## Storage Modes

- **Browser mode** (`!IS_PWA`): metadata in localStorage (`folio_library_v2`), blobs in IndexedDB
- **PWA mode** (`IS_PWA && CAN_FS`): files from disk via File System Access handles, progress in localStorage (`folio_pwa_progress_v1`)
- `saveBookProgress()` routes correctly for both — always use it, not `saveLibrary()` directly
- **Display prefs**: `folio_display_prefs_v1` (both modes)
- **Relink dismiss (all books)**: `folio_relink_dismissed_all` in localStorage

---

## Playback State Rules

- **Audio mode** (`ttsMode===false`): `<audio>` element drives playback, `sentenceTimings[]` drives highlighting, `_wordTick()` at rAF for word highlights
- **TTS mode** (`ttsMode===true`): `speechSynthesis` speaks sentences sequentially, no audio element involved
- TTS mode is toggled by the user via `toggleTtsMode()` (top bar mic button) — only available for ebook-only books (no audio linked)
- `ttsMode` defaults to `false` on book open; user must opt in
- When TTS is toggled on, sentence highlighting auto-enables; when toggled off, highlighting turns off
- When audiobook is linked, highlighting defaults to Sentence + Word mode
- **Playback start**: `mediaPlay()` calls `_audio.play()` but only acquires wake lock in `.then()`. All other state (icon, mediaState, ticker, media session) is set exclusively by the `play` event handler in `wireAudioEvents` — this ensures highlighting only starts when audio actually begins playing

---

## UI Architecture

### Top Bar Layout (flat flex, space-between)
- Back chevron, TOC (hamburger), Title/Author/Progress (flex:1, centered), Sleep timer (moon, badge overlay), TTS toggle (mic, ebook-only, hidden by default), Settings (gear)
- Title/author/progress use `clamp()` for responsive font sizing

### Bottom Controls
- Volume popover (tap icon to open vertical slider, tap outside to close)
- 4 skip buttons: big-skip-back (1m/5 sentences), skip-back (15s/1 sentence), skip-forward, big-skip-forward
- Play/pause button centered between skip buttons
- Speed pill (tap to cycle RATE_STEPS)
- Skip button icons swap dynamically via `_updateSkipBtns()` — circular-arrow+15 for audio, chevrons for TTS
- Bottom bar hidden for ebook-only books until TTS is toggled on
- Seek strip shown only in audio mode
- Time display uses H:MM:SS format for audiobooks ≥1 hour

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
- Global: `folio_relink_dismissed_all` localStorage flag
- `showRelink()` checks both flags before displaying
