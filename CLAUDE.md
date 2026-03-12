# Folio

Single-file HTML PWA (~2.9k lines): audiobook/ebook reader with synced highlighting.
File: index.html — <style>, static HTML (4 screens + 5 modals), <script>.

## File structure
- CSS: lines 14–452
- HTML: lines 454–832
- JS: lines 833–2863

## Two playback modes (set by configurePlayerForMode)
- Audio mode: <audio> drives playback, _wordTick() at rAF for word highlights
- TTS mode: speechSynthesis, utt.onboundary for word highlights

## Key state
sentences[] holds LIVE DOM refs — stale after innerHTML wipe.
curSent/curWord = reading position. mediaState = 'stopped'|'playing'|'paused'.

## Constraints
- Do not refactor or restructure unless asked
- Read each target function in full before editing
- Run `node --check index.html` to verify syntax after changes
- State updates must always include: setPlayBtnIcon, setMediaState,
  acquireWakeLock/releaseWakeLock, updatePageTitle

## Detailed context
See folio-context.md for full function map, data structures, and line ranges.