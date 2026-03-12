

# Folio — Living Context Document

Single-file HTML PWA (~2,980 lines). Audiobook/ebook reader with synced word-level highlighting.
Dark-theme mobile-first. Fonts: DM Sans (UI), Lora (body). Three themes: default dark, light, night.

---

## File Layout (line ranges)

| Range | Zone |
|---|---|
| 1–10 | `<head>`, meta, manifest, font import |
| 11–505 | `<style>` — all CSS |
| 506–921 | `<body>` — static HTML (screens, modals, overlays) |
| 922–2981 | `<script>` — all JS |

### CSS Sections (inside `<style>`, lines 11–505)

| Lines | Section | What it styles |
|---|---|---|
| 12–20 | `:root` | CSS custom properties (colors, fonts, spacing) |
| 24–35 | Themes | `.theme-light`, `.theme-night` variable overrides |
| 36–41 | Screens | `#pwaFirstRun`, `#pwaRegrant`, `#library`, `#player` |
| 42–97 | Library | `.lib-header`, `.lib-grid`, `.book-card`, `.add-card`, `.book-cover-*` |
| 98–147 | Modals | `.modal-overlay`, `.modal`, `.dropzone`, `.file-pill`, `.binfo-*` |
| 148–165 | Buttons | `.btn`, `.pill`, `.ipill`, `.toggle` |
| 166–179 | Top bar | `.top-bar`, `.back-btn`, `.bk-info`, `.ic-btn`, `.play-btn` |
| 180–200 | Options panel | `.opt-panel`, `.op-tab`, `.op-row`, `.op-slider` |
| 201–221 | Seek strip | `.seek-strip`, `.seek-strip-bar`, `.rate-preset-btn`, `.vol-*` |
| 222–224 | TTS bar | `.tts-bar` |
| 225–243 | Transcript banner | `.tx-banner` (loading/syncing/ready/error), `.tx-spinner`, shimmer keyframes |
| 244–248 | `.ebook-area`, Reading progress | `.read-progress-wrap`, `.read-progress-bar` |
| 249–279 | Reader body | `.reader-body`, `.toc-sidebar`, `.toc-item`, `.ebook-scroll`, `.ebook-content`, `.sent`, `.word` |
| 280–317 | Bottom bar | `.bottom-bar`, `.bb-row`, `.state-badge`, `.m-btn`, `.nudge-btn`, `.wpm-*`, `.sync-*` |
| 318–326 | Relink overlay | `.relink-overlay`, `.relink-sheet` |
| 327–344 | PWA screens | `.pwa-setup-card`, `.pwa-regrant-card` |
| 345–424 | Media queries | `@media(min-width:640px)` desktop, `@media(max-width:639px)` mobile |
| 425–505 | Misc | Theme transitions, button feedback, toasts, inline delete confirm, sleep badge, install banner, backdrop-filter |

### HTML Structure (lines 506–921)

| Lines | Element | Purpose |
|---|---|---|
| 509 | `#toastContainer` | Toast notification mount point |
| 510–518 | `#installBanner` | PWA install prompt banner |
| 521–541 | `#pwaFirstRun` | First-run screen: folder picker setup |
| 542–555 | `#pwaRegrant` | Re-grant permissions screen |
| 556–563 | `#library` | Library screen: header + `#libGrid` card grid |
| 566–777 | `#player` | **Main player screen** (see breakdown below) |
| 780–837 | `#modal` | Add Book modal (dropzone, file pills, folder assign) |
| 839–862 | `#txModal` | Transcript modal (add/replace transcript) |
| 864–887 | `#linkAudioModal` | Link Audio modal (add audio to ebook-only book) |
| 888–905 | `#bookInfoModal` | Book Info modal (view/reassign files) |
| 906–920 | `#relinkOverlay` | Relink audio overlay (handle expired audio URL) |

**Player screen breakdown (`#player`, lines 566–777):**

| Lines | Element | Role |
|---|---|---|
| 567 | `<audio id="audio">` | Hidden audio element |
| 568–588 | `.top-bar` | Back button, title (`#pTitle`), progress text (`#pProg`), play button (`#playBtn`), option/TOC/transcript buttons |
| 589–657 | `#optPanel` | Flyout options: 3 tabs (Playback, Display, Advanced) with sliders/toggles |
| 658–683 | `#seekStrip` | Audio seek bar, time labels, rate presets, volume (hidden in TTS mode) |
| 685–701 | `#ttsBar` | TTS voice picker, rate slider (shown in TTS mode) |
| 702–709 | `#txBanner` | Transcript status banner (loading/syncing/ready/error) |
| 710 | `.read-progress-wrap` | Sentence-based reading progress bar (`#readProg`) |
| 711–727 | `.reader-body` | TOC sidebar (`#tocSidebar` + `#tocList`) and ebook scroll area (`#eScroll` > `#eContent`) |
| 728–777 | `.bottom-bar` | State badge, play/pause/stop/skip/nudge buttons, WPM controls, auto-scroll toggle, sync panel |

### JavaScript Sections (lines 922–2981)

| Lines | Section | Key functions |
|---|---|---|
| 925–954 | **STATE** | All global variable declarations and constants |
| 959–970 | **TOAST** | `showToast(msg, type, duration)` |
| 976–990 | **WAKE LOCK** | `acquireWakeLock()`, `releaseWakeLock()`, visibilitychange re-acquire |
| 995–1016 | **MEDIA SESSION** | `setupMediaSession()`, `updateMediaSessionState(playing)` |
| 1023–1026 | **DEBOUNCED SAVE** | `saveBookProgressDebounced()` — 500ms timer |
| 1031–1036 | **PAGE TITLE** | `updatePageTitle()` |
| 1040–1078 | **SLEEP TIMER** | `cycleSleepTimer()`, `clearSleepTimer()`, `_updateSleepBadge()` |
| 1084–1129 | **KEYBOARD SHORTCUTS** | `keydown` listener: Space, arrows, `[`/`]`, `f`, `m` |
| 1135–1157 | **PWA INSTALL** | `installPWA()`, `dismissInstall()`, `beforeinstallprompt` handler |
| 1160–1182 | **DOM CACHE & UTILS** | `$()`, `cacheDOM()`, `setPlayBtnIcon()`, `xh()`, `fmt()`, `uid()` |
| 1187–1215 | **INDEXEDDB** | `idbOpen()`, `idbSet(key,val)`, `idbGet(key)` |
| 1220–1353 | **LIBRARY PERSISTENCE** | `saveLibrary()`, `loadLibrary()`, `saveBookProgress()`, `flushPositionSync()`, blob save/load helpers |
| 1358–1393 | **DISPLAY PREFERENCES** | `saveDisplayPrefs()`, `loadDisplayPrefs()` |
| 1398–1495 | **LIBRARY UI** | `renderLib()`, `renameBook()`, `deleteBook()`, `configurePlayerForMode()` |
| 1497–1512 | **PLAYER CONFIG** | `configurePlayerForMode(b, audioSrc, rate)` — decides ttsMode, shows/hides seek strip vs TTS bar |
| 1517–1550 | **OPEN BOOK / GO LIB** | `openBook(i)`, `goLib()` |
| 1555–1630 | **MEDIA CONTROLS** | `setMediaState()`, `togglePlay()`, `mediaPlay/Pause/Stop()`, `skip()`, `setRate()`, `setVol()`, `toggleMute()`, seek handlers |
| 1637–1713 | **AUDIO EVENTS** | `_wordTick()` (rAF word highlight), `startWordTicker()`, `stopWordTicker()`, `wireAudioEvents()` (timeupdate/ended/play/pause) |
| 1718–1756 | **SCROLL ENGINE** | `startScrollEngine()`, `stopScrollEngine()`, `advanceSent()`, `nudge(n)`, `resync()` |
| 1762–1833 | **TTS** | `getTtsVoices()`, `setTtsVoice()`, `setTtsRate()`, `ttsPlay()`, `ttsPause()`, `ttsStop()` |
| 1839–1873 | **SYNC ANCHORS** | `setAudioAnchor()`, `setTextAnchor()`, `clearAnchors()`, `updateAnchorUI()`, `toggleSyncPanel()` |
| 1882–1921 | **HIGHLIGHTING & PROGRESS** | `updateHL()`, `updateProg()`, `scrollToSent()`, `toggleAS()`, `toggleWordHl()` |
| 1927–1957 | **TOC** | `toggleToc()`, `buildToc()`, `updateTocActive()` |
| 1963–2025 | **OPTIONS PANEL** | `toggleOpts()`, `switchOptTab()`, `setTheme()`, `setFont()`, `setFS/LH/MW()`, `setAlign()`, WPM helpers, scroll-pause IIFE, click-outside handler |
| 2030–2227 | **TRANSCRIPT** | `loadTranscriptData()`, `setBannerState()`, `buildSentenceTimings()`, `buildTimingsFromPlainText()`, `similarity()`, `updateTranscriptUI()` |
| 2232–2317 | **EBOOK LOADING** | `yieldToMain()`, `loadEbook(book, onDone)` |
| 2323–2337 | **SENTENCE SPLITTER** | `splitSentences(text)` |
| 2342–2427 | **EBOOK PARSERS** | `parseTxt()`, `parseMd()`, `parseHtml()`, `extractFromDom()`, `parseEpub()`, `loadScript()`, `arrayBufferToBase64()` |
| 2432–2561 | **ADD BOOK MODAL** | `openModal()`, `closeModal()`, file/folder handlers, `addBook()` |
| 2566–2611 | **TRANSCRIPT MODAL** | `openTranscriptModal()`, `saveTranscript()`, `removeTranscript()` |
| 2616–2649 | **LINK AUDIO MODAL** | `openLinkAudioModal()`, `saveLinkAudio()` |
| 2653–2736 | **BOOK INFO MODAL** | `openBookInfoModal()`, `closeBookInfoModal()`, `biReassign()` |
| 2741–2763 | **RELINK** | `showRelink()`, `closeRelink()`, `rlLoad()` |
| 2767–2857 | **PWA FILE SYSTEM** | `pwaPickFolder()`, `pwaRegrantAccess()`, `pwaScanAndRender()`, `pwaScanBookFolder()`, `getPwaProgress()`, `savePwaProgress()`, `pwaOpenBook()` |
| 2909–2933 | **SCREEN ROUTER** | `showScreen(id)`, `pwaShowFirstRun()`, `pwaCheckOnLaunch()` |
| 2938–2946 | **SWIPE GESTURES** | Touchstart/move/end IIFE on `#eScroll` |
| 2951–2953 | **SERVICE WORKER** | `navigator.serviceWorker.register()` |
| 2958–2981 | **INIT** | `init()` — calls cacheDOM, wireAudioEvents, loadDisplayPrefs, setMediaState, getTtsVoices, routing |

---

## Architecture

One HTML file: `<style>` → static HTML (4 screens + 5 modals) → `<script>` (all JS).
Screens: `pwaFirstRun`, `pwaRegrant`, `library` (card grid), `player` (reader + controls).
Routed by `showScreen(id)` toggling `display:flex/none`.

### Two Playback Modes (decided at book open by `configurePlayerForMode`)

**Audio mode** (`ttsMode === false`):
- `<audio>` element drives playback.
- `timeupdate` event advances `curSent` via `sentenceTimings[]`.
- Word-level highlight via `_wordTick()` at rAF using `wordTimings[]` + `_audio.currentTime`.
- Seek strip visible; TTS bar hidden.
- State updates: audio `play`/`pause`/`ended` events call `setPlayBtnIcon`, `setMediaState`, `startWordTicker`/`stopWordTicker`, wake lock, media session, page title.

**TTS mode** (`ttsMode === true`):
- No audio file. `speechSynthesis` speaks sentences sequentially.
- `ttsPlay()` creates `SpeechSynthesisUtterance` per sentence; `onend` advances to next.
- Word-level highlight via `utt.onboundary` mapping `charIndex` → word span index.
- Seek strip hidden; TTS bar visible (voice picker, rate slider).
- Scroll engine (`startScrollEngine`/`advanceSent`) is WPM-based timer fallback (not used during speechSynthesis playback).
- State updates: `ttsPlay`/`ttsPause`/`ttsStop` each call `setPlayBtnIcon`, `setMediaState`, `stopScrollEngine`, wake lock, media session, page title.

### Two Storage Modes (decided at startup)

**Browser mode** (`!IS_PWA`): file data in `library[]`, persisted via localStorage (metadata) + IndexedDB (blobs: ebookData, transcriptData, coverUrl).

**PWA mode** (`IS_PWA && CAN_FS`): files read from disk via File System Access handles stored in IDB. Library rebuilt by folder scan each launch. Only progress saved to localStorage via `savePwaProgress()`.

---

## Global State Variables (lines 928–954)

### Core reading state
| Variable | Type | Description |
|---|---|---|
| `library` | `Array<Object>` | All books (in-memory working copy) |
| `curBookIdx` | `number` | Index into `library`; -1 = on library screen |
| `sentences` | `Array<{el, words[], text}>` | **Live DOM refs** for current book. Stale after `#eContent` innerHTML wipe |
| `tocEntries` | `Array<{text, level, sentIdx}>` | Heading entries for TOC sidebar |
| `curSent` | `number` | Current sentence index |
| `curWord` | `number` | Current word index within current sentence |

### Scroll & timing
| Variable | Type | Description |
|---|---|---|
| `autoScroll` | `boolean` | Auto-scroll to active sentence |
| `scrollPaused` | `boolean` | Temporarily true (2s) after user manual scroll |
| `scrollTimer` | `timeout ID` | Used by both scroll-pause and advanceSent |
| `lastAdvanceTime` | `number` | Timestamp — unused legacy? |
| `wpm` | `number` | Words per minute for TTS scroll engine |
| `sentPauseMs` | `number` | Pause between sentences (TTS scroll engine) |

### Playback state
| Variable | Type | Description |
|---|---|---|
| `mediaState` | `string` | `'stopped'` / `'playing'` / `'paused'` |
| `isSeeking` | `boolean` | True while user drags seek bar |
| `ttsMode` | `boolean` | `false` = audio, `true` = TTS |
| `ttsSpeaking` | `boolean` | True while speechSynthesis is actively speaking |
| `ttsUtterance` | `SpeechSynthesisUtterance\|null` | Current utterance (for resume) |
| `ttsVoice` | `SpeechSynthesisVoice\|null` | Selected TTS voice |
| `ttsPaused` | `boolean` | True when TTS is paused (for resume path) |

### Transcript & sync
| Variable | Type | Description |
|---|---|---|
| `sentenceTimings` | `Array<{start,end}\|undefined>` | Per-sentence audio timestamps (sparse) |
| `wordTimings` | `Array<{starts,count}\|undefined>` | Per-sentence word-level timestamps (sparse) |
| `transcriptWords` | `Array<{word,start,end}>\|null` | Raw Whisper word entries |
| `transcriptText` | `string\|null` | Plain-text transcript (no timestamps) |
| `audioZero` | `number\|null` | Manual audio sync anchor (seconds) |
| `textZero` | `number\|null` | Manual text sync anchor (sentence index) |

### UI state
| Variable | Type | Description |
|---|---|---|
| `tocOpen` | `boolean` | TOC sidebar expanded |
| `wordHlOn` | `boolean` | Word-level highlighting enabled |

### Modal pending state
| Variable | Type | Description |
|---|---|---|
| `txPending` | `File\|null` | Pending file in transcript modal |
| `laPending` | `File\|null` | Pending file in link-audio modal |
| `folderFiles` | `Array` | Files from folder picker in add-book modal |
| `upData` | `{audio,ebook,transcript,cover}` | Staged files in add-book modal (const, line 2431) |

### PWA
| Variable | Type | Description |
|---|---|---|
| `pwaRootHandle` | `FileSystemDirectoryHandle\|null` | Root folder handle |

### Private module-level variables
| Variable | Line | Description |
|---|---|---|
| `_wakeLock` | 975 | Screen wake lock sentinel |
| `_saveTimer` | 1022 | Debounce timer for `saveBookProgressDebounced` |
| `_sleepTimerIdx` | 1042 | Index into `SLEEP_OPTIONS` array |
| `_sleepTimerId` | 1043 | setTimeout ID for sleep timer |
| `_sleepEndTime` | 1044 | Epoch ms when sleep timer expires |
| `_sleepTickId` | 1045 | setInterval ID for badge countdown |
| `_installPromptEvent` | 1134 | Deferred `beforeinstallprompt` event |
| `_audio` | 1162 | Cached `<audio>` element |
| `_playBtn` | 1162 | Cached play button element |
| `_eContent` | 1162 | Cached `#eContent` element |
| `_readProg` | 1162 | Cached `#readProg` element |
| `_tCur` | 1162 | Cached `#tCur` time display |
| `_seekBar` | 1162 | Cached `#seekBar` element |
| `_rafId` | 1636 | rAF ID for `_wordTick` |
| `_activeSentEl` | 1879 | Currently highlighted sentence DOM element |
| `_activeWordEl` | 1880 | Currently highlighted word DOM element |

### Constants
| Name | Line | Value/Purpose |
|---|---|---|
| `IS_PWA` | 945 | `true` if running as installed PWA |
| `CAN_FS` | 946 | `true` if File System Access API available |
| `AUDIO_EXTS` | 947 | Set of recognized audio extensions |
| `EBOOK_EXTS` | 948 | Set of recognized ebook extensions |
| `IMAGE_EXTS` | 949 | Set of recognized image extensions |
| `LS_KEY` | 950 | `'folio_library_v2'` — localStorage key for library metadata |
| `PWA_PROG_KEY` | 951 | `'folio_pwa_progress_v1'` — localStorage key for PWA progress |
| `DISPLAY_PREFS_KEY` | 952 | `'folio_display_prefs_v1'` — localStorage key for display settings |
| `IDB_NAME` | 953 | `'folio_pwa'` — IndexedDB database name |
| `IDB_STORE` | 953 | `'handles'` — IDB object store for file handles |
| `IDB_BLOB_STORE` | 953 | `'blobs'` — IDB object store for book data blobs |
| `BLOB_FIELDS` | 954 | `['ebookData','transcriptData','coverUrl']` — fields saved to IDB |
| `SLEEP_OPTIONS` | 1041 | `[0, 5, 15, 30, 60, 90]` — minutes |

---

## Key Function Reference

### Playback Control Chain

```
togglePlay() [1561]
  ├── ttsMode=true  → ttsSpeaking ? ttsPause() : ttsPlay()
  └── ttsMode=false → _audio.paused ? mediaPlay() : mediaPause()

mediaPlay() [1565]       → ttsMode redirects to ttsPlay()
  └── _audio.play() → then: setPlayBtnIcon(true), setMediaState('playing'),
      startScrollEngine(), startWordTicker(), acquireWakeLock(), updatePageTitle()

mediaPause() [1576]      → ttsMode redirects to ttsPause()
  └── _audio.pause(), stopWordTicker(), setPlayBtnIcon(false), setMediaState('paused'),
      releaseWakeLock(), updatePageTitle()

mediaStop() [1585]       → ttsMode redirects to ttsStop()
  └── _audio.pause(), currentTime=0, stopWordTicker(), setPlayBtnIcon(false),
      setMediaState('stopped'), stopScrollEngine(), releaseWakeLock(), updatePageTitle()

ttsPlay() [1783]
  ├── resume path (ttsPaused && ttsUtterance): speechSynthesis.resume(),
  │   setPlayBtnIcon(true), setMediaState('playing'), acquireWakeLock(), updatePageTitle()
  └── fresh path: setPlayBtnIcon(true), setMediaState('playing'), ttsSpeaking=true,
      acquireWakeLock(), updatePageTitle()
      └── speak() loop: creates SpeechSynthesisUtterance per sentence
          ├── utt.onboundary → maps charIndex to word span, updates curWord + word-active class
          ├── utt.onend → curSent++, curWord=0, speak() again
          └── exit: setPlayBtnIcon(false), setMediaState(), stopScrollEngine(), releaseWakeLock()

ttsPause() [1825]  → speechSynthesis.pause(), setPlayBtnIcon(false), stopScrollEngine(),
                     releaseWakeLock(), updatePageTitle()
ttsStop()  [1830]  → speechSynthesis.cancel(), setPlayBtnIcon(false), stopScrollEngine(),
                     releaseWakeLock(), updatePageTitle()
```

### State Update Functions (these should ALWAYS be called together)

Playing: `setPlayBtnIcon(true)`, `setMediaState('playing')`, `acquireWakeLock()`, `updatePageTitle()`
Paused:  `setPlayBtnIcon(false)`, `setMediaState('paused')`, `releaseWakeLock()`, `updatePageTitle()`
Stopped: `setPlayBtnIcon(false)`, `setMediaState('stopped')`, `stopScrollEngine()`, `releaseWakeLock()`, `updatePageTitle()`

### Book Open Flow

```
openBook(i) [1517]
  ├── IS_PWA && CAN_FS → pwaOpenBook(i) [2859]
  │   └── resolves file handles → configurePlayerForMode() → loadTranscriptData()
  │       → loadEbook() → setupMediaSession() → updatePageTitle()
  └── browser mode:
      └── configurePlayerForMode() → loadTranscriptData() → loadEbook(onDone) →
          setupMediaSession() → updatePageTitle()

configurePlayerForMode(b, audioSrc, rate) [1497]
  └── sets ttsMode, shows/hides seekStrip vs ttsBar, loads audio if present

loadEbook(book, onDone) [2236]
  └── clears _activeSentEl/_activeWordEl → wipes #eContent → parses ebook format →
      builds DOM in chunks (DocumentFragment + yieldToMain) → populates sentences[] →
      buildToc() → buildSentenceTimings() (if transcript) → onDone()

loadTranscriptData(b) [2030]
  └── setBannerState('loading') → parses JSON/TXT → setBannerState('ready') →
      buildSentenceTimings() (if sentences already loaded)

buildSentenceTimings() [2087]
  └── setBannerState('syncing') → greedy forward Jaccard match: ebook sentences →
      transcript word runs → populates sentenceTimings[] + wordTimings[] →
      setBannerState('ready')
```

### Highlighting & Scroll

```
updateHL() [1882]
  └── removes previous sent-active/word-active → applies to sentences[curSent] →
      applies word-active to words[curWord] if wordHlOn → updateTocActive()

scrollToSent(idx) [1899]
  └── early-returns if scrollPaused → checks if sentence is in safe zone (middle 40%) →
      scrollIntoView({smooth, center}) if outside

advanceSent() [1727]  (TTS scroll engine — WPM-based, not used during speechSynthesis)
  └── calculates ms from char count + wpm + sentPauseMs → setTimeout → curSent++ → recurse

_wordTick() [1637]  (audio mode only)
  └── reads _audio.currentTime → binary search in wordTimings[curSent].starts →
      updates curWord + word-active class → requestAnimationFrame(self)
```

### Save/Load Chain

```
saveBookProgress() [1306]
  └── updates library[curBookIdx] fields → saveLibrary()

saveLibrary() [1225]
  └── _stripBlobs() all books → JSON.stringify → localStorage.setItem(LS_KEY) →
      fire-and-forget _saveBlobs()

_saveBlobs() [1233]
  └── for each book with blob fields → idbSet to IDB_BLOB_STORE

loadLibrary() [1270]
  └── JSON.parse from localStorage → hydrate blobs from IDB → auto-migrate old format

flushPositionSync() [1321]
  └── sync-only emergency save on visibilitychange/pagehide (critical for iOS)
      PWA: savePwaProgress() + direct localStorage write
      Browser: synchronous localStorage only (no IDB)
```

### Modal Functions

| Modal | Open | Close | Save | Lines |
|---|---|---|---|---|
| Add Book | `openModal()` | `closeModal()` | `addBook()` | 2432–2561 |
| Transcript | `openTranscriptModal()` | `closeTxModal()` | `saveTranscript()` / `removeTranscript()` | 2566–2611 |
| Link Audio | `openLinkAudioModal()` | `closeLinkAudioModal()` | `saveLinkAudio()` | 2616–2649 |
| Book Info | `openBookInfoModal()` | `closeBookInfoModal()` | `biReassign()` | 2653–2736 |
| Relink | `showRelink(i)` | `closeRelink()` | `rlLoad()` | 2741–2763 |

---

## Storage Architecture

**localStorage** (sync, ~5MB): metadata only (titles, positions, settings). Key: `folio_library_v2`.
Blobs stripped via `_stripBlobs()` before every write.

**IndexedDB** `folio_pwa` v2: store `handles` (PWA file system handles), store `blobs`
(per-book `ebookData`, `transcriptData`, `coverUrl` keyed by book.id).

`saveLibrary()` = sync localStorage + fire-and-forget async IDB blobs.
`loadLibrary()` = async: metadata from LS, then hydrate blobs from IDB. Auto-migrates old format.
`flushPositionSync()` = sync-only emergency save on visibilitychange/pagehide (critical for iOS).

**Display prefs** saved separately to `folio_display_prefs_v1` (theme, fonts, font-size, line-height, width, alignment, wpm, sentPauseMs, wordHlOn).

---

## Data Structures

### `library[i]` (book object)
```
{
  id, title,
  audioUrl, audioName, audioExt,     // audio (null if TTS-only)
  ebookData, ebookName, ebookType,   // ebook content + format
  transcriptData, transcriptName, transcriptType,  // 'whisper' | 'txt' | null
  coverUrl, coverName,               // cover image data URL
  curSent, curWord, audioTime,       // saved progress
  wpm, sentPauseMs, playbackRate,    // per-book playback settings
  audioZero, textZero,               // manual sync anchors
  totalSents,                        // for progress display on library card
  // PWA-only additional fields:
  audioHandle, ebookHandle, transcriptHandle, coverHandle  // File System Access handles
}
```

### `sentences[i]`
```
{
  el: HTMLSpanElement,       // live DOM ref (.sent span) — STALE after innerHTML wipe
  words: [{el, text}, ...], // live DOM refs (.word spans)
  text: string              // original sentence text
}
```

### `sentenceTimings[i]`
```
{ start: number, end: number }   // audio seconds; sparse array (undefined for unmatched)
```

### `wordTimings[i]`
```
{ starts: Float64Array, count: number }  // per-word start times; sparse array
```

### `transcriptWords[i]`
```
{ word: string, start: number, end: number }  // raw Whisper output
```

---

## Keyboard Shortcuts (line 1084)

| Key | Action |
|---|---|
| Space | `togglePlay()` |
| → | `nudge(1)` (next sentence) |
| Shift+→ | `skip(15)` (forward 15s audio) |
| ← | `nudge(-1)` (prev sentence) |
| Shift+← | `skip(-15)` (back 15s audio) |
| `[` or `-` | Decrease playback rate by 0.1 |
| `]` or `+` or `=` | Increase playback rate by 0.1 |
| `f` / `F` | Toggle fullscreen |
| `m` / `M` | Toggle mute |

---

## IIFEs and Inline Listeners

| Lines | What | Trigger |
|---|---|---|
| 988–990 | visibilitychange → re-acquire wake lock if playing | auto |
| 2001–2016 | scroll-pause detection on `#eScroll` | user scroll → sets `scrollPaused=true` for 2s |
| 2018–2025 | click-outside handler for options panel | any document click |
| 2938–2946 | swipe gesture detection on `#eScroll` | touch events → `nudge(±1)` |

---

## Fragile Areas

1. **Stale DOM refs**: `sentences[]` holds live DOM refs — any `#eContent` innerHTML wipe without clearing `sentences`, `_activeSentEl`, `_activeWordEl` causes stale-ref bugs.
2. **Fire-and-forget blobs**: `saveLibrary()` blob write is async fire-and-forget; closing tab before IDB flush = data loss for new books.
3. **Yield-to-main**: Transcript state machine needs `await yieldToMain()` — missing `await` = banner states don't paint.
4. **Sync window cap**: `buildSentenceTimings` search window is capped — long audio intros not in ebook can desync cursor.
5. **PWA folder hash**: book.id = folder name hash — renaming folder loses all saved progress.
6. **No audio persistence**: blob URLs are runtime-only. Browser mode reload = must re-link audio.
7. **`scrollTimer` dual use**: `scrollTimer` is used both by the scroll-pause IIFE (line 2012) and by `advanceSent()` (line 1734 via `stopScrollEngine`). Clearing it in one context can affect the other.
8. **`togglePlay` TTS check**: `togglePlay()` checks `ttsSpeaking` to decide play vs pause, but if `ttsPaused` is true and `ttsSpeaking` is false, it correctly calls `ttsPlay()` which hits the resume path.