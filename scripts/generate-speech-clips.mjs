// Pre-generates every spoken text (clock phrases, hints, lesson lines) with
// ElevenLabs into public/audio/ so the app plays static files instead of
// calling the API. Existing clips are kept, so a
// rerun only fills gaps; delete a file (or public/audio/) to regenerate it.
//
//   pnpm speech:generate
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { requestElevenLabsSpeech } from "../lib/elevenlabs.ts";
import { allSpokenTexts, speechClipPath } from "../lib/speech-clips.ts";
import { allTamilParts, tamilClipPath } from "../lib/tamil.ts";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(`${projectRoot}${file}`);
  } catch {
    // Either file is optional.
  }
}

const { ELEVENLABS_API_KEY: apiKey, ELEVENLABS_VOICE_ID: voiceId, ELEVENLABS_VOICE_ID_TA: tamilVoiceId } = process.env;
if (!apiKey || !voiceId) {
  console.error("Set ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID in .env or .env.local first.");
  process.exit(1);
}

async function generate(texts, pathFor, voice, languageCode) {
  let generated = 0;
  let skipped = 0;
  for (const text of texts) {
    const target = `${projectRoot}public${pathFor(text)}`;
    if (existsSync(target)) {
      skipped += 1;
      continue;
    }
    const response = await requestElevenLabsSpeech(apiKey, voice, text, languageCode);
    if (!response.ok) {
      console.error(`ElevenLabs failed for "${text}": ${response.status} ${await response.text()}`);
      process.exit(1);
    }
    writeFileSync(target, Buffer.from(await response.arrayBuffer()));
    generated += 1;
    console.log(`✓ ${text}`);
  }
  console.log(`[${languageCode}] Generated ${generated} clip(s), kept ${skipped} existing.`);
}

mkdirSync(`${projectRoot}public/audio/ta`, { recursive: true });
await generate(allSpokenTexts(), speechClipPath, voiceId, "nl");
if (tamilVoiceId) {
  await generate(allTamilParts().tamil, tamilClipPath, tamilVoiceId, "ta");
} else {
  console.log("[ta] Skipped: set ELEVENLABS_VOICE_ID_TA to generate the Tamil explanations.");
}
