# content-CLI

A local CLI tool that turns a raw idea into X post variants and a client prospecting angle — simultaneously, in one command.

Built for solo consultants who want to generate content and surface business leads from the same thinking, without switching tools.

---

## What it does

Drop a raw idea into the terminal. Get back:

- **3 X post variants** — short/punchy, example-led, and observation-framed
- **A prospecting angle** — target niche, pain point, outreach framing, and example prospect type
- **An auto-logged entry** in `/log/content-log.md` with a timestamp

Every run compounds. The log becomes a searchable content and lead database over time.

---

## Stack

- Node.js
- Anthropic Claude API (`claude-sonnet-4-6`)
- Local markdown file for storage — no database, no cloud

---

## Setup

```bash
git clone https://github.com/EarlTrapo/content-CLI.git
cd content-CLI
npm install
```

Create a `.env` file in the root:

```
ANTHROPIC_API_KEY=your_key_here
```

---

## Usage

```bash
node engine.js "your raw idea here"
```
## Demo
![demo](assets/demo.png)

**Flags:**

```bash
node engine.js --list              # print last 5 log entries
node engine.js --search automation # search log by keyword
```

---

## Video QC agent

`qc.js` checks a video clip against your quality bar before you publish it, and says exactly what to fix when it fails. It works the same way for AI-generated clips (Seedance, Veo) and edited footage.

It runs in two stages:

1. **Code checks (no AI, free):** resolution, 9:16 aspect, length, frame rate, audio present, loudness (LUFS), true peak, black frames, frozen frames and shot changes. Measured with FFmpeg.
2. **AI review:** frames sampled from the clip (extra frames in the first 3 seconds for the hook) go to Claude, which scores artifacts, consistency, prompt match, hook and composition from 1 to 10. Every low score comes with a timestamp and a concrete fix.

Requires `ffmpeg` and `ffprobe` on your PATH.

```bash
node qc.js clip.mp4                                  # full check
node qc.js clip.mp4 --prompt "the prompt you used"   # also judge prompt match
node qc.js clip.mp4 --ref approved-frames/           # compare against frames from clips you liked
node qc.js *.mp4 --no-ai                             # code checks only, no API cost
node qc.js clip.mp4 --json                           # machine-readable output
node qc.js --lesson "Flag any text on screen that is misspelled"
```

The exit code is `0` when every clip passes and `1` otherwise, so a generation script can retry failed clips using the fixes.

| File | What it holds |
|---|---|
| `qc/benchmarks.json` | Your quality bar: technical limits and minimum visual scores. Edit freely |
| `qc/agent.md` | The reviewer's instructions: what it owns, method, gates, how to report |
| `qc/lessons.md` | Dated rules from your corrections, loaded on every run |
| `log/qc-log.md` | Every QC result with scores and fixes |

---

## Output format

Each run prints to terminal and appends to `/log/content-log.md`:

```
[YYYY-MM-DD HH:MM] | {first 8 words of idea}

Post variant 1 (short)
Post variant 2 (example-led)
Post variant 3 (question/observation)

Prospecting angle:
- Target niche
- Pain point
- Outreach angle
- Example prospect
```

---

## Why I built this

Content creation and prospecting are the same cognitive act — you're identifying a problem and framing it clearly. This tool runs both in parallel so neither gets skipped.
