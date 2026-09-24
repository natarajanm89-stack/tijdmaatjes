import assert from "node:assert/strict";
import { test } from "node:test";
import { guideModeFor, RING } from "../lib/clock-ring.ts";
import { formatDutchTime } from "../lib/dutch-time.ts";
import {
  allGameLines,
  countAroundTime,
  createHourHandRounds,
  hourHandChoices,
  hourHandKind,
  MY_DAY,
} from "../lib/games.ts";
import { applyAnswer, DEFAULT_PROGRESS } from "../lib/progress.ts";
import { createMyDayMission } from "../lib/set-clock-mission.ts";
import { allSpokenTexts } from "../lib/speech-clips.ts";
import { explainTime } from "../lib/time-explainer.ts";

test("the ring shows what Dutch says at each number, never 20/25/45/50/55", () => {
  for (const label of RING) {
    const phrase = formatDutchTime(8, label.minute);
    if (label.minute === 0) assert.ok(phrase.endsWith("uur"));
    else assert.ok(phrase.startsWith(label.words), `${label.minute}: "${phrase}" starts with "${label.words}"`);
    assert.ok(!["20", "25", "45", "50", "55"].includes(label.text), label.text);
  }
  assert.equal(RING.length, 12);
});

test("helpers use halves near the 12 and quarters when counting from half", () => {
  for (const minute of [0, 5, 10, 15, 30, 45, 50, 55]) assert.equal(guideModeFor(explainTime(8, minute)), "halves", `${minute}`);
  for (const minute of [20, 25, 35, 40]) assert.equal(guideModeFor(explainTime(8, minute)), "quarters", `${minute}`);
});

test("tel mee walks the long hand one five-minute step per number", () => {
  assert.deepEqual(countAroundTime(8, 1), { hour: 8, minute: 5 });
  assert.deepEqual(countAroundTime(8, 11), { hour: 8, minute: 55 });
  assert.deepEqual(countAroundTime(8, 12), { hour: 9, minute: 0 });
  assert.deepEqual(countAroundTime(12, 12), { hour: 1, minute: 0 });
});

test("korte wijzer eerst: choices name the right hours and every round has one right answer", () => {
  assert.deepEqual(hourHandChoices(8).map((choice) => choice.text), ["net na 8 uur", "ongeveer half 9", "bijna 9 uur"]);
  assert.deepEqual(hourHandChoices(12)[1].say, ["ongeveer half", "één"]);
  let seed = 11;
  const random = () => (seed = (seed * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32;
  for (let run = 0; run < 30; run += 1) {
    const rounds = createHourHandRounds(5, random);
    assert.equal(rounds.length, 5);
    assert.equal(new Set(rounds.map((round) => `${round.hour}:${round.minute}`)).size, 5);
    const kinds = new Set(rounds.map((round) => hourHandKind(round.minute)));
    assert.equal(kinds.size, 3, "each kind appears at least once");
  }
});

test("mijn dag: every sentence says its clock's time, in day order", () => {
  for (const moment of MY_DAY) {
    const phrase = formatDutchTime(moment.time.hour, moment.time.minute);
    assert.ok(moment.sentence.includes(phrase), `"${moment.sentence}" says "${phrase}"`);
  }
  const mission = createMyDayMission(MY_DAY, () => 0.5);
  assert.deepEqual(mission.map((clock) => clock.moment?.title), MY_DAY.map((moment) => moment.title));
  assert.deepEqual(mission.map((clock) => clock.target), MY_DAY.map((moment) => moment.time));
});

test("mijn dag earns stars without unlocking levels", () => {
  const progress = applyAnswer(DEFAULT_PROGRESS, { level: 3, minute: 0, correct: true, firstTry: true, rewarded: true, levelWin: false });
  assert.equal(progress.stars, 1);
  assert.equal(progress.levelWins[3], undefined);
});

test("every game line has a clip", () => {
  const said = new Set(allSpokenTexts());
  for (const line of allGameLines()) assert.ok(said.has(line), line);
});
