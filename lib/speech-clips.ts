import { formatDutchTime } from "./dutch-time.ts";

// Every phrase the app can speak is a clock time on a five-minute step, so the
// whole set can be pre-generated once into public/audio/ and served statically.
export function speechClipPath(text: string) {
  const slug = text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `/audio/${slug}.mp3`;
}

export function allTimePhrases() {
  const phrases = new Set<string>();
  for (let hour = 1; hour <= 12; hour += 1) {
    for (let minute = 0; minute < 60; minute += 5) {
      phrases.add(formatDutchTime(hour, minute));
    }
  }
  return [...phrases];
}
