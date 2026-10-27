#!/usr/bin/env node

require("dotenv").config();
const Anthropic = require("@anthropic-ai/sdk");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const chalk = require("chalk");

const orange = chalk.hex("#FFA500");
const brown = chalk.hex("#A0522D");

const QC_DIR = path.join(__dirname, "qc");
const LOG_PATH = path.join(__dirname, "log", "qc-log.md");
const LESSONS_PATH = path.join(QC_DIR, "lessons.md");
const BENCH = JSON.parse(fs.readFileSync(path.join(QC_DIR, "benchmarks.json"), "utf8"));
const CRITERIA = ["artifacts", "consistency", "prompt_match", "hook", "composition"];

// ---------- 1. Technical checks: plain code, no AI ----------

function run(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (r.error) throw new Error(`${cmd} isn't installed or isn't on PATH.`);
  return r;
}

function probe(file) {
  const r = run("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", file]);
  if (r.status !== 0) throw new Error(`Can't read ${file}: ${r.stderr.trim()}`);
  const data = JSON.parse(r.stdout);
  const video = data.streams.find((s) => s.codec_type === "video");
  if (!video) throw new Error(`${file} has no video stream.`);
  const [num, den] = (video.avg_frame_rate || "0/1").split("/").map(Number);
  return {
    width: video.width,
    height: video.height,
    fps: den ? num / den : 0,
    duration: Number(data.format.duration),
    hasAudio: data.streams.some((s) => s.codec_type === "audio"),
  };
}

// One decoding pass: black frames, frozen frames, shot changes, loudness.
function analyze(file, hasAudio) {
  const args = ["-hide_banner", "-nostats", "-i", file,
    "-vf", "blackdetect=d=0.1:pix_th=0.10,freezedetect=n=-60dB:d=0.5,select='gt(scene\\,0.4)',showinfo"];
  if (hasAudio) args.push("-af", "ebur128=peak=true");
  args.push("-f", "null", "-");
  const err = run("ffmpeg", args).stderr;

  const sum = (re) => [...err.matchAll(re)].reduce((t, m) => t + Number(m[1]), 0);
  const cuts = [...err.matchAll(/Parsed_showinfo.*pts_time:([\d.]+)/g)].map((m) => Number(m[1]));
  const summary = err.slice(err.lastIndexOf("Summary:"));
  const lufs = hasAudio ? summary.match(/I:\s+(-?[\d.]+) LUFS/) : null;
  const peak = hasAudio ? summary.match(/Peak:\s+(-?[\d.]+|-inf) dBFS/) : null;
  return {
    blackSec: sum(/black_duration:([\d.]+)/g),
    frozenSec: sum(/freeze_duration: ?([\d.]+)/g),
    cuts,
    loudness: lufs ? Number(lufs[1]) : null,
    truePeak: peak && peak[1] !== "-inf" ? Number(peak[1]) : null,
  };
}

function technicalChecks(meta, a) {
  const t = BENCH.technical;
  const checks = [];
  const add = (name, ok, value, fix) => checks.push({ name, ok, value, fix: ok ? null : fix });

  add("resolution", meta.width >= t.minWidth && meta.height >= t.minHeight, `${meta.width}x${meta.height}`,
    `Export at ${t.minWidth}x${t.minHeight} or higher.`);
  const [aw, ah] = t.aspect.split(":").map(Number);
  add("aspect", Math.abs(meta.width / meta.height - aw / ah) <= t.aspectTolerance, (meta.width / meta.height).toFixed(3),
    `Generate or crop to ${t.aspect}.`);
  add("duration", meta.duration >= t.minDurationSec && meta.duration <= t.maxDurationSec, `${meta.duration.toFixed(1)}s`,
    `Keep length between ${t.minDurationSec}s and ${t.maxDurationSec}s.`);
  add("fps", meta.fps >= t.minFps, meta.fps.toFixed(2), `Export at ${Math.ceil(t.minFps)} fps or higher.`);
  if (t.requireAudio) add("audio", meta.hasAudio, meta.hasAudio ? "present" : "missing", "Add a voice or music track.");
  if (meta.hasAudio && a.loudness !== null) {
    const [lo, hi] = t.loudnessLufs;
    add("loudness", a.loudness >= lo && a.loudness <= hi, `${a.loudness} LUFS`,
      `Normalize to ${lo} to ${hi} LUFS (ffmpeg loudnorm=I=${(lo + hi) / 2}).`);
  }
  if (a.truePeak !== null) add("true peak", a.truePeak <= t.maxTruePeakDb, `${a.truePeak} dBFS`,
    `Limit peaks to ${t.maxTruePeakDb} dBFS.`);
  add("black frames", a.blackSec <= t.maxBlackSec, `${a.blackSec.toFixed(2)}s`, "Trim black frames at the start, end or cuts.");
  add("frozen frames", a.frozenSec <= t.maxFrozenSec, `${a.frozenSec.toFixed(2)}s`,
    "Regenerate or cut the frozen section; AI clips often stall at the end.");
  return checks;
}

// ---------- 2. Frame sampling ----------

function sampleTimes(duration) {
  const { hookFrames, bodyFrames } = BENCH.frames;
  const hookEnd = Math.min(BENCH.technical.hookWindowSec, duration);
  const times = [];
  for (let i = 0; i < hookFrames; i++) times.push((hookEnd * (i + 0.5)) / hookFrames);
  for (let i = 0; i < bodyFrames; i++) times.push(hookEnd + ((duration - hookEnd) * (i + 0.5)) / bodyFrames);
  return times.filter((t) => t < duration);
}

function extractFrames(file, times, dir) {
  return times.map((t, i) => {
    const out = path.join(dir, `f${i}.jpg`);
    run("ffmpeg", ["-v", "error", "-y", "-ss", t.toFixed(2), "-i", file, "-frames:v", "1",
      "-vf", `scale=${BENCH.frames.width}:-2`, "-q:v", "4", out]);
    return { t, data: fs.readFileSync(out).toString("base64") };
  });
}

function referenceImages(dir) {
  if (!dir) return [];
  return fs.readdirSync(dir).filter((f) => /\.(jpe?g|png)$/i.test(f)).slice(0, 4).map((f) => ({
    name: f,
    media_type: /\.png$/i.test(f) ? "image/png" : "image/jpeg",
    data: fs.readFileSync(path.join(dir, f)).toString("base64"),
  }));
}

// ---------- 3. Visual review: the AI judgment ----------

const REVIEW_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["scores", "issues", "summary"],
  properties: {
    scores: {
      type: "object",
      additionalProperties: false,
      required: CRITERIA,
      properties: Object.fromEntries(CRITERIA.map((c) => [c, { type: "integer" }])),
    },
    issues: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["criterion", "timestamp", "problem", "fix"],
        properties: {
          criterion: { type: "string", enum: CRITERIA },
          timestamp: { type: "string" },
          problem: { type: "string" },
          fix: { type: "string" },
        },
      },
    },
    summary: { type: "string" },
  },
};

function fmt(t) {
  return `0:${t.toFixed(1).padStart(4, "0")}`;
}

async function visualReview(frames, refs, technical, prompt) {
  const client = new Anthropic();
  const lessons = fs.existsSync(LESSONS_PATH) ? fs.readFileSync(LESSONS_PATH, "utf8") : "";
  const system = `${fs.readFileSync(path.join(QC_DIR, "agent.md"), "utf8")}\n\n## Lessons\n\n${lessons}`;

  const content = [];
  if (refs.length) {
    content.push({ type: "text", text: "Reference frames from approved clips (the quality bar):" });
    for (const r of refs) content.push({ type: "image", source: { type: "base64", media_type: r.media_type, data: r.data } });
  }
  content.push({ type: "text", text: "Frames from the clip under review:" });
  for (const f of frames) {
    content.push({ type: "text", text: `Frame at ${fmt(f.t)}${f.t < BENCH.technical.hookWindowSec ? " (hook)" : ""}` });
    content.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: f.data } });
  }
  content.push({
    type: "text",
    text: [
      `<technical_report>\n${JSON.stringify(technical, null, 2)}\n</technical_report>`,
      `<prompt_or_script>\n${prompt || "(none given)"}\n</prompt_or_script>`,
      `Minimum scores to pass: ${JSON.stringify(BENCH.visual.minScore)}`,
      "Review the clip.",
    ].join("\n\n"),
  });

  const response = await client.beta.messages.create({
    model: "claude-opus-5-5",
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "high", format: { type: "json_schema", schema: REVIEW_SCHEMA } },
    system,
    messages: [{ role: "user", content }],
  });

  if (response.stop_reason === "refusal") throw new Error("The reviewer declined to review this clip.");
  if (response.stop_reason === "max_tokens") throw new Error("The review was cut off; try again.");
  const text = response.content.find((b) => b.type === "text");
  const review = JSON.parse(text.text);
  for (const c of CRITERIA) review.scores[c] = Math.max(1, Math.min(10, review.scores[c]));
  return review;
}

// ---------- 4. Verdict, report, log ----------

function verdict(technical, review) {
  const failedChecks = technical.filter((c) => !c.ok);
  const lowScores = review
    ? CRITERIA.filter((c) => review.scores[c] < BENCH.visual.minScore[c])
    : [];
  return { pass: failedChecks.length === 0 && lowScores.length === 0, failedChecks, lowScores };
}

function fixList(v, review) {
  const fixes = v.failedChecks.map((c) => `[${c.name}] ${c.fix}`);
  if (review) {
    for (const i of review.issues) {
      if (v.lowScores.includes(i.criterion)) fixes.push(`[${i.criterion} @ ${i.timestamp}] ${i.fix}`);
    }
  }
  return fixes;
}

function printReport(file, meta, a, technical, review, v, fixes) {
  console.log("\n" + orange.bold(`QC: ${path.basename(file)}`));
  console.log(brown(`${meta.width}x${meta.height} · ${meta.duration.toFixed(1)}s · ${meta.fps.toFixed(1)} fps · ${a.cuts.length} shot changes\n`));
  console.log(orange("Technical (code)"));
  for (const c of technical) console.log(`  ${c.ok ? chalk.green("✓") : chalk.red("✗")} ${c.name.padEnd(14)} ${c.value}`);
  if (review) {
    console.log("\n" + orange("Visual (AI reviewer)"));
    for (const c of CRITERIA) {
      const s = review.scores[c];
      const ok = s >= BENCH.visual.minScore[c];
      console.log(`  ${ok ? chalk.green("✓") : chalk.red("✗")} ${c.padEnd(14)} ${s}/10 (min ${BENCH.visual.minScore[c]})`);
    }
    console.log("\n" + brown(review.summary));
  }
  console.log("\n" + (v.pass ? chalk.green.bold("PASS") : chalk.red.bold("FAIL")));
  if (fixes.length) {
    console.log(orange("\nFixes"));
    fixes.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
  }
  console.log();
}

function appendLog(file, prompt, v, review, fixes) {
  const now = new Date();
  const stamp = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`;
  const scores = review ? CRITERIA.map((c) => `${c} ${review.scores[c]}`).join(", ") : "visual review skipped";
  const lines = [
    `## [${stamp}] | ${path.basename(file)} | ${v.pass ? "PASS" : "FAIL"}`,
    "",
    prompt ? `**Prompt:** ${prompt.split(" ").slice(0, 20).join(" ")}` : null,
    `**Scores:** ${scores}`,
    review ? `**Summary:** ${review.summary}` : null,
    fixes.length ? `**Fixes:**\n${fixes.map((f) => `- ${f}`).join("\n")}` : null,
    "",
    "---",
    "",
  ].filter((l) => l !== null);
  fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
  fs.appendFileSync(LOG_PATH, lines.join("\n") + "\n");
}

// ---------- CLI ----------

function parseArgs(argv) {
  const opts = { files: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--prompt") opts.prompt = argv[++i];
    else if (a === "--prompt-file") opts.prompt = fs.readFileSync(argv[++i], "utf8");
    else if (a === "--ref") opts.ref = argv[++i];
    else if (a === "--no-ai") opts.noAi = true;
    else if (a === "--json") opts.json = true;
    else if (a === "--lesson") opts.lesson = argv[++i];
    else opts.files.push(a);
  }
  return opts;
}

async function qc(file, opts) {
  const meta = probe(file);
  const a = analyze(file, meta.hasAudio);
  const technical = technicalChecks(meta, a);

  let review = null;
  if (!opts.noAi) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "qc-"));
    try {
      const frames = extractFrames(file, sampleTimes(meta.duration), dir);
      review = await visualReview(frames, referenceImages(opts.ref), technical, opts.prompt);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }

  const v = verdict(technical, review);
  const fixes = fixList(v, review);
  appendLog(file, opts.prompt, v, review, fixes);
  if (opts.json) console.log(JSON.stringify({ file, pass: v.pass, meta, cuts: a.cuts, technical, review, fixes }, null, 2));
  else printReport(file, meta, a, technical, review, v, fixes);
  return v.pass;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.lesson) {
    fs.appendFileSync(LESSONS_PATH, `- ${new Date().toISOString().slice(0, 10)}: ${opts.lesson}\n`);
    console.log(chalk.green("Lesson saved. The reviewer will apply it from the next run."));
    return;
  }
  if (!opts.files.length) {
    console.log(`Usage:
  node qc.js clip.mp4 [more.mp4 ...] [--prompt "what it should show" | --prompt-file f.txt]
                      [--ref folder-of-approved-frames] [--no-ai] [--json]
  node qc.js --lesson "rule the reviewer should follow from now on"

Exit code is 0 when every clip passes, 1 otherwise, so other scripts can retry failed clips.`);
    return;
  }

  if (!opts.noAi && !process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    console.error(chalk.red("No ANTHROPIC_API_KEY found in .env. Add it, or use --no-ai to run the code checks only."));
    process.exitCode = 1;
    return;
  }

  let allPass = true;
  for (const file of opts.files) {
    try {
      allPass = (await qc(file, opts)) && allPass;
    } catch (err) {
      allPass = false;
      if (err instanceof Anthropic.AuthenticationError) console.error(chalk.red("Invalid or missing ANTHROPIC_API_KEY. Use --no-ai for code checks only."));
      else if (err instanceof Anthropic.RateLimitError) console.error(chalk.red("Rate limited by the API. Try again shortly."));
      else if (err instanceof Anthropic.APIError) console.error(chalk.red(`API error ${err.status}: ${err.message}`));
      else console.error(chalk.red(`${file}: ${err.message}`));
    }
  }
  process.exitCode = allPass ? 0 : 1;
}

main();
