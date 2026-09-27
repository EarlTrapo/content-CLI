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

---

## Video editing with HyperFrames

[HyperFrames](https://github.com/heygen-com/hyperframes) is installed as a dev dependency for turning HTML, CSS, media and animations into MP4 videos. Requires Node.js 22+ and FFmpeg.

```bash
npm install
npx hyperframes browser ensure        # one-time: downloads headless Chrome for rendering
npm run video:doctor                  # check FFmpeg, Chrome, etc.

cd videos
npx hyperframes init my-video         # scaffold a project (add --video clip.mp4 to start from footage)
cd my-video
npx hyperframes preview               # live preview in the browser
npx hyperframes render                # render to renders/*.mp4
```

The HyperFrames agent skills live in `.claude/skills/`, so in Claude Code you can just ask, e.g. *"Using /hyperframes, add captions to videos/raw/talk.mp4"*. Refresh them with `npx hyperframes skills update`.

In Claude Code on the web, `.claude/hooks/session-start.sh` installs npm packages, FFmpeg and the render browser automatically.
