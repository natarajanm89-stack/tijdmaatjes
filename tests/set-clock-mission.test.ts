import assert from "node:assert/strict";
import { test } from "node:test";
import { hourFromAngle, minuteFromAngle } from "../lib/clock-geometry.ts";
import { LEARNING_STEPS } from "../lib/dutch-time.ts";
import {
  checkClock,
  createMission,
  MISSION_SIZE,
  nextClock,
  recordAnswer,
  SET_CLOCK_LINES,
  startMission,
  settingSteps,
  wrongFeedback,
} from "../lib/set-clock-mission.ts";
import { allSpokenTexts } from "../lib/speech-clips.ts";

/** Small deterministic PRNG so every run checks the same missions. */
function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 2 ** 32;
    return seed / 2 ** 32;
  };
}

test("missions use the level's minutes, never repeat, and start away from the answer", () => {
  for (const step of LEARNING_STEPS) {
    for (let seed = 1; seed <= 50; seed += 1) {
      const mission = createMission(step.minutes, seeded(seed));
      assert.equal(mission.length, MISSION_SIZE);
      const keys = mission.map(({ target }) => `${target.hour}:${target.minute}`);
      assert.equal(new Set(keys).size, MISSION_SIZE, "no repeated times");
      mission.forEach((clock, index) => {
        assert.ok(step.minutes.includes(clock.target.minute));
        assert.ok(clock.target.hour >= 1 && clock.target.hour <= 12);
        assert.equal(checkClock(clock.target, clock.start).correct, false, "start is never already right");
        if (index < 3) {
          assert.equal(clock.presetHour, true);
          assert.equal(clock.start.hour, clock.target.hour, "short hand starts on the right hour");
        } else {
          assert.equal(clock.presetHour, false);
          assert.notEqual(clock.start.hour, clock.target.hour, "both hands must move");
          assert.notEqual(clock.start.minute, clock.target.minute, "both hands must move");
          assert.equal(clock.start.minute % 5, 0);
        }
      });
    }
  }
});

test("a first-try miss comes back once at the end, at most two retries", () => {
  let state = startMission([0, 30], seeded(7));
  // Miss the first three clocks (twice each), then get them right.
  for (let clock = 0; clock < 3; clock += 1) {
    state = recordAnswer(state, false);
    state = recordAnswer(state, false);
    state = recordAnswer(state, true);
    state = nextClock(state);
  }
  assert.equal(state.queue.length, MISSION_SIZE + 2);
  assert.deepEqual(state.queue.slice(-2).map((clock) => clock.retry), [true, true]);
  // Right on the first try for the rest, including the retries.
  while (!state.finished) state = nextClock(recordAnswer(state, true));
  assert.equal(state.firstTry, 2, "retried clocks don't count as first-try");
});

test("checkClock tells which hand is off", () => {
  const target = { hour: 8, minute: 25 };
  assert.deepEqual(checkClock(target, { hour: 8, minute: 25 }), { hourOk: true, minuteOk: true, correct: true });
  assert.deepEqual(checkClock(target, { hour: 9, minute: 25 }), { hourOk: false, minuteOk: true, correct: false });
  assert.deepEqual(checkClock(target, { hour: 8, minute: 35 }), { hourOk: true, minuteOk: false, correct: false });
  assert.equal(checkClock({ hour: 12, minute: 0 }, { hour: 0, minute: 0 }).correct, true, "0 and 12 are the same hour");
});

test("wrong feedback praises the right hand and instructs the other", () => {
  const target = { hour: 8, minute: 25 };
  const steps = settingSteps(target);
  const hourWrong = wrongFeedback(target, checkClock(target, { hour: 9, minute: 25 }));
  assert.ok(hourWrong[0].text.startsWith(SET_CLOCK_LINES.minuteOk));
  assert.deepEqual(hourWrong.slice(1), [steps.hour]);
  const minuteWrong = wrongFeedback(target, checkClock(target, { hour: 8, minute: 40 }));
  assert.ok(minuteWrong[0].text.startsWith(SET_CLOCK_LINES.hourOk));
  assert.deepEqual(minuteWrong.slice(1), [steps.minute]);
  assert.deepEqual(wrongFeedback(target, checkClock(target, { hour: 3, minute: 0 })), [steps.minute, steps.hour]);
});

test("setting instructions say where to put each hand", () => {
  assert.equal(settingSteps({ hour: 8, minute: 25 }).minute.text, "Vijf voor half: zet de lange wijzer één sprong vóór de halte.");
  assert.equal(settingSteps({ hour: 8, minute: 25 }).hour.text, "Je zegt negen, maar de korte wijzer staat tussen de 8 en de 9.");
  assert.equal(settingSteps({ hour: 8, minute: 10 }).hour.text, "Zet de korte wijzer bij de 8.");
  assert.equal(settingSteps({ hour: 12, minute: 50 }).hour.text, "Het is bijna één: zet de korte wijzer vlak vóór de 1.");
  const said = new Set(allSpokenTexts());
  for (let hour = 1; hour <= 12; hour += 1) {
    for (let minute = 0; minute < 60; minute += 5) {
      const { minute: m, hour: h } = settingSteps({ hour, minute });
      for (const line of [...m.say, ...h.say]) assert.ok(said.has(line), `missing clip: ${line}`);
    }
  }
});

test("dragging the short hand keeps the hour it really shows", () => {
  // At 8:40 the short hand sits at 260°, close to the 9 (270°): it still means 8.
  assert.equal(hourFromAngle(8 * 30 + 40 * 0.5, 40), 8);
  assert.equal(hourFromAngle(9 * 30, 0), 9);
  // Just before the 12 at 11:55, and wrapping round to 12 and 1.
  assert.equal(hourFromAngle(11 * 30 + 55 * 0.5, 55), 11);
  assert.equal(hourFromAngle(2, 0), 12);
  assert.equal(hourFromAngle(20, 50), 12);
  assert.equal(hourFromAngle(3, 50), 11, "3° is nearer 11:50 (355°) than 12:50 (25°)");
  assert.equal(hourFromAngle(30, 0), 1);
  assert.equal(minuteFromAngle(150), 25);
  assert.equal(minuteFromAngle(358), 0);
});
