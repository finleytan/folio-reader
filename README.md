# 📖 Verte

**An audiobook + ebook reader that runs in your browser — syncs your text to your audio word by word.**

> 🔗 **[Open Verte →](finleytan.github.io/folio-reader/ )**

---

## Quick start

1. Visit the link above in Chrome, Edge, Firefox, or Safari
2. Click **+ Add Book**
3. Add your audio file, ebook, and (optionally) a Whisper transcript
4. Start reading

Your library, reading positions, and settings are all saved in your browser automatically.

---

## Adding a book

Click **+ Add Book**, then either use the folder picker or drop files into the three slots individually.

**Folder picker (easiest):** click **📁 Browse Folder**, select the folder containing your book files, and Verte auto-assigns everything. The title defaults to the folder name.

| Slot | Accepted formats |
|---|---|
| 🎧 Audio | MP3, M4A, M4B, OGG, WAV, AAC, FLAC, OPUS |
| 📄 Ebook | EPUB, TXT, HTML, HTM, XHTML, MD |
| 📝 Transcript *(optional)* | Whisper JSON, plain TXT |

> **Ebook only?** No problem — Verte will read it aloud using your browser's built-in text-to-speech. You can link an audio file later from inside the player.

### On Android (PWA)

Verte scans your library folder automatically. Keep one subfolder per book:

```
Verte Library/
├── Dune/
│   ├── Dune.mp3
│   ├── Dune.epub
│   └── Dune.json        ← Whisper transcript
├── Project Hail Mary/
│   ├── ProjectHailMary.m4b
│   └── ProjectHailMary.epub
```

Each time you open the app, tap the one-tap permission prompt to reload your library. This is a browser security requirement and can't be skipped.

---

## Text sync

Verte uses the best sync method available for each book:

### Whisper JSON — word-level highlight

With a Whisper transcript, Verte highlights the exact word being spoken in real time as you listen. Generate one on your computer (requires Python and ffmpeg):

```bash
pip install openai-whisper
whisper "audiobook.mp3" --model medium --output_format json --word_timestamps True
```

Drop the `.json` output file into the transcript slot. Use `--model large-v3` for accented speech or older recordings.

| Model | Speed | Best for |
|---|---|---|
| `tiny` | Very fast | Quick tests |
| `base` | Fast | Clear narration |
| `medium` | Moderate | Most audiobooks *(recommended)* |
| `large-v3` | Slow | Accented speech, older recordings |

### Plain text transcript — sentence sync

Drop a `.txt` file of the narration into the transcript slot. Verte aligns it to the ebook by word overlap and estimates timing from the audio duration.

### No transcript — manual anchors

Use the **⚙ Sync** panel at the bottom of the player:

1. Play to where narration starts → click **Set audio start**
2. Click the matching sentence in the ebook → click **Set text start**
3. After seeking, tap **↺ Resync** to re-align

---

## Player controls

### Top bar

| Button | Action |
|---|---|
| ← | Return to library (saves your position) |
| ⏮ / ⏭ | Skip −15 / +15 seconds |
| ▶ / ⏸ | Play / Pause |
| ☰ | Toggle table of contents |
| 📝 | Add or replace transcript |
| ℹ | Book Info — swap any file slot without leaving the player |
| ⚙ | Options panel |

### Seek strip

Speed presets sit directly below the scrub bar: **0.75× 1× 1.25× 1.5× 2×** — click to activate, or type a custom value in the box next to them.

### Bottom bar

| Control | Action |
|---|---|
| ▶ ⏸ ⏹ | Play / Pause / Stop |
| −10 −5 −1 +1 +5 +10 | Jump forward or backward by sentences |
| Auto-scroll | Keep the active sentence scrolled into view |
| ↺ Resync | Snap text position to current audio time |
| ⚙ Sync | Expand the manual sync panel |

**Click any sentence** to jump playback to it.  
**Click any word** to jump to that word (Whisper transcript required).  
**Swipe left / right** on the reading area to step one sentence (mobile).

---

## Options

Open with **⚙** in the top bar.

| Tab | Settings |
|---|---|
| **Playback** | Volume, scroll speed (WPM), sentence pause, word highlight on/off |
| **Display** | Theme (Dark / Parchment / Night), font, size, line height, max width, alignment |

All settings save automatically and restore on next visit.

---

## Audio re-linking

Browsers can't permanently store audio files. Each session, books that need their audio re-linked will show a warning on the card. Click the card, pick the same file, and you resume exactly where you left off — position, speed, and sync anchors all preserved.

Your ebook and transcript are fully saved and never need re-linking.

---

## What gets saved

| Data | Storage |
|---|---|
| Ebook content | ✅ localStorage |
| Transcript | ✅ localStorage |
| Reading position | ✅ localStorage |
| Audio position | ✅ localStorage |
| Speed, WPM, all settings | ✅ localStorage |
| Sync anchors | ✅ localStorage |
| Library folder handle (PWA) | ✅ IndexedDB |
| Audio file | ❌ Re-select each session |

---

## License

MIT
