import assert from "node:assert/strict";
import { test } from "node:test";
import { applyAnswer, DEFAULT_PROGRESS, pickMinute, WINS_TO_UNLOCK } from "../lib/progress.ts";

const answer = { level: 3 as const, minute: 45, correct: true, firstTry: true, rewarded: true };

test("rewarded answers earn a star and a level win, and unlock the next level", () => {
  let progress = DEFAULT_PROGRESS;
  for (let win = 0; win < WINS_TO_UNLOCK; win += 1) progress = applyAnswer(progress, answer);
  assert.equal(progress.stars, WINS_TO_UNLOCK);
  assert.equal(progress.levelWins[3], WINS_TO_UNLOCK);
  assert.equal(progress.unlockedLevel, 4);
});

test("unrewarded right answers (retried clocks) give no star or win", () => {
  const progress = applyAnswer(DEFAULT_PROGRESS, { ...answer, rewarded: false });
  assert.equal(progress.stars, 0);
  assert.equal(progress.levelWins[3], undefined);
});

test("misses mark a minute pattern as tricky; first-try hits wear it off", () => {
  let progress = DEFAULT_PROGRESS;
  for (let miss = 0; miss < 5; miss += 1) progress = applyAnswer(progress, { ...answer, minute: 25, correct: false });
  assert.equal(progress.trickyMinutes[25], 3, "weight is capped");
  assert.equal(progress.streak, 0);
  progress = applyAnswer(progress, { ...answer, minute: 25, firstTry: false });
  assert.equal(progress.trickyMinutes[25], 3, "a right answer after a wrong try doesn't count");
  for (let hit = 0; hit < 3; hit += 1) progress = applyAnswer(progress, { ...answer, minute: 25 });
  assert.equal(25 in progress.trickyMinutes, false);
});

test("pickMinute favors tricky patterns of this level only", () => {
  let seed = 3;
  const random = () => (seed = (seed * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32;
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
  const counts = new Map<number, number>();
  for (let draw = 0; draw < 5000; draw += 1) {
    const minute = pickMinute(minutes, { 25: 3, 7: 3 }, random);
    counts.set(minute, (counts.get(minute) ?? 0) + 1);
  }
  const share25 = (counts.get(25) ?? 0) / 5000;
  assert.ok(share25 > 0.4 && share25 < 0.5, `tricky :25 drawn ${share25}`); // ~0.4 + 0.6/12
  assert.equal(counts.has(7), false, "patterns outside the level are never drawn");
  assert.equal(pickMinute([0], { 25: 3 }, random), 0);
});
