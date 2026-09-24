// Listens back to every clip in public/audio/ with ElevenLabs speech-to-text
// and reports clips whose words differ from the text they should say, e.g. a
// "12" not read as "twaalf". Uses the same key as generation.
//
//   pnpm speech:check            # all clips
//   pnpm speech:check -- sprong  # only texts containing "sprong"
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { allSpokenTexts, speechClipPath } from "../lib/speech-clips.ts";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(`${projectRoot}${file}`);
  } catch {
    // Either file is optional.
  }
}
const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) {
  console.error("Set ELEVENLABS_API_KEY in .env or .env.local first.");
  process.exit(1);
}

const NUMBER_WORDS = ["nul", "een", "twee", "drie", "vier", "vijf", "zes", "zeven", "acht", "negen", "tien", "elf", "twaalf"];

function words(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(1[0-2]|[0-9])\b/g, (digits) => NUMBER_WORDS[Number(digits)])
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

const filter = process.argv.slice(2).filter((arg) => arg !== "--").join(" ").toLowerCase();
const texts = allSpokenTexts().filter((text) => text.toLowerCase().includes(filter));
const mismatches = [];
let checked = 0;

for (const text of texts) {
  const file = `${projectRoot}public${speechClipPath(text)}`;
  if (!existsSync(file)) {
    mismatches.push({ text, heard: "(no clip — run pnpm speech:generate)" });
    continue;
  }
  const form = new FormData();
  form.append("model_id", "scribe_v1");
  form.append("language_code", "nld");
  form.append("tag_audio_events", "false");
  form.append("file", new Blob([readFileSync(file)], { type: "audio/mpeg" }), "clip.mp3");
  const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: { "xi-api-key": apiKey },
    body: form,
  });
  if (!response.ok) {
    console.error(`Speech-to-text failed for "${text}": ${response.status} ${await response.text()}`);
    process.exit(1);
  }
  const heard = (await response.json()).text ?? "";
  checked += 1;
  // Compare without spaces: transcribers write "half tien" as "halftien".
  if (words(heard).join("") !== words(text).join("")) mismatches.push({ text, heard });
  process.stdout.write(checked % 20 === 0 ? `${checked}/${texts.length}\n` : "");
}

console.log(`\nChecked ${checked} clip(s); ${mismatches.length} differ:`);
for (const { text, heard } of mismatches) console.log(`- expected: ${text}\n  heard:    ${heard}`);
