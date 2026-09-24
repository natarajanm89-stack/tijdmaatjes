import assert from "node:assert/strict";
import { test } from "node:test";
import { formatDutchTime } from "../lib/dutch-time.ts";
import { allSpokenTexts, allTimePhrases, speechClipPath } from "../lib/speech-clips.ts";
import { explainTime } from "../lib/time-explainer.ts";

const everyTime = Array.from({ length: 12 }, (_, index) => index + 1)
  .flatMap((hour) => Array.from({ length: 12 }, (_, step) => ({ hour, minute: step * 5 })));

test("chunks always spell the Dutch phrase", () => {
  for (const { hour, minute } of everyTime) {
    const explanation = explainTime(hour, minute);
    assert.equal(explanation.chunks.map((chunk) => chunk.text).join(" "), formatDutchTime(hour, minute));
  }
});

test("voor half and over half count jumps from the halte and name the next hour", () => {
  assert.deepEqual(pick(explainTime(8, 20)), { zone: "voor-half", anchor: 30, jumps: 2, namedHour: 9 });
  assert.deepEqual(pick(explainTime(8, 25)), { zone: "voor-half", anchor: 30, jumps: 1, namedHour: 9 });
  assert.deepEqual(pick(explainTime(8, 35)), { zone: "over-half", anchor: 30, jumps: 1, namedHour: 9 });
  assert.deepEqual(pick(explainTime(8, 40)), { zone: "over-half", anchor: 30, jumps: 2, namedHour: 9 });
});

test("five and ten over/voor count jumps from the 12", () => {
  assert.deepEqual(pick(explainTime(8, 5)), { zone: "over", anchor: 0, jumps: 1, namedHour: 8 });
  assert.deepEqual(pick(explainTime(8, 50)), { zone: "voor", anchor: 60, jumps: 2, namedHour: 9 });
});

test("the next hour wraps from twaalf to één", () => {
  assert.equal(explainTime(12, 30).phrase, "half één");
  assert.equal(explainTime(12, 30).namedHour, 1);
  assert.equal(explainTime(12, 25).chunks.at(-1)?.text, "één");
});

test("every step is short enough for the TTS route and has a clip", () => {
  for (const { hour, minute } of everyTime) {
    const { steps } = explainTime(hour, minute);
    assert.equal(steps.length, 3);
    for (const step of steps) for (const line of step.say) assert.ok(line.length <= 80, line);
  }
  const texts = allSpokenTexts();
  assert.equal(new Set(texts.map(speechClipPath)).size, texts.length, "clip file names must be unique");
  // Guards against narration multiplying per hour and minute (144 × lines).
  assert.ok(texts.length - allTimePhrases().length < 150, "narration stays a small, fixed set");
});

function pick({ zone, anchor, jumps, namedHour }: ReturnType<typeof explainTime>) {
  return { zone, anchor, jumps, namedHour };
}
