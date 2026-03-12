# Folio

Single-file HTML PWA (~3k lines): audiobook/ebook reader with synced highlighting.
File: indexnew.html — <style>, static HTML (4 screens + 5 modals), <script>.

## File structure
- CSS: lines 11–505
- HTML: lines 506–921
- JS: lines 922–2981

## Two playback modes (set by configurePlayerForMode)
- Audio mode: <audio> drives playback, _wordTick() at rAF for word highlights
- TTS mode: speechSynthesis, utt.onboundary for word highlights

## Key state
sentences[] holds LIVE DOM refs — stale after innerHTML wipe.
curSent/curWord = reading position. mediaState = 'stopped'|'playing'|'paused'.

## Constraints
- Do not refactor or restructure unless asked
- Read each target function in full before editing
- Run `node --check indexnew.html` to verify syntax after changes
- State updates must always include: setPlayBtnIcon, setMediaState,
  acquireWakeLock/releaseWakeLock, updatePageTitle

## Detailed context
See folio-context.md for full function map, data structures, and line ranges.