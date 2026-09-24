import { hourWord, normalizeHour } from "./dutch-time.ts";
import type { ClockTime } from "./set-clock-mission.ts";

// Practice games in the "Spelen" tab. Each follows a common clock-teaching step:
//  - Tel mee rond de klok: count the long hand around in steps of five.
//  - Korte wijzer eerst: read the hour from the short hand alone.
//  - Mijn dag: set the clock for moments in the child's own day.

/* ---------- Tel mee rond de klok ---------- */

export const COUNT_AROUND_LINES = {
  intro: "Tik op de getallen, van 1 tot 12. Elke stap is vijf minuten.",
  find: "Zoek de",
  done: "Rondje klaar! De lange wijzer liep een heel uur.",
};

/** Clock time after tapping `number` (1–12) when the round started at `startHour` o'clock. */
export function countAroundTime(startHour: number, number: number): ClockTime {
  if (number === 12) return { hour: normalizeHour(startHour + 1), minute: 0 };
  return { hour: startHour, minute: number * 5 };
}

/* ---------- Korte wijzer eerst ---------- */

export type HourHandKind = "net-na" | "half" | "bijna";

export const HOUR_HAND_LINES = {
  intro: "Kijk alleen naar de korte wijzer. Hoe laat is het ongeveer?",
  choice: { "net-na": "net na", half: "ongeveer half", bijna: "bijna" } as Record<HourHandKind, string>,
  why: {
    "net-na": "Staat de korte wijzer vlak na een getal? Dan is het net na dat uur.",
    half: "Staat hij midden tussen twee getallen? Dan is het ongeveer half.",
    bijna: "Staat hij vlak vóór een getal? Dan is het bijna dat uur.",
  } as Record<HourHandKind, string>,
  reveal: "Kijk, zo laat is het precies:",
};

const HOUR_HAND_MINUTES: Record<HourHandKind, number[]> = {
  "net-na": [5, 10],
  half: [25, 30, 35],
  bijna: [50, 55],
};

export type HourHandChoice = { kind: HourHandKind; text: string; say: string[] };

/** The three answers for a short hand between `hour` and the next hour. */
export function hourHandChoices(hour: number): HourHandChoice[] {
  const current = normalizeHour(hour);
  const next = normalizeHour(current + 1);
  const { choice } = HOUR_HAND_LINES;
  return [
    { kind: "net-na", text: `net na ${current} uur`, say: [choice["net-na"], hourWord(current)] },
    // Half names the NEXT hour: halfway to 9 is "half negen".
    { kind: "half", text: `ongeveer half ${next}`, say: [choice.half, hourWord(next)] },
    { kind: "bijna", text: `bijna ${next} uur`, say: [choice.bijna, hourWord(next)] },
  ];
}

export function hourHandKind(minute: number): HourHandKind {
  if (minute <= 15) return "net-na";
  if (minute < 45) return "half";
  return "bijna";
}

export function createHourHandRounds(count: number, random: () => number = Math.random): ClockTime[] {
  const kinds: HourHandKind[] = ["net-na", "half", "bijna"];
  const rounds: ClockTime[] = [];
  const seen = new Set<string>();
  while (rounds.length < count) {
    // Cycle through the kinds so every round of five has each one.
    const kind = rounds.length < kinds.length
      ? kinds[rounds.length]
      : kinds[Math.floor(random() * kinds.length)];
    const minutes = HOUR_HAND_MINUTES[kind];
    const time = { hour: Math.floor(random() * 12) + 1, minute: minutes[Math.floor(random() * minutes.length)] };
    const key = `${time.hour}:${time.minute}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rounds.push(time);
  }
  // Shuffle so the kinds don't always come in the same order.
  for (let index = rounds.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [rounds[index], rounds[swap]] = [rounds[swap], rounds[index]];
  }
  return rounds;
}

/* ---------- Mijn dag ---------- */

export type DayMoment = { emoji: string; title: string; time: ClockTime; sentence: string };

export const MY_DAY: DayMoment[] = [
  { emoji: "🌅", title: "Opstaan", time: { hour: 7, minute: 0 }, sentence: "Om zeven uur sta ik op." },
  { emoji: "🥣", title: "Ontbijt", time: { hour: 7, minute: 30 }, sentence: "Om half acht eet ik mijn ontbijt." },
  { emoji: "🎒", title: "Naar school", time: { hour: 8, minute: 15 }, sentence: "Om kwart over acht ga ik naar school." },
  { emoji: "🥪", title: "Lunch", time: { hour: 12, minute: 0 }, sentence: "Om twaalf uur eet ik mijn boterham." },
  { emoji: "🏠", title: "Naar huis", time: { hour: 3, minute: 0 }, sentence: "Om drie uur ga ik naar huis." },
  { emoji: "🍝", title: "Avondeten", time: { hour: 6, minute: 0 }, sentence: "Om zes uur eten we samen." },
  { emoji: "🛁", title: "In bad", time: { hour: 6, minute: 45 }, sentence: "Om kwart voor zeven ga ik in bad." },
  { emoji: "🛏️", title: "Naar bed", time: { hour: 7, minute: 30 }, sentence: "Om half acht ga ik naar bed." },
];

export const MY_DAY_LINES = {
  intro: "Zet de klok voor elk moment van jouw dag.",
  done: "Wat een mooie dag! Jij kent de tijden van je dag.",
};

/* ---------- All spoken lines, for clip generation ---------- */

export function allGameLines() {
  const lines = new Set<string>([
    ...Object.values(COUNT_AROUND_LINES),
    HOUR_HAND_LINES.intro,
    HOUR_HAND_LINES.reveal,
    ...Object.values(HOUR_HAND_LINES.choice),
    ...Object.values(HOUR_HAND_LINES.why),
    ...MY_DAY.map((moment) => moment.sentence),
    ...Object.values(MY_DAY_LINES),
  ]);
  return [...lines];
}
