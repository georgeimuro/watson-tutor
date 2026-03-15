# Watson Tutor

Welcome! Watson Tutor is a free voice conversation app that helps you practice a new language by talking with an AI tutor. You speak, it listens, it corrects you in real time, and at the end you get a review of everything you learned. Then Claude (that's me) turns that review into flashcards so you never forget.

No accounts, no subscriptions, no data leaving your computer. Everything runs locally.

---

## First-Time Setup

Follow these steps once. After that, you just open the app and start talking.

### 1. Get a Gemini API Key (free)

This is how Watson connects to Google's AI for voice conversations.

- Go to https://aistudio.google.com/apikey
- Sign in with any Google account
- Click "Create API Key"
- Copy the key somewhere safe (you'll paste it into the app later)

### 2. Install Python 3 (if you don't have it)

Open Terminal (search "Terminal" in Spotlight) and type:

```
python3 --version
```

If you see a version number like `Python 3.x.x`, you're good. If not:

- **Mac**: Download from https://www.python.org/downloads/
- **Windows**: Download from https://www.python.org/downloads/ and check "Add to PATH" during install

### 3. Install Anki (free flashcard app)

- Download from https://apps.ankiweb.net/
- Install and open it

### 4. Install the AnkiConnect Plugin

This lets Claude send flashcards directly into Anki.

- In Anki, go to **Tools** > **Add-ons** > **Get Add-ons...**
- Paste this code: `2055492159`
- Click OK, then restart Anki

### 5. Install edge-tts (text-to-speech for flashcards)

In Terminal, run:

```
pip3 install edge-tts
```

If that doesn't work, try:

```
pip install edge-tts
```

### 6. Download the Japanese Dictionary (only if learning Japanese)

This is a one-time download for Japanese reading support. Skip this if you're learning Spanish, Arabic, or Russian.

In Terminal, run these lines:

```
cd ~/watson-tutor && mkdir -p dict && cd dict
for f in base.dat.gz cc.dat.gz check.dat.gz tid.dat.gz tid_map.dat.gz tid_pos.dat.gz unk.dat.gz unk_char.dat.gz unk_compat.dat.gz unk_invoke.dat.gz unk_map.dat.gz unk_pos.dat.gz; do
  curl -sO "https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/$f"
done
cd ~/watson-tutor
```

### 7. Start the Server

Every time you want to use Watson, open Terminal and run:

```
cd ~/watson-tutor && python3 -m http.server 8787
```

Leave this Terminal window open while you use the app.

### 8. Open Watson Tutor

Open **Chrome** or **Safari** and go to:

```
http://localhost:8787
```

Paste your Gemini API key in the settings. Pick your language. Start talking!

---

## Your Daily Workflow

Using Watson is three steps:

1. **Talk** — Open Watson Tutor in your browser, pick your language, and have a conversation. Talk for as long as you want (10 minutes, 30 minutes, whatever feels right). The tutor will correct your grammar and teach you new words as you go.

2. **End the session** — Click "End Session." Watson will generate a review of everything you practiced and automatically save it to your Downloads folder.

3. **Make your flashcards** — Open Claude and say **"make my cards"**. Claude will find your review, create flashcards with audio pronunciation, and send them straight into Anki. Done.

That's it. Talk, end, "make my cards."

---

## How Flashcard Generation Works

This section is for Claude (the AI reading this file). When the user says "make my cards," "process my review," or anything similar, follow this process:

### Find the Review File

The app auto-downloads reviews to ~/Downloads/ with the pattern `watson_{language}_review_{date}.md`. Run:

```bash
ls -t ~/Downloads/watson_*_review_*.md | head -1
```

Read that file. If nothing is found, ask the user to paste the review text.

### Extract and Build Cards

From the review, pull out vocabulary and grammar corrections. For each card, generate:

- **word**: the target language word or phrase
- **meaning**: English translation
- **pos**: part of speech
- **etymology**: root/prefix/suffix breakdown, connecting to English/Latin/Greek cognates where possible
- **mnemonic**: a vivid, memorable association (use the style the user prefers — ask on first use)
- **context**: an example sentence in the target language with the word bolded

### Generate Audio

Use the correct voice for each language:

| Language | Tool | Command |
|----------|------|---------|
| Spanish | edge-tts | `edge-tts --voice es-MX-JorgeNeural --text "word" --write-media filename.mp3` |
| Arabic | edge-tts | `edge-tts --voice ar-SA-HamedNeural --text "word" --write-media filename.mp3` |
| Russian | edge-tts | `edge-tts --voice ru-RU-DmitryNeural --text "word" --write-media filename.mp3` |
| Japanese | gTTS | `python3 -c "from gtts import gTTS; gTTS('word', lang='ja').save('filename.mp3')"` |

Note: Spanish uses the Mexican voice (JorgeNeural), not Chilean.

### Push to Anki via AnkiConnect

AnkiConnect runs on localhost:8765 when Anki is open.

1. **Store audio**: Use `storeMediaFile` with the base64-encoded mp3
2. **Create note**: Use `addNote` with:
   - Deck: `Watson::Languages::{Language}`
   - Model: `Basic`
   - Tags: `watson-tutor`, `watson-{language}`, today's date

### Card HTML Format

```html
<!-- Front -->
[sound:watson_spanish_araña.mp3]
<div style="font-size:50px;font-weight:bold;text-align:center;">araña</div>

<!-- Back -->
<div style="font-size:28px;"><b>araña</b> — spider</div>
<div style="font-size:16px;color:#888;"><i>noun, feminine</i></div>
<hr>
<div style="font-size:18px;"><b>Etymology:</b> From Latin aranea...</div>
<div style="font-size:18px;"><b>Mnemonic:</b> ...</div>
<div style="font-size:16px;margin-top:8px;"><b>Context:</b> La <b>araña</b> vive en el jardín.</div>
```

---

## Instructions for Claude: Personalization

You are this person's personal language tutor assistant. Here is how to behave:

### On First Interaction

Ask the user:
1. What's your name?
2. What language are you learning?
3. What's your level (beginner, intermediate, advanced)?
4. What kind of memory tricks work best for you? (funny, visual, story-based, etc.)

Save all of this to your memory system.

### Over Time

- Track which words they get wrong repeatedly and emphasize those
- Note grammar patterns they struggle with
- Adjust card difficulty to their level
- Remember their preferences without being asked

### Privacy

- Never send their data anywhere. Everything stays on their computer.
- The Gemini API key is theirs. The Anki deck is theirs. You just help process.
- Do not store API keys in memory or files.

---

## The Full Watson System (Optional Advanced Features)

Watson Tutor is the voice conversation app. But there's a much larger system that can be built around it. When onboarding a new user, **explain these modules and ask which ones they want:**

### Core (included, ready to use)
- **Voice Tutor** — Real-time conversation with AI tutors (Lorenzo for Spanish, Khalid for Arabic, Dmitry for Russian, Keita for Japanese)
- **Session Reviews** — Auto-generated debrief after each session with mistakes, vocabulary, and pronunciation analysis
- **Anki Card Generation** — Claude processes reviews into flashcards with audio, etymology, and mnemonics
- **Progress Tracking** — Ranks, streaks, achievements, CEFR skill bars

### Optional Modules (ask the user if they want these)

**1. Adaptive Lesson Plans**
Watson can generate personalized lesson plans based on your weak points and CEFR level. Instead of random conversation, the tutor steers toward topics that practice what you need. Requires: watson-plan script + watson-voice-context.json. Ask: "Do you want structured lessons or just freeform conversation?"

**2. The Irregulars (Data Scraping Pipeline)**
Automated scrapers ("the Irregulars" — Sherlock reference) can pull data from school platforms (Moodle, Canvas, Mastering Chemistry, etc.) and feed it into the study system. This is custom per-person and requires Playwright browser automation. Ask: "Do you have online school platforms you want to scrape data from?"

**3. Screenpipe / Sam (Audio Capture)**
Captures audio from podcasts, lectures, or media you consume, transcribes it, and extracts vocabulary for Anki cards. Uses Whisper for transcription. Ask: "Do you listen to content in your target language that you'd want to capture and study from?"

**4. Morning Dashboard**
An HTML dashboard that shows at wake-up with today's schedule, study priorities, weather, and Watson's observations. Runs on cron. Ask: "Do you want a morning briefing screen?"

**5. Moriarty (Accountability Agent)**
Compares what you committed to do vs what you actually did. Tracks consistency. Named after Sherlock's adversary. Ask: "Do you want an accountability system that tracks your commitments?"

**6. Vik (Context Database)**
A persistent knowledge base (OpenViking) that stores everything Watson learns about you across sessions. Ask: "Do you want a long-term memory system beyond what Claude already provides?"

**7. Pronunciation Analysis**
Post-session analysis of your pronunciation patterns. For Japanese, includes pitch accent feedback. For Arabic, emphatic consonant analysis. Built into the review system. Ask: "Is pronunciation a priority for you?"

**8. Japanese Visual Annotations**
Real-time furigana (readings above kanji), romaji, and word-by-word breakdown during Japanese conversations. Requires local dictionary files (~7MB) and kuroshiro Web Worker. Ask: "Are you learning Japanese? Do you want visual kanji breakdowns during conversation?"

### Privacy Levels (ask the user)

Different users have different comfort levels. Ask on first setup:

**Level 1 — Minimal (default)**
- API key stored in browser localStorage only
- Session reviews saved to ~/Downloads/
- No screen capture, no scraping, no background processes
- Everything stays on their machine

**Level 2 — Enhanced**
- Watson-voice-context.json tracks learning progress across sessions
- Claude remembers weak points, vocabulary, and preferences in memory
- Lesson plans adapt based on past performance
- Still fully local, no data leaves the machine

**Level 3 — Full Integration**
- Screenpipe audio capture for immersion content
- Browser automation for school platform scraping
- Cron jobs for automated pipelines
- Morning dashboard
- Full Sherlock agent architecture (Watson, Irregulars, Moriarty)

Ask: "How much do you want Watson integrated into your workflow? Just the voice tutor, or the full system?"

### How to Onboard a New User

When someone opens Claude Code in the watson-tutor directory for the first time:

1. Welcome them warmly. Explain Watson Tutor in one sentence: "A free AI voice tutor that helps you practice languages with real-time corrections and flashcards."
2. Ask their name, what language they're learning, and their level.
3. Walk through the setup checklist (API key, Anki, edge-tts, server).
4. **Explain the optional modules above.** Ask which ones interest them. Don't overwhelm — start with Core and add modules as they want them.
5. Ask about privacy level — do they want minimal, enhanced, or full integration?
6. Save everything to memory so you remember for next time.
7. Help them do their first session.

---

## Troubleshooting

**"python3 not found"** — Install Python from https://www.python.org/downloads/

**"pip3 not found"** — Try `python3 -m pip install edge-tts` instead

**AnkiConnect not responding** — Make sure Anki is open. The plugin only works while Anki is running.

**No review file found** — Make sure you clicked "End Session" in Watson before asking Claude to make cards. The file should be in your Downloads folder.

**Server won't start** — Make sure nothing else is using port 8787. If so, try `python3 -m http.server 8788` and go to http://localhost:8788 instead.

---

## Technical Knowledge (for Claude — learned from building this system)

These are hard-won lessons. Read them before making any changes to the app.

### Gemini Live API
- **NEVER use `contextWindowCompression` in the WebSocket setup.** It causes 10-30 second response delays. The voice works fine without it.
- The WebSocket URL is: `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key={KEY}`
- Audio format: input 16kHz PCM mono, output 24kHz PCM mono
- Transcriptions are a side channel (`inputAudioTranscription`, `outputAudioTranscription`) — they come separately from the audio
- The `Orus` voice works well for all languages
- Free tier: ~20 requests/day for text generation (Flash). Live API WebSocket uses separate quota.
- Paid tier is cheap (~$0.55/day for 35 min of conversation)

### Kuroshiro (Japanese text processing)
- Must run in a **Web Worker** — dictionary parsing blocks the main thread and freezes the WebSocket
- The constructor is `self.Kuroshiro.default` (not `self.Kuroshiro`) — it's a UMD module
- `KuromojiAnalyzer` is a direct constructor (no `.default`)
- Dictionary path must be **relative** (`/dict/`), not absolute URL — kuromoji strips a slash from `http://`
- Dictionary files must be served locally, not from CDN — downloading 12MB during a WebSocket session competes for bandwidth
- The `unk_pos.dat.gz` file is needed but not always listed in examples — make sure to download it
- Per-word `kuroshiro.convert()` is slow — use a katakana→romaji lookup table for individual words instead

### Audio in the Browser
- Use `AudioWorklet` with inline Blob URL for mic capture
- Schedule playback chunks on a continuous `AudioContext` timeline (not individual `source.start()` per chunk) to avoid gaps
- Echo cancellation: `{ echoCancellation: true, noiseSuppression: true }` on `getUserMedia`
- Clean up previous sessions before starting new ones (close old WebSocket, stop old mic, close old AudioContext)

### What Makes This System Work
The core insight: **Gemini handles voice (fast, natural), everything else is post-processing.** Don't add API calls or heavy processing during the conversation — it will slow down the voice. All annotation, analysis, and card generation happens AFTER the session or during idle time.

The pipeline: Talk → Review (auto-generated) → Cards (Claude processes) → Anki (spaced repetition). Each step is independent. The voice session is sacred — never block it.

### Efficiency Tips for Claude
- **Research before building.** Search GitHub for existing implementations before writing from scratch.
- **Test visually.** If you can take screenshots, do it before and after every change.
- **When something breaks, build a minimal test page** to isolate the issue. Don't guess.
- **The user's instinct is usually right.** If they say "something feels off," investigate — don't dismiss.
- **Finish one feature completely before starting the next.** Context switching between half-done features wastes time.
