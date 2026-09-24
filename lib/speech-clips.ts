import { formatDutchTime } from "./dutch-time.ts";
import { allGameLines } from "./games.ts";
import { LESSONS } from "./lessons.ts";
import { allSetClockLines } from "./set-clock-mission.ts";
import { explainTime } from "./time-explainer.ts";

// Everything the app can speak is known up front: clock times on five-minute
// steps, explanation steps, and mini-lesson lines. The whole set is
// pre-generated once into public/audio/ and served statically.
export function speechClipPath(text: string) {
  const slug = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
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
  for (const lesson of LESSONS) {
    for (const screen of lesson.screens) screen.lines.forEach((line) => lines.add(line));
    lesson.challenge.lines.forEach((line) => lines.add(line));
    lines.add(lesson.challenge.success);
  }
  allSetClockLines().forEach((line) => lines.add(line));
  allGameLines().forEach((line) => lines.add(line));
  return [...lines];
}

export function allSpokenTexts() {
  return [...new Set([...allTimePhrases(), ...allNarrationLines()])];
}
