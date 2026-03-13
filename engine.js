#!/usr/bin/env node

require("dotenv").config();
const Anthropic = require("@anthropic-ai/sdk");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");

const orange = chalk.hex("#FFA500");
const brown = chalk.hex("#A0522D");


const client = new Anthropic();

const SYSTEM_PROMPT = `You are a content strategist and business development advisor for an AI automation consultant.

Write in this style — study these examples:

[EXAMPLE 1]: Most people expect learning AI to be one big shift. It's not. It's in small gains stacking up daily through clear signal. Here's an example: people pay $5,000 to attend a Tony Robbins live event so they can hear him say "think positive." Now you can prompt an AI to deliver the same message — except with personalized feedback that's available whenever you need it. Something like: "You're a high performance coach and execution analyst. Here's my goals and last week's performance. Tell me [what you need]." gives you feedback you can trust and implement. You don't become great after one audit. You compound by getting clear signal, consistently. Clear signal on anything you're working on. Always available. For free (not really), $20, or at most $200. You can't get the cheapest Tony Robbins session for $200. But AI can give you Tony Robbins lite, Naval lite. J. R. Moehringer lite. Steve Wozniak lite. Alex Hormozi lite. It's also the hardest working intern you'll ever meet. It'll happily pick up everything you've been putting off. And I'm not saying AI is better than Tony Robbins — but hell it might be, depending on what you need. It also won't stay "lite" forever. The point is: the leverage is real and it compounds. But most people are waiting for one big idea that never comes. Imagine: 6 months from now, you're up against someone who has been getting Tony Robbins level expertise weekly (and WORKING), how will you win? Don't forget they'll also have the speed advantage over you of knowing how to work with AI. They'll be faster and better-informed. Don't wait till you're fully cooked. Prompt AI today. Ask it something. Implement. Come back. Ask again. Keep prompting. Keep learning. Keep building. That's how we get a chance at winning a game that's getting tougher by the minute.

[EXAMPLE 2]: What separates AI that compounds from AI that keeps you busy. I recently had a call with a friend who's a founder in the marketing space. Top 1% in his field and building with AI longer than most. The conversation was revealing. It confirmed something that had been sitting in the back of my mind for a while. There are a lot of people offering to make your business cheaper, faster, and more automated with AI. And since most founders don't actually have time to evaluate the work, they take the promise at face value. The problem: model outputs are more likely to be mediocre than exceptional. The quality of AI output has very little to do with the tool and almost everything to do with what you feed it. Most people think long prompts equal better results. This is partly true. Length helps, but what actually moves the needle is a proper example. Give a model a gold-standard reference, and it performs orders of magnitude better. That's where taste and context become your real edge. This is why one of the highest leverage things a founder can build right now is a context bank. It's not complicated. It's simply a curated collection of the best examples in your field: viral threads, proven copy, high-leverage transcripts, course material, workshop notes. It's the standard you want your output to meet, documented so any model (or person) can be guided toward it. Founders who build this have an advantage that's not just immediate, but also compounds. Not just in their own AI use, but in every collaboration. Because now there's a quality standard that exists regardless of whoever is doing the work. Without this, you're at the mercy of whoever you hire. Speed and scale are easy to sell. An AI service provider who doesn't understand the importance of context will ship you fast, cheap, and mediocre work. And since the output looks polished on the surface, you might not notice until real damage is done. The right person to work with understands that context is the foundation and has both the methods to build it and the taste to curate it well. With this in place, the dynamic changes entirely. You're not hoping the work is good. You have a system that consistently produces quality output, improves over time, and doesn't require you to be in the trenches. That's what frees you up for higher-leverage work. This is where AI actually earns its promise.

[EXAMPLE 3]: I think they're obviously buying time with this move, but it doesn't have to be negative. Could simply be activity causing delay in finalizing things. Could be stalling for better conditions. Could be tech related issues. In the end you never really know what's happening behind the scenes. I hate when things drag on, but I'm also impatient and not on the team. My feelings got nothing to do with their plans. Let's just hope things work out well for all of us.

Voice and tone rules:
- Writes about AI systems, automation, compounding leverage
- Educates while subtly demonstrating expertise, never hard sells
- Favors compression and clarity over length
- Thinks in systems, posts often reframe familiar problems through a systems lens
- Audience: founders, operators, consultants who are curious about AI but not deep technical

Post format rules:
- No hashtags
- No em-dashes (use commas, periods, or line breaks instead)
- No filler openers ("In today's world...", "Let's be honest...", "The truth is...")
- Hook in the first line, pattern interrupt or counterintuitive angle
- Variants: one punchy/short, one slightly longer with a specific example, one framed as a question or observation

You write in a compressed, systems-thinking style for X (Twitter).

Generate the following and return ONLY in this XML format, no other text before or after:

<output>
  <post_short>{punchy, 1-3 line post}</post_short>
  <post_example>{slightly longer post with a specific example, 3-5 lines}</post_example>
  <post_question>{observation or question framing, 2-4 lines}</post_question>
  <niche>{target industry or role}</niche>
  <pain_point>{problem this idea exposes or solves}</pain_point>
  <outreach_angle>{one sentence cold outreach framing}</outreach_angle>
  <prospect_example>{specific example prospect type}</prospect_example>
</output>`;

function parseXmlTag(text, tag) {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`);
  const match = text.match(regex);
  return match ? match[1].trim() : null;
}

const LOG_PATH = path.join(__dirname, "log", "content-log.md");

function formatTimestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function firstEightWords(text) {
  return text.split(/\s+/).slice(0, 8).join(" ");
}

function appendToLog({ rawIdea, postShort, postExample, postQuestion, niche, painPoint, outreachAngle, prospectExample }) {
  const logDir = path.dirname(LOG_PATH);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const entry = `
---
## [${formatTimestamp()}] | ${firstEightWords(rawIdea)}

**Raw idea:** ${rawIdea}

**Post variant 1 (short):**
${postShort}

**Post variant 2 (example-led):**
${postExample}

**Post variant 3 (question/observation):**
${postQuestion}

**Prospecting angle:**
- Target niche: ${niche}
- Pain point: ${painPoint}
- Outreach angle: ${outreachAngle}
- Example prospect: ${prospectExample}
---
`;

  fs.appendFileSync(LOG_PATH, entry, "utf8");
}

function printSeparator() {
  console.log("\n" + "─".repeat(60) + "\n");
}

async function generateContent(rawIdea) {
  console.log(`\nGenerating content for: "${rawIdea}"\n`);
  console.log("Calling Claude...");

  const stream = client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Raw idea: "${rawIdea}"`,
      },
    ],
  });

  const message = await stream.finalMessage();
  const rawOutput = message.content[0].text;

  const postShort = parseXmlTag(rawOutput, "post_short");
  const postExample = parseXmlTag(rawOutput, "post_example");
  const postQuestion = parseXmlTag(rawOutput, "post_question");
  const niche = parseXmlTag(rawOutput, "niche");
  const painPoint = parseXmlTag(rawOutput, "pain_point");
  const outreachAngle = parseXmlTag(rawOutput, "outreach_angle");
  const prospectExample = parseXmlTag(rawOutput, "prospect_example");

  if (!postShort || !postExample || !postQuestion || !niche) {
    console.error("\nFailed to parse Claude output. Raw response:");
    console.error(rawOutput);
    process.exit(1);
  }

  printSeparator();
  console.log(orange.bold("POST VARIANT 1 (Short)"));
  console.log(orange("─".repeat(30)));
  console.log(orange(postShort));

  printSeparator();
  console.log(brown.bold("POST VARIANT 2 (Example-led)"));
  console.log(brown("─".repeat(30)));
  console.log(brown(postExample));

  printSeparator();
  console.log(chalk.yellow.bold("POST VARIANT 3 (Question/Observation)"));
  console.log(chalk.yellow("─".repeat(30)));
  console.log(chalk.yellow(postQuestion));

  printSeparator();
  console.log(chalk.green.bold("PROSPECTING ANGLE"));
  console.log(chalk.green("─".repeat(30)));
  console.log(chalk.green(`Target niche:     ${niche}`));
  console.log(chalk.green(`Pain point:       ${painPoint}`));
  console.log(chalk.green(`Outreach angle:   ${outreachAngle}`));
  console.log(chalk.green(`Example prospect: ${prospectExample}`));
  printSeparator();

  appendToLog({ rawIdea, postShort, postExample, postQuestion, niche, painPoint, outreachAngle, prospectExample });
  console.log(`Logged to log/content-log.md\n`);
}

function listEntries() {
  if (!fs.existsSync(LOG_PATH)) {
    console.log("No log found. Run the engine with an idea first.");
    return;
  }
  const content = fs.readFileSync(LOG_PATH, "utf8");
  const entries = content.split("\n---\n").filter((e) => e.trim().startsWith("##"));
  const last5 = entries.slice(-5).reverse();
  if (last5.length === 0) {
    console.log("No entries found.");
    return;
  }
  console.log(chalk.bold(`\nLast ${last5.length} entries:\n`));
  last5.forEach((entry) => {
    const header = entry.split("\n")[0].trim();
    console.log(chalk.cyan(header));
  });
  console.log();
}

function searchEntries(keyword) {
  if (!fs.existsSync(LOG_PATH)) {
    console.log("No log found. Run the engine with an idea first.");
    return;
  }
  const content = fs.readFileSync(LOG_PATH, "utf8");
  const entries = content.split("\n---\n").filter((e) => e.trim().startsWith("##"));
  const lower = keyword.toLowerCase();
  const matches = entries.filter((e) => e.toLowerCase().includes(lower));
  if (matches.length === 0) {
    console.log(`No entries matching "${keyword}".`);
    return;
  }
  console.log(chalk.bold(`\n${matches.length} match(es) for "${keyword}":\n`));
  matches.forEach((entry) => {
    const header = entry.split("\n")[0].trim();
    console.log(chalk.cyan(header));
    const lines = entry.split("\n").filter((l) => l.toLowerCase().includes(lower));
    lines.slice(0, 2).forEach((l) => console.log("  " + chalk.white(l.trim())));
    console.log();
  });
}

async function main() {
  const args = process.argv.slice(2);

  if (args[0] === "--list") {
    listEntries();
    return;
  }

  if (args[0] === "--search") {
    if (!args[1]) {
      console.error('Usage: node engine.js --search "keyword"');
      process.exit(1);
    }
    searchEntries(args.slice(1).join(" "));
    return;
  }

  if (args.length === 0) {
    console.error('Usage: node engine.js "Your raw idea here"');
    console.error('       node engine.js --list');
    console.error('       node engine.js --search "keyword"');
    process.exit(1);
  }

  const rawIdea = args.join(" ");

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Error: ANTHROPIC_API_KEY environment variable is not set.");
    process.exit(1);
  }

  try {
    await generateContent(rawIdea);
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      console.error("Authentication failed. Check your ANTHROPIC_API_KEY.");
    } else if (error instanceof Anthropic.RateLimitError) {
      console.error("Rate limited. Try again in a moment.");
    } else if (error instanceof Anthropic.APIError) {
      console.error(`API error (${error.status}): ${error.message}`);
    } else {
      console.error("Unexpected error:", error.message);
    }
    process.exit(1);
  }
}

main();
