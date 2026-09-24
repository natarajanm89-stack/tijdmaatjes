// Pre-generates every clock phrase with ElevenLabs into public/audio/ so the app
// plays static files instead of calling the API. Existing clips are kept, so a
// rerun only fills gaps; delete a file (or public/audio/) to regenerate it.
//
//   pnpm speech:generate
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { requestElevenLabsSpeech } from "../lib/elevenlabs.ts";
import { allTimePhrases, speechClipPath } from "../lib/speech-clips.ts";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(`${projectRoot}${file}`);
  } catch {
    // Either file is optional.
  }
}

const { ELEVENLABS_API_KEY: apiKey, ELEVENLABS_VOICE_ID: voiceId } = process.env;
if (!apiKey || !voiceId) {
  console.error("Set ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID in .env or .env.local first.");
  process.exit(1);
}

mkdirSync(`${projectRoot}public/audio`, { recursive: true });
let generated = 0;
let skipped = 0;
for (const phrase of allTimePhrases()) {
  const target = `${projectRoot}public${speechClipPath(phrase)}`;
  if (existsSync(target)) {
    skipped += 1;
    continue;
  }
  const response = await requestElevenLabsSpeech(apiKey, voiceId, phrase);
  if (!response.ok) {
    console.error(`ElevenLabs failed for "${phrase}": ${response.status} ${await response.text()}`);
    process.exit(1);
  }
  writeFileSync(target, Buffer.from(await response.arrayBuffer()));
  generated += 1;
  console.log(`✓ ${phrase}`);
}
console.log(`Generated ${generated} clip(s), kept ${skipped} existing.`);
