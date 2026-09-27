---
name: script-guided-cut
description: Trim a raw talking-head recording down to its script. Use when the user provides a raw video plus the script of what the finished video should say and wants dead air, mistakes, false starts, filler and unwanted retakes cut out. Transcribes the video, aligns the transcription to the script, keeps the best take of each script line, shows the cut plan for approval, then renders the trimmed MP4.
---

# Script-guided cut

Turn a raw recording into a tight edit using the script as the answer key.

- **The script** says what the finished video should contain.
- **The transcription** says where each spoken word is in the raw footage.
- Together they tell you exactly what to keep and what to cut. Anything that is
  not the best take of a script line gets cut.

## Inputs and outputs

**Inputs (from the user):**
- The raw video, e.g. `videos/<name>/raw.mp4`
- The script, e.g. `videos/<name>/script.md` (plain text is fine)

**Outputs (all in `videos/<name>/`):**
- `raw.words.json`: word-level transcription of the raw video
- `cut-plan.md`: the line-by-line plan the user approves
- `<name>.cut.mp4`: the trimmed video
- `cut-report.md`: what was kept, what was cut, and the before/after length

Never modify or overwrite `raw.mp4`.

## Tools

Everything is already in this repo:

| Job | Tool |
|---|---|
| Transcribe to word timestamps | `node .claude/skills/media-use/scripts/transcribe.mjs` (wraps `npx hyperframes transcribe`) |
| Cut and join segments | `node .claude/skills/media-use/scripts/transcript-cut.mjs` |
| Find real silences | `ffmpeg ... silencedetect` |
| Probe durations | `ffprobe` |

`transcript-cut.mjs` adds 30ms audio fades at every join, so cuts don't click.
Don't use its `--copy` flag. It snaps cuts to keyframes and can swallow them.

---

## Step 0: Check the setup

```bash
npx hyperframes doctor
```

You need **FFmpeg** and a **transcription engine** (`whisper-cpp`, or Parakeet
on Apple Silicon). If both engines show ✗, stop and tell the user. Transcription
is required. Don't try to guess timings without it.

## Step 1: Prepare the script

1. Read the script and split it into **numbered lines**, one sentence (or one
   short beat) per line. Drop stage directions, headings and notes like
   `[B-roll]` or `(pause)`. They aren't spoken.
2. Save the numbered list at the top of `cut-plan.md`:

   ```
   L1  Most consultants post content and chase clients as two separate jobs.
   L2  That's the mistake.
   L3  ...
   ```

## Step 2: Transcribe the raw video

```bash
node .claude/skills/media-use/scripts/transcribe.mjs \
  --input videos/<name>/raw.mp4 --out videos/<name>/raw.words.json
```

The output is `{ "text": ..., "words": [{ "text", "start", "end" }, ...] }`,
with times in seconds.

Sanity-check it before going on:
- The last word's `end` should be close to the video length (`ffprobe`).
- Most of the script's words should appear in the text. If whole sections are
  missing or garbled, re-run with a larger Whisper model before aligning
  anything. `transcribe.mjs` doesn't pass a Whisper model through, so call the
  CLI directly. It writes `transcript.json` into `--dir`:

  ```bash
  mkdir -p videos/<name>/asr
  npx hyperframes transcribe videos/<name>/raw.mp4 --model medium.en --dir videos/<name>/asr
  cp videos/<name>/asr/transcript.json videos/<name>/raw.words.json
  ```

  `transcript-cut.mjs` accepts either a bare word array or `{ "words": [...] }`.
  If the file is a bare array, change `.words` to nothing in the print command
  below.

Then print the words **with their index numbers**. You will refer to words by
index for the rest of the job:

```bash
node -e '
const w = require("./videos/<name>/raw.words.json").words;
w.forEach((x, i) => console.log(`[${i}] ${x.start.toFixed(2)}-${x.end.toFixed(2)} ${x.text}`));
' > videos/<name>/raw.words.txt
```

## Step 3: Map real silences

Transcription timestamps can be off by a tenth of a second or so, and Whisper
sometimes skips stutters and false starts entirely. Cut points should land in
real silence, so map it:

```bash
ffmpeg -hide_banner -i videos/<name>/raw.mp4 -af silencedetect=noise=-35dB:d=0.25 -f null - 2>&1 \
  | grep -E "silence_(start|end)"
```

Keep this list next to the word list. If almost nothing is detected (a noisy
room), raise `noise` to `-30dB`.

## Step 4: Align the transcription to the script

Go through the script **one line at a time, in order**. For each line:

1. **Find every take.** A take is a run of transcribed words that matches the
   script line. Match loosely. People paraphrase slightly, and transcription
   misspells names and jargon. A take matches if it says the same thing with
   roughly the same words.
2. **Classify each take:**
   - **Complete**: the whole line was said.
   - **Broken**: started, then stopped or restarted ("Most consultants post...
     no wait. Most consultants...").
   - **Flubbed**: finished, but with a stumble, a wrong word, or a
     self-correction in the middle.
3. **Pick the keeper:**
   - Use the **last complete, clean take**. People redo a line because the
     earlier take was wrong, so the last one is usually what they meant.
   - If the last take is broken or flubbed, use the latest clean one before it.
   - If no take is clean, use the least-bad complete one and **flag it** in the
     plan.
   - If the line was never said, mark it **MISSING**. Never fill the gap with
     something else.
4. Record the keeper as a word-index range, e.g. `L3 → words 212-230`.

**Also catch spoken content that matches no script line** (ad-libs, asides,
"let me try that again", talking to someone off-camera). Cut it by default, but
list every one in the plan. If a passage sounds like a deliberate addition that
fits the script, flag it as **"keep?"** and let the user decide.

## Step 5: Turn keepers into keep ranges

For each keeper take, from its first word to its last:

- **Start** = first word's `start` − 0.10s
- **End** = last word's `end` + 0.20s
- If a detected silence overlaps either edge, move the edge into the middle of
  that silence instead.
- **Never let padding reach a word you are cutting.** If the previous word
  belongs to a discarded take, clamp the start to just after that word ends.

Then clean up inside and between keepers:

- **Filler words** ("um", "uh") that aren't in the script: cut them out of the
  keeper when there's at least 0.15s of silence on each side. If they're
  jammed right against real words, leave them in. A clipped word sounds worse
  than an "um".
- **Long pauses inside a keeper**: shorten any gap over 0.8s to about 0.4s.
  Don't remove every pause. Natural breathing room keeps it from sounding
  robotic.
- **Adjacent keepers**: if two consecutive script lines were recorded back to
  back and the gap between them is under 0.6s, merge them into one range.

## Step 6: Write the cut plan and get approval

Write `cut-plan.md` like this, then **stop and show it to the user**. Don't
render until they approve or adjust it.

```markdown
## Summary
Raw 6:42 → estimated 2:31 · 14 script lines · 12 clean, 1 flagged, 1 missing

## Line by line
| Line | Kept take | Time in raw | Other takes cut | Notes |
|---|---|---|---|---|
| L1 | words 4-15 | 0:01.8-0:05.2 | — | |
| L2 | words 40-43 | 0:14.1-0:15.0 | 2 (0:07.4, 0:10.9 broken) | |
| L5 | words 120-141 | 0:48.2-0:55.9 | 1 | ⚠ stumble on "prospecting", no clean take |
| L9 | — | — | — | ❌ MISSING, never said |

## Unscripted speech (cut unless you say keep)
- 1:12.4-1:15.0 "hold on, my phone" → cut
- 3:40.2-3:47.8 "and honestly this works for agencies too" → keep?
```

Apply whatever the user changes before moving on.

## Step 7: Render

Build the approved keep ranges as a comma-separated list of `start-end` in
seconds. **Preview the plan first:**

```bash
node .claude/skills/media-use/scripts/transcript-cut.mjs \
  --input videos/<name>/raw.mp4 --transcript videos/<name>/raw.words.json \
  --keep "1.7-5.4,14.0-15.2,..." --plan
```

Check that the segment count and total match your plan (`--plan` drops
segments under 0.2s and merges overlapping ones). Then render:

```bash
node .claude/skills/media-use/scripts/transcript-cut.mjs \
  --input videos/<name>/raw.mp4 --transcript videos/<name>/raw.words.json \
  --keep "1.7-5.4,14.0-15.2,..." --out videos/<name>/<name>.cut.mp4 --json
```

**Order caveat:** `transcript-cut` always joins segments in the order they
appear in the raw video. That is right almost every time, because people
record in script order. If a keeper appears *earlier* in the raw than the line
before it (e.g. they re-recorded line 3 at the very end), render each
out-of-order part separately with `--keep`, then join the parts in script order
with ffmpeg's concat demuxer. Say so in the report.

## Step 8: Verify

Don't hand it over until these pass:

1. **Re-transcribe the output** and compare it to the script, line by line.
   Every script line (except MISSING ones) should appear exactly once, in
   order, with no leftover false starts or doubled phrases. Fix and re-render
   if not.
2. **Check the edges.** The first and last words of every kept segment should
   be whole in the new transcription. A clipped first or last word means the
   padding was too tight at that cut.
3. **Check the length.** `ffprobe` the output. It should be within about a
   second of the planned total.
4. Optionally, grab a frame on each side of every cut
   (`ffmpeg -ss <t> -frames:v 1`) to spot jarring jump cuts the user may want
   to cover with a zoom or B-roll later.

## Step 9: Deliver

Give the user:
- The path to `<name>.cut.mp4`
- The before/after length
- Everything flagged: MISSING lines, lines with no clean take, any "keep?"
  passages, any out-of-order joins

Write the same into `cut-report.md`.

---

## Rules

- The script decides what stays. Don't keep unscripted material unless the
  user approves it.
- Always get plan approval (Step 6) before rendering.
- Never overwrite the raw video.
- Never invent or rearrange words to cover a MISSING line. Report it.
- Cuts land in silence, never mid-word.
- When unsure whether a take is clean, keep the later one and flag it rather
  than silently guessing.

## Next steps after the cut

The trimmed video is the input for everything else. For captions use
`/embedded-captions`; for lower-thirds and overlays use `/talking-head-recut`.
Both are installed on demand through the `/hyperframes` skill.
