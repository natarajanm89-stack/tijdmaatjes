import assert from "node:assert/strict";
import { test } from "node:test";
import { LEARNING_STEPS } from "../lib/dutch-time.ts";
import { LESSONS, lessonForLevel } from "../lib/lessons.ts";
import { DEFAULT_PROGRESS, normalizeProgress } from "../lib/progress.ts";
import { allSpokenTexts } from "../lib/speech-clips.ts";

test("each lesson teaches its own level's times and every line has a clip", () => {
  const said = new Set(allSpokenTexts());
  for (const lesson of LESSONS) {
    assert.equal(lessonForLevel(lesson.level), lesson);
    const minutes = LEARNING_STEPS[lesson.level - 1].minutes;
    for (const screen of lesson.screens) {
      assert.ok(minutes.includes(screen.minute), `${lesson.id}: ${screen.minute} is taught on this level`);
      for (const line of screen.lines) {
        assert.ok(line.length <= 80, line);
        assert.ok(said.has(line), `missing clip: ${line}`);
      }
    }
    const { start, target, lines, success } = lesson.challenge;
    assert.equal(start.hour, target.hour, "challenge only needs the long hand");
    assert.notEqual(start.minute, target.minute);
    for (const line of [...lines, success]) assert.ok(said.has(line), `missing clip: ${line}`);
  }
  assert.equal(lessonForLevel(1), null);
});

test("counting words used by Luister have clips", () => {
  const said = new Set(allSpokenTexts());
  for (const word of ["vijf", "tien"]) assert.ok(said.has(word), word);
});

test("progress from older versions keeps the rond-half lesson as seen", () => {
  const old = normalizeProgress({ stars: 4, seenRondHalfLesson: true });
  assert.deepEqual(old.seenLessons, { "rond-half": true });
  assert.equal(old.stars, 4);
  assert.equal("seenRondHalfLesson" in old, false);
  assert.deepEqual(normalizeProgress({}).trickyMinutes, DEFAULT_PROGRESS.trickyMinutes);
});
