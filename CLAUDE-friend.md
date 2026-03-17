# Watson System — Build Your Own Personal Intelligence Network

This file tells you (Claude) everything you need to know about the Watson system so you can help the person reading this build their own version. They got this from a friend who already built it. Your job is to understand what exists, ask what they want, and help them implement it piece by piece.

**Important:** This system is modular. The user does NOT need everything. Start by asking what they want, then build only that.

---

## What is Watson?

Watson is a personal productivity and learning system built around Claude Code. It's named after Sherlock Holmes' partner because the architecture follows a detective metaphor — agents that gather intelligence, a brain that reasons about it, and an accountability system that keeps you honest.

The system was built by a college student to solve real problems: staying on top of coursework, learning languages, tracking health patterns, and most importantly, following through on commitments. Everything runs locally on a Mac. Privacy-first — no cloud services required (though optional sync exists).

---

## The Architecture (Sherlock Cast)

| Agent | Role | What It Actually Is |
|-------|------|-------------------|
| **Watson** | The brain — reasons, tutors, builds flashcards, generates reports | Claude Code with memory and CLAUDE.md context |
| **The Irregulars** | Gather raw data from various sources | Cron scripts, browser automation (Playwright), API scrapers |
| **Moriarty** | Accountability — compares what you said you'd do vs what you did | Cron script that reads calendar + screen data, generates gap reports |
| **Vik** | Long-term memory with semantic search | OpenViking (open source context database by ByteDance) |
| **Mycroft** | Permanent archive storage | NAS or external drive |
| **Sam** | Eyes and ears — captures what happens on screen | Screenpipe (open source screen + audio capture) |

---

## Modules (Pick What You Want)

### 1. Voice Language Tutor (Watson Tutor)
**What:** A web app where you have real voice conversations in a new language. The tutor corrects you in real time, tracks your weak points across sessions, and auto-generates flashcards.

**Languages:** Spanish, Japanese, Arabic, Russian (more can be added)

**Key features:**
- Real-time voice conversation via Gemini Live API
- Pronunciation breakdown and word-by-word translation after each tutor response
- Japanese: furigana, romaji, pitch accent analysis
- Spaced repetition flashcard review (FSRS algorithm) built into the app
- Weakness tracking that carries across sessions
- Guided mode (tutor steers toward your gaps) or Freeform (just chat)
- Session debrief report after every conversation
- Cloud sync via Firebase (optional — sign in with Google)

**How to set up:**
- Web: Open https://georgeimuro.github.io/watson-tutor/
- Get a free Gemini API key at https://aistudio.google.com/apikey
- iPhone: Open the link in Safari → Share → Add to Home Screen
- Mac app: Download from GitHub Releases

**Flashcard pipeline (optional, uses Claude Code):**
- After a voice session, the app auto-downloads a review file
- User tells Claude "make my cards"
- Claude reads the review, generates Anki cards with audio pronunciation (edge-tts), etymology, and mnemonics
- Cards pushed directly to Anki via AnkiConnect plugin

**Tech stack:** Single HTML file, Gemini Live API (WebSocket), Web Workers for Japanese processing, localStorage + optional Firebase for persistence, Tauri for native Mac app.

---

### 2. Data Scraping Pipeline (The Irregulars)
**What:** Automated scrapers that pull data from school platforms and feed it into your study system.

**Common targets:**
- **LMS platforms** (Canvas, Moodle, Blackboard) — assignment scores, due dates, course materials
- **Lecture recording platforms** (Panopto, Kaltura) — transcripts, AI summaries, chapter markers
- **Homework platforms** (Mastering Chemistry, WebAssign, etc.) — scores, question details, wrong answers
- **Email** (Outlook, Gmail) — school announcements, deadlines

**How it works:**
- Playwright (headless browser automation) handles login and navigation
- Network tab inspection reveals hidden APIs (most platforms have JSON endpoints that are easier than scraping HTML)
- Cron jobs run the scrapers on a schedule (e.g., 3x daily)
- Data saved as JSON files that Watson can read and reason about

**Key lessons learned:**
- Always check for APIs before scraping HTML — most platforms have REST endpoints
- Use the browser network tab to discover endpoints
- Session cookies from browser login can be reused in fetch() calls
- Some content is client-side rendered — needs Playwright to navigate and wait for render
- Cross-origin rules mean some downloads need to happen in the browser context

**Ask the user:** What school platforms do they use? What data would be most valuable? Grades? Lecture transcripts? Assignment details?

---

### 3. Morning Dashboard
**What:** An HTML page that displays at wake-up with everything you need to know for the day.

**Can include:**
- Today's calendar events
- Weather
- Study priorities (based on upcoming exams and weak areas)
- Anki review count
- Unread emails or announcements
- Watson's observations (patterns noticed, reminders)

**How it works:**
- An overnight cron job (e.g., 11 PM) runs a Python script that gathers data and generates a JSON content file
- A morning cron job (e.g., 5:30 AM) opens the dashboard HTML in fullscreen
- macOS `pmset` can wake the computer automatically
- The HTML reads the pre-generated JSON — no API calls at render time

**Ask the user:** What would be most useful to see first thing in the morning? What time do they wake up?

---

### 4. Accountability System (Moriarty)
**What:** Compares what you committed to doing vs what you actually did. Not a productivity tracker — an integrity mirror.

**Inputs:**
- Calendar events (what was scheduled)
- Stated intentions (task lists, daily plans)
- Screen capture data (what actually happened, with timestamps) — requires Sam/Screenpipe

**Output:** A gap report. Example:
> "You planned to study biology from 2-5 PM. You studied biology from 2-3:15, then spent 1:45 in Terminal and GitHub."

No judgment. Just facts. The goal is self-awareness.

**Common patterns it catches:**
- Tool/system building during committed study time
- Rapid app switching with no sustained focus
- Starting a study session then drifting to something else
- Staying up late researching instead of sleeping

**Ask the user:** What commitments do they want to track? Are they comfortable with screen capture? What does accountability look like for them?

---

### 5. Screen + Audio Capture (Sam)
**What:** Continuous capture of screen content and audio (lectures, podcasts, conversations in target language).

**Uses Screenpipe (open source):**
- OCR of screen content every few seconds
- Audio transcription via Whisper (local, private)
- Searchable database of everything you see and hear
- API at localhost:3030 for programmatic access

**Use cases:**
- Auto-transcribe lectures (just have your laptop open)
- Capture vocabulary from foreign language media
- Feed Moriarty with actual screen activity data
- Search "what was I looking at when I saw that equation?"

**Important notes:**
- whisper-large-v2 is recommended (v3 has translation bugs with non-English audio)
- Single language mode works better than multilingual
- Config changes require quit → write config → relaunch

**Ask the user:** Do they want screen capture? Audio capture? Both? What's their comfort level with continuous monitoring?

---

### 6. Semantic Memory (Vik / OpenViking)
**What:** A context database that indexes all your data and makes it searchable by meaning, not just keywords.

**How it works:**
- Ingests text files, JSON, PDFs, transcripts
- Creates vector embeddings for semantic search
- Tiered loading: L0 (one-sentence summary) → L1 (paragraph) → L2 (full content)
- Keeps token usage low — only loads what's relevant

**What to index:**
- Lecture transcripts
- Assignment data and scores
- Study notes
- Session reviews from Watson Tutor
- Screen capture summaries
- Health/fitness data

**Why it matters:**
- Cross-domain queries: "How does my sleep affect my study performance?"
- Watson can reason about your full history without loading everything into context
- Cheap retrieval — embeddings are nearly free compared to sending full documents to Claude

**Ask the user:** What data do they already have that could be indexed? Notes? Transcripts? Exported data?

---

### 7. Study Engine
**What:** An adaptive study system that uses all the data above to optimize learning.

**Components:**
- Gap analysis: identify what you don't know based on assignment scores and review performance
- Intervention ladder: different strategies based on gap type (conceptual vs. memorization vs. application)
- Anki card generation with etymology, mnemonics, and audio
- Cross-course pattern recognition
- Pre-generated teaching content (Watson explains topics, then tests you)

**Flashcard format:**
- Audio auto-plays on front (pronunciation)
- Back has: meaning, etymology, mnemonic, context sentence
- Images for visual/structural content (diagrams, mechanisms, etc.)
- Cards pushed to Anki via AnkiConnect API (localhost:8765)

**Ask the user:** What subjects? What's their preferred study style? Do they already use Anki?

---

### 8. Health + Fitness Tracking
**What:** Pull health data (sleep, steps, heart rate, workouts) and correlate with study performance.

**Data sources:**
- Apple Health (via Claude iOS app or export)
- Fitness apps (Hevy, Strong, etc.)
- Sleep tracking

**Correlations to track:**
- Sleep duration vs. next-day Anki retention
- Workout days vs. focus quality
- Activity level vs. study session length

**Ask the user:** Do they track health data? What would be useful to correlate?

---

## How to Help the User

### First Conversation
1. Explain that Watson is modular — they don't need everything
2. Ask what problems they're trying to solve (study better? learn a language? stay accountable? all of the above?)
3. Ask what tools they already use (Anki? calendar app? note-taking app?)
4. Ask about privacy comfort level:
   - **Minimal:** Just the voice tutor + flashcards. Everything in browser, nothing on disk.
   - **Standard:** Add scrapers, dashboard, Anki pipeline. Data on their machine, no screen capture.
   - **Full:** Everything including Screenpipe, Moriarty, Vik. Maximum intelligence, maximum data collection.
5. Start with ONE module. Get it working. Then add more.

### Technical Requirements
- **Mac** (most scripts assume macOS — can be adapted for Linux)
- **Claude Code** (this is the brain — Pro plan recommended for heavy use)
- **Python 3** (for scripts, scrapers, TTS)
- **Homebrew** (for installing dependencies on Mac)
- **Anki + AnkiConnect** (if using flashcard pipeline)
- **Free Gemini API key** (for Watson Tutor voice conversations)

### Key Principles
- **Privacy first.** Everything runs locally unless the user explicitly opts into cloud sync.
- **Build incrementally.** One module at a time. Don't overwhelm.
- **Finish before starting.** Get each piece working before moving to the next.
- **Research before building.** Search for existing tools/libraries before writing from scratch.
- **The user's data is theirs.** Never send data to external services without explicit permission.

---

## Cron Job Patterns

Common automation schedule:
| Time | Task |
|------|------|
| Late night | Overnight pipeline: gather data, generate content, run gap analysis |
| Early morning | Open dashboard, refresh display |
| Multiple times daily | Scrape email/LMS for new announcements |
| End of day | Moriarty accountability report |

Use `crontab -e` to set up. Use `pmset` on Mac to wake the computer for overnight jobs.

---

## File Organization

Recommended structure:
```
~/watson/              — Scripts, config, automation
~/Documents/Vault/     — Notes, study materials, data files
~/Documents/Vault/data/ — Scraped data (JSON, transcripts, screenshots)
~/.claude/             — Claude Code memory and project config
```

Watson (Claude) reads from the vault. Scripts write to it. Clean separation.

---

## Getting Started Checklist

1. [ ] Install Claude Code
2. [ ] Decide which modules to start with
3. [ ] Set up the first module (Watson Tutor is the easiest entry point)
4. [ ] Get comfortable with the workflow before adding more
5. [ ] Gradually build up the system as needs become clear

The whole point is that this grows with you. Start simple. Let Watson help you build the rest.
