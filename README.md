# 📖 Folio — Audiobook & Ebook Reader

> A single-file browser app for reading along with your audiobooks. No installation, no server, no account — just open and read.

---

## Features

- **Dual sync modes** — word-by-word scrolling at a set WPM, or timestamp-precise sync via Whisper JSON transcripts
- **Persistent library** — books, positions, WPM, speed, and sync anchors all saved to localStorage
- **EPUB, TXT, HTML, MD** ebook support
- **Transcript support** — Whisper JSON (word-level timestamps) or plain TXT for text-alignment sync
- **Audio re-linking** — close and reopen the app without losing your place; just re-select the audio file
- **Mobile-friendly** — responsive layout, touch-sized controls, installable via Add to Home Screen
- **Table of contents** — auto-generated from headings, collapsible sidebar
- **Customizable** — themes (Dark, Parchment, Night), fonts, font size, line height, text width, alignment
- **No dependencies** — single HTML file, works fully offline (JSZip loaded on demand for EPUB only)

---

## Getting Started

### Local use

Download `audiobook-reader.html` and open it in any modern browser. That's it.

### On your phone via GitHub Pages

1. Create a **public** GitHub repository
2. Upload `audiobook-reader.html` renamed to `index.html`
3. Go to **Settings → Pages → Deploy from branch → main / root**
4. Visit `https://yourusername.github.io/your-repo-name`
5. In your mobile browser, tap **Add to Home Screen** to install it like an app

---

## Adding a Book

Click **+ Add Book** and drop your files into the zone — Folio detects each type by file extension.

| Slot | Accepted formats |
|---|---|
| Audiobook | MP3, M4A, M4B, OGG, WAV, AAC, FLAC, OPUS |
| Ebook | TXT, EPUB, HTML, HTM, XHTML, MD |
| Transcript *(optional)* | JSON (Whisper), TXT (plain) |

The book title is auto-detected from the audio filename and can be edited at any time.

---

## Text Sync

Folio uses the best sync method available for each book:

### 1. Whisper JSON *(most accurate)*
Provide a Whisper transcript with word-level timestamps. Folio drives the highlighted sentence directly from the audio clock — no drift, no manual anchors needed.

Generate one with:
```bash
whisper "audiobook.mp3" --model medium --output_format json
```

### 2. Plain text transcript *(good accuracy)*
A `.txt` file of the narration. Folio aligns transcript sentences to ebook sentences by word-overlap scoring and assigns proportional timing.

### 3. Manual sync anchors *(fallback)*
No transcript? Use the Sync panel at the bottom of the player:
- Play to where narration begins → **Set audio start**
- Scroll to the matching sentence → **Set text start**
- After seeking, hit **↺ Resync text** to realign

---

## Player Controls

### Top bar
| Button | Action |
|---|---|
| ← | Save progress and return to library |
| ⏮ / ⏭ | Skip −15 / +15 seconds |
| ▶ / ⏸ | Play / Pause |
| ☰ | Toggle table of contents |
| 📝 | Add or manage transcript |
| ⚙ | Options panel |

### Keyboard shortcuts
| Key | Action |
|---|---|
| `Space` | Play / Pause |
| `→` | Next sentence |
| `←` | Previous sentence |
| `↑` | Jump +5 sentences |
| `↓` | Jump −5 sentences |
| `]` | Skip audio +15s |
| `[` | Skip audio −15s |
| `+` / `=` | WPM +10 |
| `-` | WPM −10 |

---

## Audio Re-linking

Audio files are too large for localStorage. Folio saves the filename, size, and modification date as a fingerprint but the file must be re-selected each session.

Books that need re-linking show a **⚠ Tap to re-link audio** badge. Tap the card, select the same file, and you resume exactly where you left off — position, WPM, speed, and sync anchors are all preserved.

---

## Options

| Setting | Details |
|---|---|
| Speed | 0.75× · 1× · 1.25× · 1.5× · 2× |
| Volume | Slider + mute toggle |
| Theme | Dark · Parchment · Night |
| Font | Lora · Georgia · Sans · Mono |
| Font size | 13–28px |
| Line height | 1.30–2.40 |
| Max width | 380–900px |
| Alignment | Left · Justified · Center |
| Word highlight | Toggle on/off |
| Sentence pause | 0–2000ms gap between sentences |
| Default WPM | 30–600 words per minute |

---

## Generating a Whisper Transcript

Whisper runs locally and is free. Requires Python 3.11 and ffmpeg.

```bash
# Install
pip install openai-whisper

# With NVIDIA GPU (much faster)
pip install torch --index-url https://download.pytorch.org/whl/cu121

# Transcribe
whisper "My Audiobook.mp3" --model medium --output_format json
```

Model size guide: `tiny` → fastest, lowest accuracy · `medium` → best balance · `large` → slowest, highest accuracy.

The output `.json` file is what you drop into Folio's transcript slot.

---

## What Gets Saved

| Data | Saved |
|---|---|
| Ebook content | ✅ localStorage |
| Transcript | ✅ localStorage |
| Position (sentence + word) | ✅ localStorage |
| Audio playback position | ✅ localStorage |
| WPM, speed, sentence pause | ✅ localStorage |
| Sync anchors | ✅ localStorage |
| Audio file | ❌ Re-link required each session |

---

## Browser Support

Any modern browser with ES2017+ support. Tested on Chrome, Firefox, Safari, and Edge. Works on iOS Safari and Android Chrome.

---

## License

MIT
