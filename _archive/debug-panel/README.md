# Folio Debug Panel — Archive

Removed from `index.html` on 2026-03-12 (v1.5). All three pieces are preserved here.

## How to re-add

### 1. CSS — `debug-panel.css`

Paste the full contents **inside `<style>`**, just before `</style>` (around line 532 in the clean file).

### 2. JS — `debug-panel.js`

Paste the full contents **inside `<script>`**, just before `</script>` (at the end of the script block).

The file includes a comment at the top reminding you to also add the init hook (step 3).

### 3. Init hook

Add this one line **at the end of `init()`**, just before its closing `}`:

```js
try{ if(location.search.includes('debug')) initDebugPanel(); }catch(e){}
```

## Usage

Load the app with `?debug` in the URL:

```
http://localhost:3000/?debug
```

To auto-run the test suite on load:

```
http://localhost:3000/?debug&test
```

## Tabs

| Tab | Description |
|-----|-------------|
| Fixture | Inject a fake ebook (TTS or Audio/fake mode) and clear all books |
| Stepper | Jump to sentence, step ±1/±10, simulate audio time, adjust sync offset, highlight word N |
| State | Live-polling table of all key globals (anomaly detection highlighted in amber) |
| Persist | Dump/clear localStorage, simulate pagehide, list/clear IndexedDB blobs, dump/reset display prefs |
| Tests | 47-assertion automated test runner (also available as `tests/console-test.js` for DevTools paste) |

## Globals accessed (all must exist in index.html scope)

`sentences`, `curSent`, `curWord`, `ttsMode`, `ttsSpeaking`, `mediaState`, `autoScroll`,
`syncOffset`, `sentenceTimings`, `transcriptWords`, `wpm`, `sentPauseMs`, `library`,
`curBookIdx`, `IS_PWA`, `CAN_FS`, `_audio`, `uid`, `saveLibrary`, `renderLib`, `openBook`,
`updateHL`, `updateProg`, `scrollToSent`, `nudge`, `adjustOffset`, `resync`,
`ttsPlay`, `ttsPause`, `ttsStop`, `showToast`, `loadDisplayPrefs`, `idbOpen`, `IDB_BLOB_STORE`
