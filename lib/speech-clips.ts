import { formatDutchTime } from "./dutch-time.ts";
import { RONDHALF_CHALLENGE, RONDHALF_LESSON } from "./rond-half-lesson.ts";
import { explainTime } from "./time-explainer.ts";

// Everything the app can speak is known up front: clock times on five-minute
// steps, explanation steps, and mini-lesson lines. The whole set is
// pre-generated once into public/audio/ and served statically.
export function speechClipPath(text: string) {
  const slug = text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `/audio/${slug}.mp3`;
}

function everyClockTime() {
  const times: { hour: number; minute: number }[] = [];
  for (let hour = 1; hour <= 12; hour += 1) {
    for (let minute = 0; minute < 60; minute += 5) times.push({ hour, minute });
  }
  return times;
}

export function allTimePhrases() {
  return [...new Set(everyClockTime().map(({ hour, minute }) => formatDutchTime(hour, minute)))];
}

export function allNarrationLines() {
  const lines = new Set<string>();
  for (const { hour, minute } of everyClockTime()) {
    for (const step of explainTime(hour, minute).steps) step.say.forEach((line) => lines.add(line));
  }
  for (const screen of RONDHALF_LESSON) screen.lines.forEach((line) => lines.add(line));
  RONDHALF_CHALLENGE.lines.forEach((line) => lines.add(line));
  lines.add(RONDHALF_CHALLENGE.success);
  return [...lines];
}

export function allSpokenTexts() {
  return [...new Set([...allTimePhrases(), ...allNarrationLines()])];
}
