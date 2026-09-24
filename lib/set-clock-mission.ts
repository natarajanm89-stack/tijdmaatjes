import { hourWord, normalizeHour } from "./dutch-time.ts";
import type { DayMoment } from "./games.ts";
import { pickMinute, type SavedProgress } from "./progress.ts";
import type { ExplanationStep } from "./time-explainer.ts";

// "Zet de klok": the child hears a time and sets the hands. A mission is five
// clocks; the first three start on the right hour (only the long hand moves),
// the last two start on a wrong time so both hands must be set.

export type ClockTime = { hour: number; minute: number };

export type MissionClock = {
  target: ClockTime;
  start: ClockTime;
  /** The short hand already points at the right hour. */
  presetHour: boolean;
  /** A clock missed on the first try, asked once more at the end. */
  retry: boolean;
  /** "Mijn dag": the moment of the day this clock belongs to. */
  moment?: DayMoment;
};

export type MissionState = {
  queue: MissionClock[];
  index: number;
  /** Wrong tries on the current clock. */
  attempts: number;
  /** Original (non-retry) clocks answered right on the first try. */
  firstTry: number;
  finished: boolean;
};

export const MISSION_SIZE = 5;
const PRESET_CLOCKS = 3;
const MAX_RETRIES = 2;

export const SET_CLOCK_LINES = {
  prompt: "Zet de klok op",
  correct: ["Goed zo!", "Super!", "Knap gedaan!"],
  minuteOk: "De lange wijzer staat goed!",
  hourOk: "De korte wijzer staat goed!",
  lookHour: "Kijk nu naar de korte wijzer.",
  lookMinute: "Kijk nu naar de lange wijzer.",
  done: "Missie klaar! Jij bent een klokkampioen.",
};

// Instructions for SETTING the clock ("zet ..."), unlike explainTime's steps,
// which describe a clock that is already set ("de lange wijzer staat ...").
const MINUTE_INSTRUCTIONS: Record<number, string> = {
  0: "Zet de lange wijzer op de 12.",
  5: "Vijf over: zet de lange wijzer één sprong na de 12.",
  10: "Tien over: zet de lange wijzer twee sprongen na de 12.",
  15: "Kwart over: zet de lange wijzer op de 3.",
  20: "Tien voor half: zet de lange wijzer twee sprongen vóór de halte.",
  25: "Vijf voor half: zet de lange wijzer één sprong vóór de halte.",
  30: "Half: zet de lange wijzer op de halte bij de 6.",
  35: "Vijf over half: zet de lange wijzer één sprong na de halte.",
  40: "Tien over half: zet de lange wijzer twee sprongen na de halte.",
  45: "Kwart voor: zet de lange wijzer op de 9.",
  50: "Tien voor: zet de lange wijzer twee sprongen vóór de 12.",
  55: "Vijf voor: zet de lange wijzer één sprong vóór de 12.",
};

const HOUR_ON = "Zet de korte wijzer bij de";
const HOUR_BETWEEN = "Bij half staat de korte wijzer tussen twee getallen.";
const NEXT_HOUR = "Noem het volgende uur:";
const HOUR_BEFORE_NEXT = "Zet de korte wijzer vlak vóór het volgende uur:";

export function settingSteps(target: ClockTime): { minute: ExplanationStep; hour: ExplanationStep } {
  const current = normalizeHour(target.hour);
  const next = normalizeHour(current + 1);
  const minuteText = MINUTE_INSTRUCTIONS[target.minute] ?? MINUTE_INSTRUCTIONS[0];
  let hour: ExplanationStep;
  if (target.minute < 20) {
    hour = { text: `${HOUR_ON} ${current}.`, say: [HOUR_ON, hourWord(current)] };
  } else if (target.minute <= 40) {
    hour = {
      text: `Je zegt ${hourWord(next)}, maar de korte wijzer staat tussen de ${current} en de ${next}.`,
      say: [HOUR_BETWEEN, NEXT_HOUR, hourWord(next)],
    };
  } else {
    hour = {
      text: `Het is bijna ${hourWord(next)}: zet de korte wijzer vlak vóór de ${next}.`,
      say: [HOUR_BEFORE_NEXT, hourWord(next)],
    };
  }
  return { minute: { text: minuteText, say: [minuteText] }, hour };
}

export function allSetClockLines() {
  const { correct, ...single } = SET_CLOCK_LINES;
  const lines = new Set([...Object.values(single), ...correct, ...Object.values(MINUTE_INSTRUCTIONS)]);
  for (let hour = 1; hour <= 12; hour += 1) {
    for (const minute of [0, 30, 45]) settingSteps({ hour, minute }).hour.say.forEach((line) => lines.add(line));
  }
  return [...lines];
}

export function createMission(
  minutes: number[],
  random: () => number = Math.random,
  trickyMinutes: SavedProgress["trickyMinutes"] = {},
): MissionClock[] {
  const targets: ClockTime[] = [];
  const seen = new Set<string>();
  const possible = 12 * minutes.length;
  while (targets.length < Math.min(MISSION_SIZE, possible)) {
    const target = { hour: Math.floor(random() * 12) + 1, minute: pickMinute(minutes, trickyMinutes, random) };
    const key = `${target.hour}:${target.minute}`;
    if (seen.has(key)) continue;
    seen.add(key);
    targets.push(target);
  }
  return buildClocks(targets, random);
}

/** Start positions: clocks 1–3 start on the right hour, later ones start wrong on both hands. */
function buildClocks(targets: ClockTime[], random: () => number): MissionClock[] {
  return targets.map((target, index) => {
    const presetHour = index < PRESET_CLOCKS;
    let start: ClockTime;
    if (presetHour) {
      // Same hour, long hand elsewhere: on the 12, or on the 6 for whole hours.
      start = { hour: target.hour, minute: target.minute === 0 ? 30 : 0 };
    } else {
      // Both hands wrong, so both have to move.
      const hour = normalizeHour(target.hour + 1 + Math.floor(random() * 10));
      const minute = (target.minute + 5 * (1 + Math.floor(random() * 11))) % 60;
      start = { hour, minute };
    }
    return { target, start, presetHour, retry: false };
  });
}

/** "Mijn dag": the day's moments in order, with the same start positions as a mission. */
export function createMyDayMission(moments: DayMoment[], random: () => number = Math.random): MissionClock[] {
  return buildClocks(moments.map((moment) => moment.time), random)
    .map((clock, index) => ({ ...clock, moment: moments[index] }));
}

export function startQueue(queue: MissionClock[]): MissionState {
  return { queue, index: 0, attempts: 0, firstTry: 0, finished: false };
}

export function startMission(
  minutes: number[],
  random: () => number = Math.random,
  trickyMinutes: SavedProgress["trickyMinutes"] = {},
): MissionState {
  return startQueue(createMission(minutes, random, trickyMinutes));
}

export function checkClock(target: ClockTime, set: ClockTime) {
  const hourOk = normalizeHour(set.hour) === normalizeHour(target.hour);
  const minuteOk = set.minute === target.minute;
  return { hourOk, minuteOk, correct: hourOk && minuteOk };
}

/** Records one "Klaar!" press on the current clock. */
export function recordAnswer(state: MissionState, correct: boolean): MissionState {
  const clock = state.queue[state.index];
  if (correct) {
    const counts = state.attempts === 0 && !clock.retry;
    return { ...state, firstTry: state.firstTry + (counts ? 1 : 0) };
  }
  const retries = state.queue.filter((item) => item.retry).length;
  const requeue = state.attempts === 0 && !clock.retry && retries < MAX_RETRIES;
  return {
    ...state,
    attempts: state.attempts + 1,
    queue: requeue ? [...state.queue, { ...clock, retry: true }] : state.queue,
  };
}

export function nextClock(state: MissionState): MissionState {
  const index = state.index + 1;
  return { ...state, index, attempts: 0, finished: index >= state.queue.length };
}

/** What to show and say after a wrong setting: praise the right hand, instruct the wrong one(s). */
export function wrongFeedback(target: ClockTime, result: ReturnType<typeof checkClock>): ExplanationStep[] {
  const steps = settingSteps(target);
  if (result.minuteOk) {
    return [
      { text: `${SET_CLOCK_LINES.minuteOk} ${SET_CLOCK_LINES.lookHour}`, say: [SET_CLOCK_LINES.minuteOk, SET_CLOCK_LINES.lookHour] },
      steps.hour,
    ];
  }
  if (result.hourOk) {
    return [
      { text: `${SET_CLOCK_LINES.hourOk} ${SET_CLOCK_LINES.lookMinute}`, say: [SET_CLOCK_LINES.hourOk, SET_CLOCK_LINES.lookMinute] },
      steps.minute,
    ];
  }
  // Long hand first: moving it also carries the short hand along.
  return [steps.minute, steps.hour];
}
